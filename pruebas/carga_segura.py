#!/usr/bin/env python3
"""NOVATIX: carga HTTP GET de solo lectura; maximo 25 solicitudes simultaneas.

No modifica bases, contenedores, redes ni replicas. Usa equipos/1 para evitar
listar colecciones grandes o consultar datos personales.
"""
import argparse
import collections
import concurrent.futures
import datetime
import json
import math
import platform
import statistics
import sys
import time
from pathlib import Path
from urllib.error import HTTPError, URLError
from urllib.request import Request, build_opener, ProxyHandler

URL = "http://192.168.100.3:8080/api/equipos/1"
OPENER = build_opener(ProxyHandler({}))

def peticion():
    inicio = time.perf_counter()
    status, replica, fallo = None, None, None
    try:
        req = Request(URL, headers={"Accept": "application/json",
                                    "Connection": "close",
                                    "User-Agent": "NOVATIX-benchmark-lectura/1.0"},
                      method="GET")
        with OPENER.open(req, timeout=6) as respuesta:
            status = respuesta.status
            replica = respuesta.headers.get("X-Replica")
            respuesta.read(32768)
    except HTTPError as error:
        status = error.code
        replica = error.headers.get("X-Replica")
    except (URLError, TimeoutError, OSError) as error:
        fallo = type(error).__name__
    return {"ms": (time.perf_counter() - inicio) * 1000,
            "http": status, "replica": replica, "error": fallo}

def escenario(concurrencia, solicitudes):
    inicio = time.perf_counter()
    with concurrent.futures.ThreadPoolExecutor(max_workers=concurrencia) as pool:
        res = list(pool.map(lambda _: peticion(), range(solicitudes)))
    duracion = time.perf_counter() - inicio
    latencias = sorted(x["ms"] for x in res)
    satisfactorias = sum(1 for x in res if x["http"] == 200)
    errores = sum(1 for x in res if x["error"] is not None)
    no200 = sum(1 for x in res if x["http"] is not None and x["http"] != 200)
    replicas = collections.Counter(x["replica"] for x in res if x["replica"] and x["http"] == 200)
    return {
        "concurrencia": concurrencia, "solicitudes": solicitudes,
        "duracion_s": round(duracion, 3),
        "rps": round(solicitudes / max(duracion, 0.00001), 2),
        "http_200": satisfactorias, "http_no_200": no200,
        "errores_red": errores,
        "latencia_media_ms": round(statistics.mean(latencias), 2),
        "latencia_p95_ms": round(latencias[math.ceil(len(latencias) * 0.95) - 1], 2),
        "latencia_max_ms": round(latencias[-1], 2),
        "respuestas_por_replica": dict(sorted(replicas.items()))
    }

def main():
    parser = argparse.ArgumentParser(description="Prueba limitada GET NOVATIX, sin modificar datos")
    parser.add_argument("--concurrencias", default="1,10,25", help="Ej.: 1,10,25 (maximo 25)")
    parser.add_argument("--solicitudes", type=int, default=120, help="Por escenario; maximo 300")
    parser.add_argument("--salida", default="", help="JSON de resultados; debe ser archivo nuevo bajo /vagrant")
    args = parser.parse_args()

    if platform.node() != "servidorUbuntu2":
        print("ERROR=EJECUTAR_EN_SERVIDOR_UBUNTU2")
        return 2
    try:
        concurrencias = [int(x.strip()) for x in args.concurrencias.split(",")]
    except ValueError:
        print("ERROR=CONCURRENCIAS_INVALIDAS")
        return 2
    if not concurrencias or len(concurrencias) > 4 or any(c < 1 or c > 25 for c in concurrencias):
        print("ERROR=LIMITE_CONCURRENCIA_1_A_25_MAX_CUATRO_ESCENARIOS")
        return 2
    if args.solicitudes < 10 or args.solicitudes > 300:
        print("ERROR=LIMITE_SOLICITUDES_10_A_300")
        return 2
    salida = None
    if args.salida:
        salida = Path(args.salida)
        if not salida.is_absolute() or salida == Path("/vagrant") or Path("/vagrant") not in salida.parents:
            print("ERROR=SALIDA_DEBE_ESTAR_EN_VAGRANT")
            return 2
        if salida.exists() or not salida.parent.is_dir():
            print("ERROR=SALIDA_EXISTENTE_O_CARPETA_INEXISTENTE")
            return 2

    print("URL=", URL)
    print("TIPO=GET_SOLO_LECTURA")
    print("ESCENARIOS=", concurrencias)
    verificacion = peticion()
    if verificacion["http"] != 200:
        print("ERROR=HEALTHCHECK_NO_ES_200", verificacion["http"], verificacion["error"])
        return 1

    datos = {
        "sistema": "NOVATIX", "tipo": "medicion_HTTP_de_solo_lectura",
        "fecha_utc": datetime.datetime.now(datetime.timezone.utc).isoformat(),
        "cliente": platform.node(), "url": URL,
        "replicas_configuradas": "No se modifica ni escala Swarm",
        "advertencia": "RPS y latencias reflejan solo este endpoint/cliente y no una prueba integral de estrés",
        "resultados": []
    }
    for c in concurrencias:
        r = escenario(c, args.solicitudes)
        datos["resultados"].append(r)
        print("CONCURRENCIA={concurrencia} HTTP200={http_200}/{solicitudes} ERRORES={errores_red} "
              "NO200={http_no_200} RPS={rps} MEDIA_MS={latencia_media_ms} P95_MS={latencia_p95_ms}"
              .format(**r))
        print("REPLICAS=", json.dumps(r["respuestas_por_replica"], sort_keys=True))
        if r["http_200"] < args.solicitudes:
            print("AVISO=RESPUESTAS_NO_SATISFACTORIAS_DETENER_ESCENARIOS")
            break
    if salida:
        # No sobreescribir pruebas previas ni datos existentes.
        with salida.open("x", encoding="utf8") as f:
            json.dump(datos, f, indent=2, ensure_ascii=False)
            f.write("\n")
        print("RESULTADO_GUARDADO=", salida)
    else:
        print("RESULTADO_JSON=", json.dumps(datos, ensure_ascii=False))
    print("DOCKER_SWARM=NO_MODIFICADO")
    return 0

if __name__ == "__main__":
    sys.exit(main())

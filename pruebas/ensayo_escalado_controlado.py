#!/usr/bin/env python3
"""Comparacion HTTP con 1 y 2 replicas de Equipos; restauracion en finally."""
import json
import platform
import signal
import subprocess
import sys
import time
from datetime import datetime, timezone
from pathlib import Path
from urllib.request import Request, build_opener, ProxyHandler
from urllib.error import HTTPError, URLError

SERVICE = "novatix_stack_equipos"
URL = "http://192.168.100.3:8080/api/equipos/1"
NODES = {"servidorUbuntu1", "servidorUbuntu2"}
OPENER = build_opener(ProxyHandler({}))

def output(*items):
    print(*items, flush=True)

def docker(*args):
    result = subprocess.run(["sudo", "-n", "docker", *args],
                            capture_output=True, text=True, timeout=65)
    if result.returncode:
        raise RuntimeError("DOCKER_ERROR=" + (result.stderr or result.stdout)[:350])
    return result.stdout.strip()

def current():
    data = json.loads(docker("service", "inspect", SERVICE))[0]["Spec"]
    replicas = (data.get("Mode") or {}).get("Replicated", {}).get("Replicas")
    maximum = (data.get("TaskTemplate", {}).get("Placement") or {}).get("MaxReplicas")
    lines = docker("service", "ps", SERVICE, "--filter", "desired-state=running",
                   "--format", "{{.Node}}|{{.CurrentState}}").splitlines()
    running = [line.split("|", 1)[0] for line in lines
               if "|" in line and line.split("|", 1)[1].startswith("Running")]
    return replicas, maximum, running

def wait_replicas(target, seconds=120):
    deadline = time.monotonic() + seconds
    while time.monotonic() < deadline:
        try:
            replicas, limit, nodes = current()
            if (replicas == target and limit == 1 and len(nodes) == target
                and len(set(nodes)) == target and
                (target != 2 or set(nodes) == NODES)):
                return True
        except (RuntimeError, ValueError, subprocess.TimeoutExpired):
            pass
        time.sleep(3)
    output("ERROR=NO_SE_CONFIRMARON_REPLICAS", target)
    return False

def healthy(seconds=35):
    end = time.monotonic() + seconds
    consecutive = 0
    while time.monotonic() < end:
        try:
            with OPENER.open(Request(URL, method="GET"), timeout=7) as r:
                r.read(4096)
                ok = r.status == 200
        except (HTTPError, URLError, TimeoutError, OSError):
            ok = False
        consecutive = consecutive + 1 if ok else 0
        if consecutive >= 3:
            return True
        time.sleep(2)
    return False

def benchmark(script, path):
    output("PRUEBA=", path)
    cmd = [sys.executable, str(script), "--concurrencias", "1,10,25",
           "--solicitudes", "120", "--salida", str(path)]
    r = subprocess.run(cmd, timeout=200)
    if r.returncode or not path.is_file():
        raise RuntimeError("PRUEBA_INCOMPLETA")
    data = json.loads(path.read_text(encoding="utf-8"))
    if len(data.get("resultados", [])) != 3:
        raise RuntimeError("ESCENARIOS_INCOMPLETOS")
    for line in data["resultados"]:
        if line["http_200"] != 120 or line["errores_red"] or line["http_no_200"]:
            raise RuntimeError("ERRORES_HTTP_DETECTADOS")
    return data["resultados"]

def restore():
    output("=== RESTAURACION A DOS REPLICAS ===")
    for attempt in range(1, 4):
        try:
            output("INTENTO_RESTAURACION=", attempt)
            docker("service", "scale", SERVICE + "=2")
            if wait_replicas(2) and healthy():
                output("RESTAURACION=CORRECTA_2/2")
                return True
        except (RuntimeError, subprocess.TimeoutExpired) as e:
            output("ERROR_RESTAURACION=", str(e)[:350])
    output("ALERTA=REVISAR_Y_RESTAURAR_MANUALMENTE")
    output("RECUPERAR=sudo docker service scale novatix_stack_equipos=2")
    return False

def terminate(_sig, _frame):
    raise KeyboardInterrupt("Senal de interrupcion; restaurando")

def main():
    if platform.node() != "servidorUbuntu2":
        output("ERROR=SERVIDOR_INCORRECTO")
        return
    benchmark_script = Path("/tmp/novatix_benchmark_controlado.py")
    if not benchmark_script.is_file() or not Path("/vagrant").is_dir():
        output("ERROR=BENCHMARK_O_VAGRANT_NO_DISPONIBLES")
        return
    try:
        replicas, maximum, nodes = current()
        if replicas != 2 or maximum != 1 or len(nodes) != 2 or set(nodes) != NODES:
            output("ERROR=PRECONDICION_TOPOLOGIA", replicas, maximum, nodes)
            return
        if not healthy():
            output("ERROR=API_NO_RESPONDE")
            return
    except (RuntimeError, ValueError, subprocess.TimeoutExpired) as e:
        output("ERROR_PRECONDICION=", str(e))
        return

    stamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    path1 = Path("/vagrant/novatix_1replica_" + stamp + ".json")
    path2 = Path("/vagrant/novatix_2replicas_" + stamp + ".json")
    pathsum = Path("/vagrant/novatix_comparacion_" + stamp + ".json")
    if any(x.exists() for x in (path1, path2, pathsum)):
        output("ERROR=ARCHIVO_YA_EXISTE")
        return

    output("PRECONDICION=2/2_HTTP200")
    result1 = None
    restored = False
    problem = None
    try:
        output("=== CAMBIO TEMPORAL: 2 A 1 ===")
        docker("service", "scale", SERVICE + "=1")
        if not wait_replicas(1) or not healthy():
            raise RuntimeError("REPLICA_UNICA_NO_LISTA")
        output("ESTADO=1/1_HTTP200")
        result1 = benchmark(benchmark_script, path1)
    except (Exception, KeyboardInterrupt) as e:
        problem = str(e)
        output("ERROR_ETAPA_1=", problem[:350])
    finally:
        # Siempre restaurar, incluso si falla el escalado o la prueba.
        restored = restore()

    if not restored:
        output("RESULTADO=REQUIERE_RESTAURACION_MANUAL")
        return
    if problem or result1 is None:
        output("RESULTADO=ETAPA_1_INCOMPLETA_PERO_RESTAURADA")
        return
    try:
        output("=== MEDICION CON 2 REPLICAS RESTAURADAS ===")
        result2 = benchmark(benchmark_script, path2)
    except (Exception, KeyboardInterrupt) as e:
        output("ERROR_ETAPA_2=", str(e)[:350])
        output("ESTADO_FINAL=2/2_RESTAURADO")
        return
    result = {
        "sistema": "NOVATIX", "servicio": SERVICE, "endpoint": URL,
        "fecha_utc": datetime.now(timezone.utc).isoformat(),
        "cliente": "servidorUbuntu2",
        "metodo": "120 solicitudes GET por escenario; concurrencias 1,10,25",
        "orden": ["1 replica", "2 replicas"],
        "caveat": "Una corrida por escenario, posible calentamiento y diferente ubicacion de replica",
        "una_replica": result1, "dos_replicas": result2,
        "restauracion_confirmada": True
    }
    with pathsum.open("x", encoding="utf-8") as handle:
        json.dump(result, handle, ensure_ascii=False, indent=2)
        handle.write("\n")
    output("RESULTADO=CORRECTO")
    output("COMPARACION_JSON=", pathsum)
    output("DATOS_1=", path1)
    output("DATOS_2=", path2)
    output("ESTADO_FINAL=2/2_HTTP200")

if __name__ == "__main__":
    signal.signal(signal.SIGTERM, terminate)
    main()

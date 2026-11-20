#!/usr/bin/env python3
"""NOVATIX: auditoría reproducible y no destructiva de los materiales publicados.

Uso: python3 pruebas/comprobar-entrega.py
No instala componentes, no accede a servidores, no usa credenciales ni modifica archivos.
"""
from pathlib import Path
import hashlib
import subprocess
import sys

ROOT = Path(__file__).resolve().parent.parent
OBLIGATORIOS = {
    "Máquinas virtuales": ["infraestructura/Vagrantfile"],
    "Docker Swarm": ["docker-swarm/stack.novatix.template.yml", "docker-swarm/variables.example"],
    "Balanceador": ["haproxy/haproxy-4-replicas.candidate.cfg"],
    "Esquemas SQL": [f"mysql/esquemas/{nombre}.sql" for nombre in
                     ("usuarios", "equipos", "partidos", "apuestas", "dinero")],
    "Microservicios": [f"microservicios/{nombre}/Dockerfile" for nombre in
                       ("usuarios", "equipos", "partidos", "apuestas", "dinero")],
    "Spark": ["spark/analisis_novatix_v2.py", "spark/ejecutar-v2-novatix.sh"],
    "Dashboard independiente": ["dashboard/Dockerfile", "dashboard/server-v2.js",
                               "dashboard/public/index.html", "dashboard/public/app.js",
                               "dashboard/public/styles.css"],
    "Datos": [f"datos/{nombre}.csv" for nombre in
              ("usuarios", "equipos", "partidos", "apuestas", "dinero")]
             + ["datos/manifest-csv-v2.json", "datos/verificar_csv.py"],
    "Frontend Ubuntu1": [f"frontend/{f}" for f in (
                           "index.html", "app.js", "estilos.css",
                           "spark-integracion.js", "spark-dashboard.html",
                           "spark-dashboard-app.js", "spark-dashboard-styles.css")],
    "Configuración de ejemplo Apache": ["frontend/apache/novatix-spark-proxy.conf"],
    "Documentación": ["README.md", "documentacion/reproduccion-paso-a-paso.md"],
}
# Huellas SHA-256 obtenidas del respaldo aportado por Ubuntu1, 20/11/2026.
SHA_FRONTEND = {
    "index.html": "15cf89484cc8f735f2b6ed416388172d37a9cdf1b9d7adba6988c8e92b5a6d88",
    "app.js": "e33f09c3a19b4cec963c0fd4d4c047132966891004495ed8016d5c0e52052c12",
    "estilos.css": "6867036627a7fad47e89bde1f2a49c300bcb0f89f380ab0761ccf6ebb65af0b5",
    "spark-integracion.js": "251271c74fe76866829f9494def658406e7d1b1e401522556c63884a22f9da8f",
    "spark-dashboard.html": "6f891e7282b1afe34db8ed97703a479f32df29782f6515373f5ee210c1921a8f",
    "spark-dashboard-app.js": "ee018340f4faffae36709904b0258d05d7e36354c87db0d0238372c9e8ae6c8f",
    "spark-dashboard-styles.css": "a533e9d3fab28054d02f421323a39daba5883cdfbe7bde9096db07dc84c8f618",
}

def principal():
    print("=== NOVATIX - COMPROBACION DE ENTREGA ===")
    faltantes = []
    for grupo, paths in OBLIGATORIOS.items():
        ausentes = [p for p in paths if not (ROOT / p).is_file()]
        print(f"{grupo}: {'OK' if not ausentes else 'FALTANTE'}")
        faltantes.extend(ausentes)
        for path in ausentes:
            print("  FALTA:", path)

    print("\n=== VERIFICACION DE INTEGRIDAD DE CINCO CSV ===")
    checker = ROOT / "datos/verificar_csv.py"
    if checker.is_file():
        resultado = subprocess.run([sys.executable, str(checker)], cwd=str(ROOT),
                                   check=False)
        csv_ok = resultado.returncode == 0
    else:
        csv_ok = False
    print("CSV=", "OK" if csv_ok else "ERROR", sep="")

    print("\n=== INTEGRIDAD DE FUENTES ORIGINALES UBUNTU1 ===")
    frontend_ok = True
    for nombre, esperado in SHA_FRONTEND.items():
        ruta = ROOT / "frontend" / nombre
        actual = hashlib.sha256(ruta.read_bytes()).hexdigest() if ruta.is_file() else ""
        ok = actual == esperado
        frontend_ok &= ok
        print(f"{nombre}: {'OK' if ok else 'ERROR'}")

    print("\n=== COMPROBACIONES QUE ESTE SCRIPT NO REALIZA ===")
    print("No verifica despliegue limpio, MySQL poblado, Docker Swarm, Apache,")
    print("autenticacion, navegacion, paginacion de API ni rendimiento JMeter.")
    print("No garantiza que las fuentes versionadas coincidan con servicios activos.")
    correcto = not faltantes and csv_ok and frontend_ok
    print("RESULTADO_MATERIAL_PUBLICADO=", "CORRECTO" if correcto else "REVISAR", sep="")
    print("REPRODUCCION_INTEGRAL=NO_CERTIFICADA")
    return 0 if correcto else 1

if __name__ == "__main__":
    sys.exit(principal())

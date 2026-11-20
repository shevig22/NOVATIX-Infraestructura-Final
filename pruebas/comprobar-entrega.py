#!/usr/bin/env python3
"""NOVATIX: auditoría reproducible y no destructiva de los materiales publicados.

Uso: python3 pruebas/comprobar-entrega.py
No instala componentes, no accede a servidores, no usa credenciales ni modifica archivos.
"""
from pathlib import Path
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
    "Documentación": ["README.md", "documentacion/reproduccion-paso-a-paso.md"],
}
# Material de Ubuntu1 que todavía no está respaldado en esta rama de GitHub.
PENDIENTES_ORIGINALES = {
    "Frontend transaccional": ["frontend/index.html", "frontend/app.js", "frontend/estilos.css"],
    "Integración Spark con Apache": ["frontend/spark-integracion.js",
                                     "frontend/spark-dashboard.html",
                                     "frontend/spark-dashboard-app.js",
                                     "frontend/spark-dashboard-styles.css",
                                     "frontend/apache/novatix-spark-proxy.conf"],
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

    print("\n=== MATERIAL REAL DE UBUNTU1 PENDIENTE DE PUBLICACION ===")
    for grupo, paths in PENDIENTES_ORIGINALES.items():
        ausentes = [p for p in paths if not (ROOT / p).is_file()]
        print(grupo + ": " + ("PENDIENTE" if ausentes else "PUBLICADO"))
        for path in ausentes:
            print("  NO_VERSIONADO:", path)

    print("\n=== COMPROBACIONES QUE ESTE SCRIPT NO REALIZA ===")
    print("No verifica despliegue limpio, MySQL poblado, Docker Swarm, Apache,")
    print("autenticacion, navegacion, paginacion de API ni rendimiento JMeter.")
    print("No garantiza que las fuentes versionadas coincidan con servicios activos.")
    correcto = not faltantes and csv_ok
    print("RESULTADO_MATERIAL_PUBLICADO=", "CORRECTO" if correcto else "REVISAR", sep="")
    print("REPRODUCCION_INTEGRAL=NO_CERTIFICADA")
    return 0 if correcto else 1

if __name__ == "__main__":
    sys.exit(principal())

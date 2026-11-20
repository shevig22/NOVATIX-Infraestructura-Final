# Registro de consolidación

## 19 de noviembre de 2026

- Inicialización del repositorio NOVATIX-Infraestructura-Final.
- Registro inicial histórico de tres máquinas (`.2`, `.3`, `.4`), Docker Overlay, diez réplicas API, cinco MySQL, HAProxy y Spark V2.
- Publicado `spark/analisis_novatix_v2.py` que produjo reporte de 11 análisis.
- Publicado `spark/ejecutar-v2-novatix.sh` con los parámetros de ejecución reportados.
- Publicados los diagramas editables de infraestructura y pipeline de Spark.
- **Pendiente:** exportar los fuentes completos del dashboard V2 desplegado y los scripts reales de configuración de Swarm/HAProxy/MySQL.
- **Pendiente:** verificar eliminación de `novatix_dashboard_test11` antes de documentar la liberación definitiva de 8093.

No utilizar los scripts ni puertos anteriores como si fueran configuraciones vigentes. El cluster desplegado y el repositorio se mantienen independientes.

## 20 de noviembre de 2026 — arquitectura definitiva

- Se amplió cada una de las cinco API a cuatro réplicas, dos por nodo Ubuntu1 y Ubuntu2, sumando 20 instancias.
- Se activó HAProxy V4 con cuatro slots por backend y se verificó mediante GET 200, 20/20/20/20 solicitudes por servicio.
- La auditoría final informó 20/20 tareas API, 10 Ubuntu1 y 10 Ubuntu2, cinco MySQL en Ubuntu3. [Detalle de evidencias](../pruebas/validacion-arquitectura-20-instancias.md).
- El informe de escalabilidad 1 vs 2 réplicas representa un ensayo anterior a la ampliación de 20 instancias.

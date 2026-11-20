# Servicios analíticos independientes — inventario real

Los servicios siguientes no forman parte del stack transaccional de 11 servicios. Las órdenes de arranque (`Command`/`Args`) no estaban disponibles en el inventario sanitizado; por seguridad **no se inventaron**. Los dos servicios `reporte` y `v2` son trabajos por lotes completados, no servicios permanentemente en marcha.

| Servicio | Imagen | Restricción | Publicación | Montajes |
|---|---|---|---|---|
| `novatix_dashboard` | `novatix-dashboard:spark-v2-20261119_234042` | node.hostname==servidorUbuntu2 | 8090→8080 (host) | `/vagrant/novatix_spark_resultados → /resultados:ro` |
| `novatix_spark_master` | `spark:3.5.9-python3` | node.hostname == servidorUbuntu2 | 8092→8080 (host) | `/vagrant/novatix_spark_datos → /datos:ro` |
| `novatix_spark_reporte` | `spark:3.5.9-python3` | node.hostname == servidorUbuntu2 | — | `/vagrant/novatix_spark_datos → /datos:ro`, `/vagrant/novatix_spark_resultados → /resultados` |
| `novatix_spark_v2_20261119232302` | `spark:3.5.9-python3` | node.hostname==servidorUbuntu2 | — | `/vagrant/novatix_spark_datos → /datos:ro`, `/vagrant/novatix_spark_resultados → /resultados` |
| `novatix_spark_worker1` | `spark:3.5.9-python3` | node.hostname == servidorUbuntu1 | — | `/vagrant/novatix_spark_datos → /datos:ro` |
| `novatix_spark_worker2` | `spark:3.5.9-python3` | node.hostname == servidorUbuntu2 | — | `/vagrant/novatix_spark_datos → /datos:ro` |

Los seis servicios listados incluyen un dashboard, Master y Workers Spark y dos trabajos batch. El dashboard publicado utiliza una **imagen local** `novatix-dashboard:spark-v2-20261119_234042`, que no se puede descargar de Docker Hub sin reconstruirla y verificarla. El Dockerfile portable del repositorio existe, pero no se ha probado en la infraestructura.

El archivo histórico del dashboard declara variables de MySQL por nombre, aunque el dashboard Spark V2 lee el informe JSON. Se necesita inspeccionar el comando y entorno real antes de crear una receta de despliegue fiel.

Para reconstruir por completo hacen falta `Command`, `Args`, `WorkingDir`, usuario, Config/Secrets y recursos de cada tarea, así como comprobar las rutas compartidas entre nodos. No incluir directamente en el stack los trabajos batch que ya han finalizado.

**Fuente:** `docker-swarm/inventario-activo-sanitizado.json`; evidencia adicional en `documentacion/arquitectura-implementada.md`.

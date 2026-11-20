# NOVATIX · Spark Analytics V2

Código PySpark que se ejecutó en el clúster de 3 nodos y produjo el reporte V2.

## Datos de entrada

El script `analisis_novatix_v2.py` lee, desde `/datos`, estos cinco CSV preparados (datos futbolísticos de referencia y datos complementarios simulados, según el equipo): `usuarios.csv`, `equipos.csv`, `partidos.csv`, `apuestas.csv` y `dinero.csv`. El CSV de usuarios utilizado en el clúster contiene solamente los campos analíticos necesarios (no contraseñas).

Consulta [los cinco CSV y su manifiesto verificado](../datos/README.md). Antes de ejecutar Spark en otra VM, monta la carpeta `datos/` del clon en `/datos` dentro del contenedor. Los cinco CSV **preparados y verificados** ya se publicaron en [datos/](../datos/README.md). No están los CSV transaccionales originales con campos personales; no son necesarios para Spark.

## Salida

`/resultados/reporte_novatix_v2.json`. Contiene totales y 11 conjuntos de análisis; la API del dashboard los lee desde el archivo. No se utiliza `reportes_db` ni JDBC para esta versión.

## Ejecución en el entorno desplegado

Reutilizar Spark Master `novatix_spark_master` en Ubuntu2 y Workers `novatix_spark_worker1` (Ubuntu1), `novatix_spark_worker2` (Ubuntu2), imagen `spark:3.5.9-python3`, red `novatix_stack_novatix_net_new`, carpetas bind `/vagrant/novatix_spark_datos:/datos:ro` y `/vagrant/novatix_spark_resultados:/resultados`.

`ejecutar-v2-novatix.sh` recoge los parámetros de `spark-submit` con los que se ejecutó Spark V2. Debe ejecutarse como tarea temporal de Swarm, no reemplazando un servicio persistente. El trabajo original quedó en estado `Complete` y observó 2 ejecutores; aún falta evidencia de la ubicación física de ambos.

Ver `pruebas/estado_cluster.sh` para el estado general. No ejecutar `docker stack deploy` en el laboratorio activo con plantillas no verificadas.

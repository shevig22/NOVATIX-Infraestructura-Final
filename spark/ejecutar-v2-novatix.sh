#!/usr/bin/env bash
# Ejecutar como contenedor temporal, no en la shell interactiva.
# Requiere el montaje /datos (lectura) y /resultados (escritura).
set -Eeuo pipefail
MASTER_IP=$(getent ahostsv4 tasks.novatix_spark_master | awk 'NR==1 {print $1}')
DRIVER_IP=$(hostname -i | tr ' ' '\n' | grep '^10\.77\.' | head -1 || true)
if [ -z "$MASTER_IP" ] || [ -z "$DRIVER_IP" ]; then
  echo "ERROR=DNS_O_IP_SPARK"
  false
else
  echo "SPARK_V2=INICIANDO"
  /opt/spark/bin/spark-submit \
    --master "spark://${MASTER_IP}:7077" \
    --deploy-mode client \
    --executor-memory 512m \
    --executor-cores 1 \
    --total-executor-cores 2 \
    --driver-memory 512m \
    --conf "spark.driver.host=${DRIVER_IP}" \
    --conf "spark.driver.bindAddress=0.0.0.0" \
    --conf spark.ui.enabled=false \
    --conf spark.sql.shuffle.partitions=8 \
    /datos/analisis_novatix_v2.py
  echo "SPARK_V2=PROCESAMIENTO_FINALIZADO"
fi

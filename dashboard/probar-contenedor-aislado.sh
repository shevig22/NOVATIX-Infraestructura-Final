#!/usr/bin/env bash
# Prueba independiente: no altera servicios de Docker Swarm
set -u
set -o pipefail
umask 077
IMAGEN='novatix-dashboard:spark-v2-portable'
PRUEBA='novatix_dashboard_prueba_portable'
PUERTO='18090'
REPORTE='/vagrant/novatix_spark_resultados/reporte_novatix_v2.json'
CREADO='NO'

limpiar() {
  if [ "$CREADO" = 'SI' ]; then
    sudo -n docker rm -f "$PRUEBA" >/dev/null 2>&1 || true
    echo 'CONTENEDOR_TEMPORAL=ELIMINADO'
  fi
}
trap limpiar EXIT

principal() {
  local BASE CODIGO I
  BASE="$(cd -- "$(dirname -- "$0")" && pwd)" || return 1
  if [ "$(hostname)" != 'servidorUbuntu2' ]; then
    echo 'ERROR=SERVIDOR_INCORRECTO'; return 1
  fi
  if ! sudo -n docker info >/dev/null 2>&1; then
    echo 'ERROR=DOCKER_NO_DISPONIBLE'; return 1
  fi
  if [ ! -f "$REPORTE" ] || [ ! -r "$REPORTE" ]; then
    echo 'ERROR=REPORTE_JSON_NO_LEGIBLE'; return 1
  fi
  if sudo -n docker ps -a --filter "name=^/$PRUEBA$" \
       --format '{{.Names}}' | grep -Fxq "$PRUEBA"; then
    echo 'ERROR=CONTENEDOR_DE_PRUEBA_YA_EXISTE'; return 1
  fi
  if ss -lnt | grep -Eq "[:.]$PUERTO[[:space:]]"; then
    echo 'ERROR=PUERTO_18090_OCUPADO'; return 1
  fi
  echo '=== DASHBOARD ACTUAL (SOLO LECTURA) ==='
  sudo -n docker service ls --filter name=novatix_dashboard \
    --format '{{.Name}} {{.Replicas}}'
  echo '=== CONSTRUIR IMAGEN PORTABLE ==='
  if ! sudo -n docker build -f "$BASE/Dockerfile" \
      -t "$IMAGEN" "$BASE"; then
    echo 'ERROR=CONSTRUCCION_DE_IMAGEN'; return 1
  fi
  echo '=== PRUEBA LOCAL 127.0.0.1:18090 ==='
  if ! sudo -n docker run -d --rm \
      --name "$PRUEBA" \
      --publish "127.0.0.1:$PUERTO:8080" \
      --mount "type=bind,source=/vagrant/novatix_spark_resultados,target=/resultados,readonly" \
      --read-only --cap-drop=ALL --security-opt no-new-privileges \
      "$IMAGEN" >/dev/null; then
    echo 'ERROR=CONTENEDOR_TEMPORAL_NO_INICIO'; return 1
  fi
  CREADO='SI'
  for I in $(seq 1 15); do
    CODIGO="$(curl -sS -o /dev/null --connect-timeout 2 \
      --max-time 4 -w '%{http_code}' \
      "http://127.0.0.1:$PUERTO/api/health" 2>/dev/null)"
    echo "INTENTO=$I HEALTH=$CODIGO"
    if [ "$CODIGO" = '200' ]; then
      if curl -fsS --max-time 5 "http://127.0.0.1:$PUERTO/" >/dev/null &&
         curl -fsS --max-time 5 "http://127.0.0.1:$PUERTO/app.js" >/dev/null &&
         curl -fsS --max-time 5 "http://127.0.0.1:$PUERTO/api/spark/v2" >/dev/null; then
        echo 'IMAGEN_PORTABLE=VALIDADA'
        echo 'SERVICIO_SWARM_ORIGINAL=SIN_CAMBIOS'
        return 0
      fi
    fi
    sleep 2
  done
  sudo -n docker logs --tail 20 "$PRUEBA" 2>&1 || true
  echo 'ERROR=PRUEBA_SIN_HTTP_200'
  return 1
}

if principal; then
  echo 'FASE=COMPLETADA'
else
  echo 'FASE=REVISAR_ANTES_DE_DESPLEGAR'
fi
echo '=== FIN ==='

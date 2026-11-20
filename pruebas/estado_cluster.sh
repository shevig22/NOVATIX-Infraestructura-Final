#!/usr/bin/env bash
# NOVATIX: diagnóstico de solo lectura, ejecutar en Ubuntu2 (manager).
# No cambia réplicas ni servicios y no utiliza exit.
echo '=== NOVATIX - RESUMEN SWARM ==='
if [ "$(hostname)" != "servidorUbuntu2" ]; then
  echo 'ERROR=SERVIDOR_INCORRECTO'
else
  sudo docker node ls --format 'NODO={{.Hostname}} ESTADO={{.Status}}'
  for DB in usuarios equipos partidos apuestas dinero; do
    API="novatix_stack_$DB"
    SQL="novatix_stack_db-$DB"
    A=$(sudo docker service ls --filter "name=$API" --format '{{.Name}}|{{.Replicas}}' | awk -F'|' -v n="$API" '$1==n {print $2}')
    B=$(sudo docker service ls --filter "name=$SQL" --format '{{.Name}}|{{.Replicas}}' | awk -F'|' -v n="$SQL" '$1==n {print $2}')
    HTTP=$(curl -sS --connect-timeout 3 --max-time 12 -o /dev/null -w '%{http_code}' "http://127.0.0.1:8080/api/$DB" 2>/dev/null)
    echo "$DB: API=$A MYSQL=$B HAPROXY_HTTP=$HTTP"
  done
  for P in 8090 8092 8888; do
    HTTP=$(curl -sS --connect-timeout 3 --max-time 10 -o /dev/null -w '%{http_code}' "http://127.0.0.1:$P/" 2>/dev/null)
    echo "PANEL_$P: HTTP=$HTTP"
  done
fi
echo '=== FIN ==='

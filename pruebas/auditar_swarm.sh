#!/usr/bin/env bash
# NOVATIX — auditoría de solo lectura sobre el Manager Ubuntu2.
# No imprime variables de entorno ni credenciales.
echo "=== NOVATIX - AUDITORIA DE INFRAESTRUCTURA ==="
auditar() {
  if [ "$(hostname)" != "servidorUbuntu2" ]; then
    echo "ERROR=SERVIDOR_INCORRECTO"
    return 1
  fi
  echo "=== NODOS ==="
  sudo docker node ls --format 'NODO={{.Hostname}} ESTADO={{.Status}} ROL={{.ManagerStatus}}'
  echo "=== SERVICIOS ==="
  sudo docker service ls --format 'SERVICIO={{.Name}} REPLICAS={{.Replicas}}' | grep -E 'novatix|spark' || true
  echo "=== UBICACION API ==="
  for API in usuarios equipos partidos apuestas dinero; do
    echo "MICROSERVICIO=$API"
    sudo docker service ps "novatix_stack_$API" --filter desired-state=running \
      --format 'NODO={{.Node}} ESTADO={{.CurrentState}}'
  done
  echo "=== UBICACION MYSQL ==="
  for DB in usuarios equipos partidos apuestas dinero; do
    echo "BASE=$DB"
    sudo docker service ps "novatix_stack_db-$DB" --filter desired-state=running \
      --format 'NODO={{.Node}} ESTADO={{.CurrentState}}'
  done
  echo "=== CONFIG HAPROXY ==="
  sudo docker service inspect novatix_stack_haproxy \
    --format '{{range .Spec.TaskTemplate.ContainerSpec.Configs}}CONFIG={{.ConfigName}} DESTINO={{.File.Name}}{{println}}{{end}}'
  echo "=== DASHBOARD UNICO ==="
  sudo docker service ls --format '{{.Name}} {{.Replicas}}' | grep '^novatix_dashboard' || true
}
if auditar; then
  echo "RESULTADO=AUDITORIA_COMPLETADA"
else
  echo "RESULTADO=REQUIERE_REVISION"
fi
echo "=== FIN ==="

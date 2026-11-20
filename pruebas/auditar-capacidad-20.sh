#!/usr/bin/env bash
# NOVATIX: capacidad sin modificar clúster ni imprimir credenciales
set -u
set -o pipefail
echo "=== NOVATIX - CAPACIDAD PARA 20 INSTANCIAS ==="
if [ "$(hostname)" != "servidorUbuntu2" ]; then
  echo "ERROR=SERVIDOR_INCORRECTO"
else
  echo "=== ESTADO NODOS ==="
  sudo -n docker node ls --format 'NODO={{.Hostname}} ESTADO={{.Status}} DISP={{.Availability}} MANAGER={{.ManagerStatus}}'
  echo "=== RECURSOS / ETIQUETAS NODOS ==="
  for nodo in servidorUbuntu1 servidorUbuntu2 servidorUbuntu3; do
    sudo -n docker node inspect "$nodo" \
      --format 'NODO={{.Description.Hostname}} CPU_NANO={{.Description.Resources.NanoCPUs}} MEMORIA_BYTES={{.Description.Resources.MemoryBytes}} ETIQUETAS={{json .Spec.Labels}} DISPONIBILIDAD={{.Spec.Availability}}' \
      2>/dev/null || echo "ERROR=INSPECCION_NODO_$nodo"
  done
  echo "=== USO UBUNTU2 ==="
  free -m
  uptime
  echo "=== USO CONTENEDORES LOCALES ==="
  sudo -n docker stats --no-stream \
    --format 'CONTENEDOR={{.Name}} CPU={{.CPUPerc}} MEMORIA={{.MemUsage}}' \
    2>/dev/null | grep -E 'novatix|spark' || true
  echo "=== CINCO API: REPLICAS Y LIMITES ==="
  for svc in usuarios equipos partidos apuestas dinero; do
    nombre="novatix_stack_$svc"
    sudo -n docker service inspect "$nombre" \
      --format 'SERVICIO={{.Spec.Name}} REPLICAS={{.Spec.Mode.Replicated.Replicas}} MAX_POR_NODO={{.Spec.TaskTemplate.Placement.MaxReplicas}} LIMITE_MEM={{.Spec.TaskTemplate.Resources.Limits.MemoryBytes}} RESERVA_MEM={{.Spec.TaskTemplate.Resources.Reservations.MemoryBytes}}' \
      2>/dev/null || echo "ERROR=INSPECCION_$svc"
    sudo -n docker service ps "$nombre" --filter desired-state=running \
      --format 'TAREA={{.Name}} NODO={{.Node}} ESTADO={{.CurrentState}}' \
      2>/dev/null || echo "ERROR=TAREAS_$svc"
  done
  echo "CAMBIOS=NINGUNO"
  echo "=== FIN ==="
fi

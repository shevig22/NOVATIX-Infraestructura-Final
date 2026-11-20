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
    if sudo -n docker service inspect "$nombre" | python3 -c '
import json
import sys
d = json.load(sys.stdin)[0]
s = d["Spec"]
t = s.get("TaskTemplate") or {}
placement = t.get("Placement") or {}
resources = t.get("Resources") or {}
limits = resources.get("Limits") or {}
reservations = resources.get("Reservations") or {}
print("SERVICIO={} REPLICAS={} MAX_POR_NODO={} LIMITE_MEM={} RESERVA_MEM={}".format(
    s["Name"],
    (s.get("Mode") or {}).get("Replicated", {}).get("Replicas", "NO_DEFINIDO"),
    placement.get("MaxReplicas", "NO_DEFINIDO"),
    limits.get("MemoryBytes", "NO_DEFINIDO"),
    reservations.get("MemoryBytes", "NO_DEFINIDO")
))
'; then
      :
    else
      echo "ERROR=INSPECCION_$svc"
    fi
    sudo -n docker service ps "$nombre" --filter desired-state=running \
      --format 'TAREA={{.Name}} NODO={{.Node}} ESTADO={{.CurrentState}}' \
      2>/dev/null || echo "ERROR=TAREAS_$svc"
  done
  echo "CAMBIOS=NINGUNO"
  echo "=== FIN ==="
fi

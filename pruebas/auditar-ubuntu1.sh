#!/usr/bin/env bash
# Inspeccion de solo lectura: servidorUbuntu1 (nodo de aplicaciones)
# No muestra valores de entorno ni modifica Docker.
set -u
set -o pipefail

echo "=== NOVATIX - AUDITORIA LOCAL UBUNTU1 ==="

if [ "$(hostname)" != "servidorUbuntu1" ]; then
  echo "ERROR=SERVIDOR_INCORRECTO"
else
  echo "=== MEMORIA DEL SISTEMA (MiB) ==="
  free -m
  echo "=== CARGA DEL SISTEMA ==="
  uptime

  echo "=== ESTADO DOCKER EN ESTE NODO ==="
  if sudo -n docker info --format 'SWARM={{.Swarm.LocalNodeState}} CONTENEDORES_RUNNING={{.ContainersRunning}} DOCKER={{.ServerVersion}}'; then
    echo "DOCKER_INFO=CORRECTO"
  else
    echo "ERROR=DOCKER_INFO"
  fi

  echo "=== CONSUMO INSTANTANEO DE CONTENEDORES NOVATIX ==="
  if sudo -n docker stats --no-stream --format 'NOMBRE={{.Name}} CPU={{.CPUPerc}} MEMORIA={{.MemUsage}}' | grep -E 'novatix_stack_|novatix_spark'; then
    echo "CONTENEDORES=CONSULTADOS"
  else
    echo "AVISO=SIN_CONTENEDORES_NOVATIX_O_ESTADISTICAS_INDISPONIBLES"
  fi

  echo "=== CONTENEDORES EN EJECUCION ==="
  sudo -n docker ps --format 'NOMBRE={{.Names}} ESTADO={{.Status}}' | grep 'novatix' || true

  echo "=== ESPACIO DISPONIBLE EN DOCKER ==="
  df -h /var/lib/docker 2>/dev/null || df -h /

  echo "CAMBIOS=NINGUNO"
  echo "=== FIN ==="
fi

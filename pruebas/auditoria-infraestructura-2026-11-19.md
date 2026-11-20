# Auditoría real de Docker Swarm — 19 de noviembre de 2026

Este registro documenta la salida de diagnóstico ejecutada directamente en **servidorUbuntu2**, Manager de Docker Swarm. **No** es una prueba de carga ni un fichero de despliegue.

## Nodos

| Nodo | Estado | Rol |
|---|---|---|
| `servidorUbuntu1` (192.168.100.2) | Ready | Worker |
| `servidorUbuntu2` (192.168.100.3) | Ready | Manager Leader |
| `servidorUbuntu3` (192.168.100.4) | Ready | Worker |

## Réplicas de las cinco API

| Servicio | Réplicas | Ubicación |
|---|---|---|
| `novatix_stack_usuarios` | 2/2 (máximo 1 por nodo) | Ubuntu1 + Ubuntu2 |
| `novatix_stack_equipos` | 2/2 (máximo 1 por nodo) | Ubuntu1 + Ubuntu2 |
| `novatix_stack_partidos` | 2/2 (máximo 1 por nodo) | Ubuntu1 + Ubuntu2 |
| `novatix_stack_apuestas` | 2/2 (máximo 1 por nodo) | Ubuntu1 + Ubuntu2 |
| `novatix_stack_dinero` | 2/2 (máximo 1 por nodo) | Ubuntu1 + Ubuntu2 |

## Persistencia MySQL

Servicios `novatix_stack_db-usuarios`, `novatix_stack_db-equipos`, `novatix_stack_db-partidos`, `novatix_stack_db-apuestas` y `novatix_stack_db-dinero`: todos **1/1**, ubicados en Ubuntu3.

## HAProxy

- Servicio `novatix_stack_haproxy`: **1/1**.
- Docker Config verificada: `novatix_stack_haproxy_cfg_v2_20261119193336`.
- Destino: `/usr/local/etc/haproxy/haproxy.cfg`.
- Frontend `http_in`: `bind *:80` dentro del contenedor; publicación `8080` en el host.
- Frontend `stats`: `bind *:8888`.
- Balanceo: **roundrobin** con `server-template` de dos tareas por API.

| Backend | Objetivo DNS en Swarm |
|---|---|
| `be_usuarios` | `tasks.novatix_stack_usuarios:3001` |
| `be_equipos` | `tasks.novatix_stack_equipos:3004` |
| `be_partidos` | `tasks.novatix_stack_partidos:3002` |
| `be_apuestas` | `tasks.novatix_stack_apuestas:3000` |
| `be_dinero` | `tasks.novatix_stack_dinero:3003` |

El archivo **completo** de HAProxy está pendiente de exportar del contenedor activo para reproducir también ACL, resolvers, checks y opciones.

## Spark

| Servicio | Réplicas | Interpretación |
|---|---|---|
| `novatix_spark_master` | 1/1 | Master operativo |
| `novatix_spark_worker1` | 1/1 | Worker operativo |
| `novatix_spark_worker2` | 1/1 | Worker operativo |
| `novatix_spark_reporte` | 0/1 | Trabajo batch V1 completado anteriormente |
| `novatix_spark_v2_20261119232302` | 0/1 | Trabajo batch V2 completado anteriormente |

Las tareas por lotes pueden figurar 0/1 tras finalizar, sin que ello implique un error. La ejecución V2 y sus 11 secciones se comprobaron por separado.

## Dashboard único

`novatix_dashboard`: **1/1**, puerto publicado 8090. No aparece ya el servicio experimental `novatix_dashboard_test11`.

## Precauciones para reproducibilidad

Este archivo recoge **evidencias observadas**. Aún hay que exportar los Dockerfiles, imágenes, restricciones de ubicación, variables de entorno en forma de plantilla, redes, volúmenes y el archivo HAProxy exacto para permitir reproducir el entorno desde cero. No se deben copiar automáticamente los manifiestos del repositorio antiguo: usan otra topología.

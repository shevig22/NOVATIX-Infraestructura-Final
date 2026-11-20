# Arquitectura implementada de NOVATIX (tres nodos)

## Nodos y roles

| Componente | Ubuntu1 `192.168.100.2` | Ubuntu2 `192.168.100.3` | Ubuntu3 `192.168.100.4` |
|---|---|---|---|
| Cinco microservicios Node.js | Instancias A, una de cada API | Instancias B, una de cada API | — |
| MySQL | — | — | Cinco servicios y volúmenes persistentes |
| Docker Swarm | Worker | Manager (líder) | Worker |
| HAProxy | — | Única instancia, balanceo HTTP | — |
| Dashboard analítico | — | Principal en 8090 | — |
| Apache Spark | Worker 1 | Master y Worker 2 | — |

## Red

- Red privada VirtualBox: `192.168.100.0/24`.
- Overlay de Swarm: `novatix_stack_novatix_net_new`, subred `10.77.0.0/24`.
- Las API resuelven sus bases por DNS de servicio (`db-usuarios`, `db-equipos`, `db-partidos`, `db-apuestas`, `db-dinero`).
- MySQL usa el puerto interno 3306; no forma parte de la API pública.
- HAProxy sirve el tráfico HTTP de la API desde el puerto publicado 8080; sus backends descubren tareas mediante `tasks.novatix_stack_*` y distribuyen con `roundrobin`.

## Rutas de API verificadas por HAProxy

- `/api/usuarios` — Usuarios (3001).
- `/api/equipos` — Equipos (3004).
- `/api/partidos` — Partidos (3002).
- `/api/apuestas` — Apuestas (3000).
- `/api/dinero` — Dinero (3003).

Los prefijos antiguos `/usuarios/api/usuarios`, etc. también respondieron HTTP 200 tras la actualización de la configuración HAProxy.

## Spark V2 y dashboard

- Spark Master 1/1 en Ubuntu2, Workers 1/1 en Ubuntu1 y 1/1 en Ubuntu2.
- Código PySpark real usado: `/vagrant/novatix_spark_datos/analisis_novatix_v2.py`.
- Resultado: `/vagrant/novatix_spark_resultados/reporte_novatix_v2.json`.
- Los cinco CSV contienen información futbolística derivada de una fuente abierta identificada por el equipo y registros complementarios simulados; Spark V2 no consulta MySQL en vivo.
- El job Spark es por lotes; el estado `Complete` no debe interpretarse como fallo por mostrar 0/1 réplicas en `docker service ls`.
- Dashboard final: `novatix_dashboard` en el puerto 8090.

## Limitaciones honestas

- Las API tienen redundancia de instancias, pero MySQL está concentrado en Ubuntu3 y HAProxy/Manager en Ubuntu2: **no hay tolerancia integral a la caída de cualquier nodo**.
- La ejecución de Spark observó dos ejecutores; falta guardar evidencia de la ubicación física de ambos.
- La persistencia de rutas de red tras reinicio y la recuperación real ante fallos requieren pruebas específicas.
- No confundir el número de registros del CSV con el número de filas cargadas en MySQL.

## Estado documental

Este documento describe el entorno ya auditado. Los archivos de despliegue precisos deben exportarse del clúster antes de publicarlos como instalación reproducible. No copiar sin adaptar el `Vagrantfile`, `docker-compose-novatix.yml` o `haproxy.cfg` de un repositorio que utiliza otras direcciones IP.

## Aclaración sobre una meta posterior

El despliegue verificado tiene **10 réplicas Node.js** (una por servicio en cada uno de Ubuntu1 y Ubuntu2). El equipo indicó posteriormente un objetivo de **20 réplicas** (dos por servicio y por nodo), aún **no implementado**. Ver [arquitectura actual frente al nuevo objetivo](arquitectura-actual-vs-objetivo-20.md). Los diagramas e inventarios actuales no deben etiquetarse como un despliegue de 20.

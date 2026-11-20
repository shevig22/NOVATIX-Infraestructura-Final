# NOVATIX — Validación del balanceo de cuatro instancias de Equipos

**Evidencia:** salida de terminal aportada por el equipo en `servidorUbuntu2` el 20/11/2026. Las cuatro tareas estaban desplegadas en Docker Swarm, dos en Ubuntu1 y dos en Ubuntu2, con `MaxReplicas=2`, `4/4` running.

## Ensayo de 80 consultas GET

Endpoint `http://192.168.100.3:8080/api/equipos/1`, por HAProxy V4, conexión HTTP sin persistencia, peticiones secuenciales de solo lectura.

| Indicador | Resultado |
|---|---:|
| Respuestas HTTP 200 | 80 de 80 |
| Errores de red | 0 |
| `X-Replica: equipos1` | 20 |
| `X-Replica: equipos2` | 20 |
| `X-Replica: equipos3` | 20 |
| `X-Replica: equipos4` | 20 |
| Balanceo | 25 % de peticiones por réplica |
| Slots identificados en HAProxy stats | 4, todos `UP` |

Las estadísticas de HAProxy en `http://192.168.100.3:8888/;csv` mostraron `be_equipos` con `equipos1` 22, `equipos2` 21, `equipos3` 20 y `equipos4` 20 solicitudes acumuladas. Estos contadores incluyen tráfico previo y **no deben confundirse** con las 80 solicitudes exactas del ensayo.

## Consecuencia y alcance

Quedó demostrado el balanceo HTTP de cuatro réplicas de **Equipos**. No equivale aún a tener 20 tareas: al momento de la prueba, Equipos tenía cuatro y los otros cuatro microservicios permanecían con dos cada uno, total **12 instancias API**.

La nueva configuración HAProxy `novatix_stack_haproxy_cfg_4replicas_20261120` estaba activa y dio HTTP 200. **Pendientes:** ampliar Usuarios, Partidos, Apuestas y Dinero uno a uno; medir carga de cuatro réplicas y comprobar todos los backends y recursos.

No extrapolar los resultados de RPS medidos previamente con una y dos réplicas a cuatro: es necesario realizar una nueva prueba de carga una vez configuradas las cuatro.

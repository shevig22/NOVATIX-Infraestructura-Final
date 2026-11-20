# NOVATIX — Evolución histórica de 10 a 20 instancias

**Estado definitivo: IMPLEMENTADO Y VERIFICADO.** Los cinco microservicios tienen cuatro réplicas cada uno: dos en Ubuntu1 y dos en Ubuntu2. Total 20 instancias Node.js. [Ver auditoría final](../pruebas/validacion-arquitectura-20-instancias.md).

| Microservicio | Antes Ubuntu1 | Antes Ubuntu2 | Ahora Ubuntu1 | Ahora Ubuntu2 |
|---|---:|---:|---:|---:|
| Usuarios | 1 | 1 | **2** | **2** |
| Equipos | 1 | 1 | **2** | **2** |
| Partidos | 1 | 1 | **2** | **2** |
| Apuestas | 1 | 1 | **2** | **2** |
| Dinero | 1 | 1 | **2** | **2** |
| **Total** | **5** | **5** | **10** | **10** |

El clúster empezó con dos réplicas globales por API (máximo una tarea por nodo) y HAProxy con dos slots por backend. Se actualizó HAProxy a cuatro slots y se escalaron las API progresivamente a cuatro réplicas (máximo dos por nodo), validando la distribución y balanceo para cada servicio.

**La arquitectura definitiva ya no es una propuesta.** Son cinco microservicios diferentes en veinte instancias/contenedores de aplicación; además hay cinco MySQL en Ubuntu3. Ubuntu2 continúa ejecutando aplicaciones, siendo manager Swarm y alojando HAProxy/Spark/dashboard.

El tráfico HTTP sigue el flujo cliente → HAProxy → APIs → MySQL en Ubuntu3. El dashboard Spark V2 del puerto 8090 lee el JSON del procesamiento batch de cinco CSV; no consulta MySQL en tiempo real. HAProxy publica 8080/8888 en modo `host` y Docker Overlay habilita DNS y comunicación entre nodos.

Las métricas de carga 1 vs 2 réplicas son **históricas**. Está pendiente obtener RPS y latencia de la configuración final de cuatro réplicas.

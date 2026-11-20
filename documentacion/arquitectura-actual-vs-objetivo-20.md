# NOVATIX — Diferencia entre arquitectura implementada y objetivo propuesto de 20 instancias

**Estado de documentación: 20/11/2026. No es una constancia de que se haya desplegado el objetivo.**

## Lo que está efectivamente funcionando y verificado

El clúster posee tres máquinas VirtualBox/Ubuntu 22.04:

| Nodo | IP | Rol |
|---|---|---|
| servidorUbuntu1 | `192.168.100.2` | Cinco API (una tarea por microservicio), Spark Worker 1 |
| servidorUbuntu2 | `192.168.100.3` | Cinco API (una tarea por microservicio), manager, HAProxy, dashboard en puerto 8090, Spark Master y Worker 2 |
| servidorUbuntu3 | `192.168.100.4` | Cinco servicios MySQL con volúmenes persistentes |

**Implementación actual:** 5 microservicios distintos × 2 réplicas globales por servicio = **10 instancias Node.js**, distribuidas 5 en Ubuntu1 y 5 en Ubuntu2. La política Swarm vigente es `replicas: 2`, `max_replicas_per_node: 1` y `node.labels.novatix.role==aplicaciones`.

**HAProxy vigente:** una instancia en Ubuntu2, puerto externo `8080`, cinco backends `server-template ... 2 tasks.novatix_stack_*:<puerto>` con balanceo `roundrobin`. El balanceador consulta APIs, **no conecta a MySQL**; cada API utiliza su propio servicio MySQL por DNS interno Docker sobre la red overlay `novatix_stack_novatix_net_new` (`10.77.0.0/24`).

## Diferencia señalada en las imágenes del plan y la última indicación

Las capturas antiguas aportadas por el equipo dicen **«dos instancias de cada microservicio, una en Ubuntu1 y otra en Ubuntu2»**, que matemáticamente significa 10 instancias en total. En la última indicación, el equipo explicita otro objetivo: **«dos instancias de cada microservicio en Ubuntu1 y otras dos en Ubuntu2»**.

| Microservicio | Actual Ubuntu1 | Actual Ubuntu2 | Nuevo objetivo Ubuntu1 | Nuevo objetivo Ubuntu2 |
|---|---:|---:|---:|---:|
| Usuarios | 1 | 1 | 2 | 2 |
| Equipos | 1 | 1 | 2 | 2 |
| Partidos | 1 | 1 | 2 | 2 |
| Apuestas | 1 | 1 | 2 | 2 |
| Dinero | 1 | 1 | 2 | 2 |
| **Total Node.js** | **5** | **5** | **10** | **10** |

**Meta explicitada ahora: 20 réplicas de cinco microservicios**, cuatro réplicas por servicio, **no 20 microservicios diferentes ni necesariamente 20 imágenes distintas**. La nueva meta **no está desplegada ni probada** en los registros disponibles.

## Cambios necesarios para implementar esa nueva meta

1. **Swarm:** pasar cada API de `replicas: 2` a `replicas: 4` y de `max_replicas_per_node: 1` a **2**, manteniendo Ubuntu1 y Ubuntu2 como nodos etiquetados para aplicaciones.
2. **Balanceo HTTP:** revisar y ampliar `haproxy/haproxy.cfg` de 2 a **4 entradas/slots de backend por microservicio**, con descubrimiento DNS de todas las tareas; sin ello no estaría demostrado el uso de las cuatro réplicas. Probar `X-Replica` y estadísticas antes de atribuir reparto a cuatro tareas.
3. **Capacidad:** comprobar la CPU, RAM, límites de memoria y carga de Ubuntu1 (2 vCPU, 4 GiB) y Ubuntu2 (4 vCPU, 8 GiB) porque duplicar contenedores no garantiza mayor throughput.
4. **Integridad y pruebas:** guardar el inventario original, verificar las cinco bases en Ubuntu3, hacer el cambio controlado, confirmar 4/4 por API con 2 por nodo, medir balanceo y latencias, disponer de procedimiento de reversión.
5. **Actualizar artefactos:** cambiar diagramas, YAML, documentación y presentación **solo después de que la configuración objetivo quede implementada y comprobada**. Si no se implementa, presentar la meta como propuesta y reportar diez instancias reales.

**No ejecutar `docker stack deploy`, `docker service update` ni `docker service scale` de forma masiva solo para corregir una diapositiva.** La plantilla YAML publicada refleja la implementación actual de 10 instancias y no es una receta validada para sustituir el despliegue.

## Corrección de otras capturas antiguas

- Algunas capturas muestran el dashboard de pruebas en `8093` y un backend Node/Express que consulta directamente cinco MySQL. Esta fue una versión anterior. El **dashboard analítico Spark V2 definitivo en 8090** lee el JSON `/resultados/reporte_novatix_v2.json` generado por un procesamiento por lotes de Spark.
- Spark: Master Ubuntu2 y Worker1 Ubuntu1 / Worker2 Ubuntu2, con reporte producido por un trabajo terminado; su clúster es un plano analítico separado del enrutamiento HAProxy hacia las APIs transaccionales.
- No afirmar que el routing mesh publica HAProxy en 8080: el inventario muestra puerto HAProxy **modo `host`**, mientras que la red overlay y DNS de Docker permiten comunicación entre contenedores. No convertir el routing mesh en un salto obligatorio del diagrama sin evidencia.

## Qué pueden decir los presentadores hoy

> NOVATIX implementa cinco microservicios con dos réplicas cada uno —diez instancias en total—, distribuidas entre Ubuntu1 y Ubuntu2. MySQL se separó en Ubuntu3 y HAProxy reparte el tráfico entre dos instancias por servicio. Una ampliación propuesta a dos réplicas por microservicio en cada nodo equivaldría a veinte instancias y requeriría adaptar Swarm y HAProxy; aún no forma parte de la configuración verificada. Spark procesa los CSV por lotes y el dashboard final publica el reporte JSON en el puerto 8090.


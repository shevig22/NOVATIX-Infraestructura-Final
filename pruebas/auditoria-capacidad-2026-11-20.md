# NOVATIX — Auditoría de capacidad para la meta de 20 instancias

**Fuente:** salidas de terminal recibidas del equipo en Ubuntu1 y Ubuntu2 el 20 de noviembre de 2026. **Alcance:** instantáneas de recursos en reposo; no representan prueba de estrés ni garantía de capacidad bajo carga.

## Arquitectura definitiva

- Ubuntu1 (192.168.100.2): 10 contenedores Node.js de cinco microservicios, dos por microservicio; Spark Worker 1.
- Ubuntu2 (192.168.100.3): otros 10 contenedores Node.js (dos por microservicio); manager Swarm, HAProxy, dashboard Spark V2, Spark Master y Worker 2.
- Ubuntu3 (192.168.100.4): cinco MySQL 8.0 con volúmenes persistentes.
- Total objetivo de APIs: **20 instancias** de **5 servicios distintos**, con `replicas=4`, `MaxReplicas=2` por servicio, ubicación limitada mediante `node.labels.novatix.role==aplicaciones` (Ubuntu1/Ubuntu2).

## Auditoría real observada

| Indicador | servidorUbuntu1 | servidorUbuntu2 |
|---|---:|---:|
| vCPU disponibles nominales | 2 | 4 |
| RAM total (`free -m`) | 3909 MiB | 7935 MiB |
| RAM disponible (`free -m`) | 3090 MiB | 6843 MiB |
| Load avg. 1m | 0,18 | 0,03 |
| Swap usada | 0 MiB | 0 MiB |
| Tareas API actuales | 5 | 5 |
| Tareas API adicionales propuestas | 5 | 5 |

- Ubuntu1: espacio disponible en la partición que contiene `/var/lib/docker`: **16 GB**, 46 % usado; Docker 29.1.3 activo, reporta 12 contenedores corriendo en total, seis con nombre NOVATIX mostrados en la selección (cinco APIs y Spark Worker1).
- API Ubuntu1: dinero 21,13 MiB, equipos 38,45 MiB, partidos 27,17 MiB, apuestas 22,2 MiB, usuarios 20,51 MiB. Spark Worker1: 185,5 MiB.
- API Ubuntu2: usuarios 23,32 MiB, equipos 25,21 MiB, partidos 25,18 MiB, apuestas 21,29 MiB, dinero 21,64 MiB. También: HAProxy 43,7 MiB, dashboard 59,73 MiB, Spark Master 178,7 MiB y Worker2 197,2 MiB.
- Tres nodos `Ready`; Ubuntu1 y Ubuntu2 etiquetados `novatix.role=aplicaciones`, Ubuntu3 `novatix.role=datos`.
- Todas las cinco APIs observadas con **dos tareas Running**, una en Ubuntu1 y una en Ubuntu2.
- El comando anterior imprimió `ERROR=INSPECCION_*` por leer un campo de límites de recursos inexistente o no definido mediante plantilla Go; las tareas siguieron `Running`. El script de auditoría se corrigió para manejar campos ausentes.

## Dictamen operativo

En reposo los recursos disponibles sugieren **margen para añadir cinco procesos Node.js por nodo**, pero esto **no equivale** a demostrar capacidad bajo carga. Ubuntu1 tiene solamente dos vCPU y puede saturarse antes que Ubuntu2 durante peticiones concurrentes. Verificar reservas y límites de memoria de Swarm y medir p95/errores una vez completada la ampliación.

## Secuencia de cambio recomendada — no ejecutada

1. Identificar el `ConfigName` y el `File.Name`/ruta de la configuración HAProxy **efectiva** y compararla con el archivo versionado del repositorio.
2. Preparar **sin desplegar** una nueva configuración HAProxy de cinco backends, cada uno con cuatro slots `server-template` en lugar de dos; comprobar `haproxy -c`.
3. Publicar la nueva configuración Docker como objeto inmutable nuevo y actualizar únicamente el servicio HAProxy con respaldo de la configuración anterior. Confirmar HTTP 200 y que los dos backends existentes siguen activos.
4. Cambiar **solo Equipos** a `replicas=4` y `MaxReplicas=2`; observar `4/4` con distribución 2/2 Ubuntu1/Ubuntu2, respuesta HTTP y cuatro réplicas balanceadas. Preparar y probar reversión a 2.
5. Si Equipos funciona, continuar **uno por uno** con Usuarios, Partidos, Apuestas y Dinero, verificando los cinco backends y el estado de las cinco MySQL.
6. Repetir carga HTTP, métricas de latencia/p95/errores y registrar evidencias; solo entonces actualizar el informe IEEE y los diagramas como «20 instancias implementadas».

**No escalar las cinco APIs de golpe ni aplicar la plantilla Docker Swarm inconclusa sobre el clúster.** La auditoría no ha modificado servicios. La página de estadísticas de HAProxy en :8888 carece de autenticación; mantenerla en la red de laboratorio.

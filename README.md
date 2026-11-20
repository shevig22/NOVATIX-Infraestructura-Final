# NOVATIX — Infraestructura Final

Proyecto académico de **Redes e Infraestructura**: plataforma de microservicios y analítica distribuida implementada con **Docker Swarm, Node.js, MySQL, HAProxy y Apache Spark 3.5.9**.

> **Estado de consolidación (20/11/2026):** publicados el código de las cinco APIs recuperadas de las imágenes Docker Hub `shevig2208`, el código del dashboard Spark V2, PySpark V2, el `haproxy.cfg` activo y los diagramas. **Aún faltan** validar los manifiestos en un entorno limpio, documentar la importación de MySQL, recuperar los procesos de preparación de datos y medir el desempeño. El `Vagrantfile` efectivo ya está publicado.

## Arquitectura desplegada

| Nodo | IP privada | Responsabilidades |
|---|---|---|
| **servidorUbuntu1** | `192.168.100.2` | Una réplica de cada una de las 5 APIs; Spark Worker 1 |
| **servidorUbuntu2** | `192.168.100.3` | Manager Swarm; una réplica de cada API; HAProxy; dashboard; Spark Master y Worker 2 |
| **servidorUbuntu3** | `192.168.100.4` | Cinco instancias MySQL, cada una con almacenamiento persistente |

- Red privada entre VMs: `192.168.100.0/24`.
- Red lógica Docker Overlay: `10.77.0.0/24`, servicio de red `novatix_stack_novatix_net_new`.
- **10 réplicas API:** 2 de Usuarios, 2 de Equipos, 2 de Partidos, 2 de Apuestas y 2 de Dinero. Máximo una réplica por nodo.
- **5 servicios MySQL:** `novatix_stack_db-usuarios`, `db-equipos`, `db-partidos`, `db-apuestas`, `db-dinero` (todos con prefijo `novatix_stack_`).

## Acceso local desde el equipo anfitrión

| Servicio | URL |
|---|---|
| HAProxy / API Gateway | `http://192.168.100.3:8080` |
| Dashboard NOVATIX Spark V2 | `http://192.168.100.3:8090` |
| Spark Master Web UI | `http://192.168.100.3:8092` |
| Estadísticas HAProxy | `http://192.168.100.3:8888` |

El puerto 8093 se utilizó para pruebas y **no forma parte del diseño final**. En la auditoría del 19/11 se verificó que solamente continúa `novatix_dashboard` en el puerto 8090.

## Flujos de datos

**Operación transaccional:** cliente → HAProxy → API de microservicio → MySQL del servicio en Ubuntu3 → respuesta.

**Analítica Spark V2:** cinco archivos CSV preparados a partir de una fuente futbolística abierta y ampliaciones simuladas → Spark Master y dos Workers → reporte JSON → API Express del dashboard → gráficos y tablas. El análisis Spark es **por lotes**; el navegador no consulta las bases MySQL directamente. Tampoco se afirma que el reporte Spark sea una consulta SQL en tiempo real.

El Dashboard Spark V2 incluye once conjuntos de análisis y muestra tendencias mensuales, ligas, equipos, apuestas, movimientos y distribuciones. El reporte está en `/vagrant/novatix_spark_resultados/reporte_novatix_v2.json` en el entorno Vagrant.

## Evidencia ya obtenida en el entorno

- Los tres nodos en estado `Ready`.
- Las 10 réplicas de API distribuidas 5/5 en Ubuntu1 y Ubuntu2.
- Balanceo HAProxy: 50/50 solicitudes HTTP 200; dos instancias `UP` por cada uno de los 5 backends; 25/25 solicitudes repartidas.
- 5 MySQL en Ubuntu3 verificados.
- Spark V2 finalizó `Complete`, produjo JSON válido con 11 análisis y observó dos ejecutores.
- Dashboard principal 8090: versión Spark Analytics V2 desplegada.

Estas verificaciones **no sustituyen** una prueba de carga, latencia o recuperación ante fallos. Ver [estado y pendientes](documentacion/estado-y-pendientes.md).

## Estructura de trabajo

- `documentacion/`: arquitectura, estado de pruebas y registro de consolidación.
- `diagramas/`: diagramas editables de despliegue y pipeline publicados.
- `spark/`: código PySpark V2, runner y documentación publicados.
- `dashboard/`: servidor Node.js, interfaz web, Dockerfile e instrucciones de la versión Spark V2 publicada.
- `infraestructura/`: `Vagrantfile` original recuperado y publicado; todavía faltan los scripts de provisión del software.
- `haproxy/`: configuración completa del balanceador activo.
- `microservicios/`: código original de las cinco APIs extraído de las imágenes `shevig2208`, con sus Dockerfiles y lockfiles.
- `docker-swarm/`: inventario real de 17 servicios y plantilla YAML no probada para redespliegue; `mysql/`: cinco esquemas SQL normalizados publicados, aún pendientes la importación y los datos de prueba.
- `diagramas/`, `pruebas/`: diagramas y evidencias.

**Atención:** la configuración del repositorio original [Sant1833/Novatix](https://github.com/Sant1833/Novatix) corresponde a otra topología y **no debe desplegarse sin adaptación** sobre estas máquinas.

## Entrega

Proyecto final del módulo de Infraestructura. Fecha indicada en el enunciado: **20 de noviembre de 2026**. Entregables: informe IEEE (máximo 10 páginas), presentación de 15 minutos, código/configuración y README de reproducción.

## Datos de origen y pruebas pendientes

El equipo utilizó como punto de partida el dataset abierto [Football Data from Transfermarkt](https://www.kaggle.com/datasets/davidcariboo/player-scores) de Kaggle y generó datos complementarios; el mecanismo preciso de transformación sigue pendiente de publicar. Spark V2 lee CSV preparados, no consulta Kaggle ni MySQL en tiempo real. Consultar [procedencia](documentacion/procedencia-de-datos.md).

La guía de [Swarm](docker-swarm/README.md), [Vagrant](infraestructura/README.md) y [MySQL](mysql/README.md) distingue lo verificado de los archivos de reconstrucción aún pendientes. [Plan de pruebas](pruebas/plan-rendimiento.md) preparado, sin afirmar métricas todavía.

## Resultados Spark y carga HTTP

Ver [resultados analíticos verificados](documentacion/resultados-spark-v2.md) y [probador de carga HTTP de solo lectura](pruebas/README-carga.md). El paquete CSV completo se conservó y verificó por SHA-256, pero su publicación binaria en GitHub sigue pendiente.

### Primeros resultados de carga (20/11/2026)

La primera prueba GET en `/api/equipos/1` reportó **360/360 HTTP 200, cero errores** y reparto exacto **180/180** entre dos réplicas. Se midieron **152,86; 379,70 y 594,33 RPS** para concurrencias **1, 10 y 25** respectivamente. [Tabla completa y advertencias](pruebas/resultados-carga-2026-11-20.md). Estos datos son una primera medición; todavía no equivalen a comparar el rendimiento con una o dos réplicas, y falta adjuntar el JSON bruto.

## Arquitectura definitiva requerida: veinte instancias

La implementación verificada tiene **10 instancias de microservicios** (5 APIs × 2 réplicas en total, una en Ubuntu1 y otra en Ubuntu2). Las capturas de diseño compartidas originalmente describen esta distribución. El equipo **ha confirmado como arquitectura definitiva de NOVATIX un total de 20 instancias** (5 APIs × 4 réplicas por servicio, 2 por nodo), aunque **aún no se han desplegado ni validado**. La configuración de 10 es la base comprobada y debe evolucionarse hasta 20. Consultar [diferencias y cambios requeridos](documentacion/arquitectura-actual-vs-objetivo-20.md). El objetivo final del proyecto es 20; no declarar que ya se ha implementado hasta que Swarm muestre 4/4 por API, 2 en cada nodo, y HAProxy balancee entre cuatro.

**Escalabilidad ya medida:** [comparación real 1 frente a 2 réplicas de Equipos](pruebas/resultados-escalabilidad-2026-11-20.md), con 720/720 HTTP 200, aumentos de RPS del 25,0 % al 63,2 % y restauración final 2/2.

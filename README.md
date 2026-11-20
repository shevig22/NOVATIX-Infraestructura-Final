# NOVATIX — Infraestructura final

Proyecto académico de microservicios para apuestas deportivas **simuladas**, desplegado en tres máquinas virtuales Ubuntu con Docker Swarm, HAProxy, cinco MySQL y análisis por lotes mediante Apache Spark 3.5.9. Este repositorio documenta el entorno verificado el 20/11/2026 y permite repetir la analítica desde los cinco CSV publicados; **la reconstrucción integral del clúster desde cero sigue pendiente de validación**.

## Empezar aquí

| Quiero… | Documento o recurso |
|---|---|
| Conocer la topología real | [Arquitectura implementada](documentacion/arquitectura-implementada.md) y [diagramas](diagramas/) |
| Verificar los CSV de Spark | [Datos de entrada](datos/README.md), [manifiesto](datos/manifest-csv-v2.json) y [validador](datos/verificar_csv.py) |
| Ejecutar la analítica | [PySpark V2](spark/README.md), [script](spark/analisis_novatix_v2.py) |
| Entender el dashboard | [Dashboard Docker/Node.js](dashboard/README.md) |
| Examinar el frontend real Ubuntu1 | [**7 archivos exactos: HTML, JS, CSS e integración Spark**](frontend/README.md) |
| Reproducir NOVATIX paso a paso (requisito académico) | [**Guía de reproducción actualizada: 3 Ubuntu, Swarm, MySQL, Spark, frontend y pruebas**](documentacion/reproduccion-paso-a-paso.md) |
| Evaluar qué es reproducible y qué falta | [**Auditoría profunda del repositorio**](documentacion/auditoria-reproducibilidad-2026-11-20.md) |
| Ver integración reciente (frontend, paginación, Spark) | [Avances del 20/11/2026 — estados y pendientes](documentacion/avances-frontend-spark-paginacion-2026-11-20.md) |
| Comprobar archivos y CSV descargados | [`python3 pruebas/comprobar-entrega.py`](pruebas/comprobar-entrega.py) — verifica los hashes del frontend y los cinco CSV |
| Consultar pruebas | [1 vs 2 réplicas](pruebas/resultados-escalabilidad-2026-11-20.md), [10 vs 20 en JMeter](pruebas/comparativa-jmeter-10-vs-20-2026-11-20.md), [restauración final](pruebas/restauracion-final-20-2026-11-20.md) |

## Componentes desplegados

| Máquina | IP | Función |
|---|---|---|
| servidorUbuntu1 | 192.168.100.2 | 10 instancias API (dos por servicio) y Spark Worker 1 |
| servidorUbuntu2 | 192.168.100.3 | 10 instancias API, Swarm Manager, HAProxy, Spark Master + Worker 2 y dashboard |
| servidorUbuntu3 | 192.168.100.4 | Cinco MySQL 8.0 con volúmenes persistentes |

Las **20 instancias API** (cuatro por cada una de las API Usuarios, Equipos, Partidos, Apuestas, Dinero) quedaron **restauradas y verificadas** tras el ensayo temporal de diez instancias; cinco endpoints respondieron HTTP 200, MySQL 5/5 y HAProxy 1/1. Red privada `192.168.100.0/24`; red overlay `10.77.0.0/24`.

| Acceso desde el anfitrión del laboratorio | URL |
|---|---|
| HAProxy (API REST) | http://192.168.100.3:8080 |
| Estadísticas HAProxy | http://192.168.100.3:8888 |
| Dashboard Spark V2 | http://192.168.100.3:8090 |
| Spark Master UI | http://192.168.100.3:8092 |

## Datos y flujo de la aplicación

**Ruta transaccional:** cliente → HAProxy → réplica API → MySQL del dominio, en Ubuntu3.

**Ruta analítica:** [cinco CSV preparados](datos/) (500 usuarios, 3.277 equipos, 88.958 partidos, 14.770 apuestas y 22.819 movimientos; **130.324 filas**) → [Spark PySpark V2](spark/analisis_novatix_v2.py) → JSON por lotes → [API y frontend Node.js del dashboard](dashboard/README.md). **El dashboard no consulta MySQL directamente y no está escrito con React o Express.** El reporte se monta en el contenedor desde `/vagrant/novatix_spark_resultados/reporte_novatix_v2.json` como archivo de solo lectura.

Los CSV están en [`datos/`](datos/); el **manifiesto no contiene datos**, solo recuentos, columnas y huellas SHA-256. El dataset deportivo se adaptó desde [Football Data from Transfermarkt en Kaggle](https://www.kaggle.com/datasets/davidcariboo/player-scores); apuestas, usuarios y dinero son **simulados**. [Procedencia y límites](documentacion/procedencia-de-datos.md). No se ha publicado el generador histórico completo ni la transformación exacta desde Kaggle.

### Verificar los archivos de la entrega y los CSV

Desde la raíz del clon:

```bash
python3 pruebas/comprobar-entrega.py
```

Esta comprobación **no instala** NOVATIX ni certifica el despliegue de los servicios; verifica archivos publicados, hashes y relaciones de los cinco CSV, y contrasta las huellas SHA-256 de los siete archivos originales del frontend Ubuntu1.

### Verificar los CSV clonados

```bash
python3 datos/verificar_csv.py
```

El verificador no altera archivos ni bases de datos; comprueba esquema, SHA-256, total de filas, ID duplicados y seis relaciones referenciales (incluye la selección especial `equipo_id=0` = «Empate»).

## Estado de las pruebas

- **Escalabilidad controlada, Equipos 1 vs 2 réplicas:** 720/720 respuestas HTTP 200; throughput de +25,0 % a +63,2 % según concurrencia, con mejora de latencia.
- **Balanceo 4/4 por API:** 80 GET HTTP 200 por API, distribuidos 20/20/20/20.
- **Estrés exploratorio JMeter, 10 vs 20 instancias:** 403,3 vs 550,2 RPS mostrados; 99 vs 64 ms de media. **Ambas corridas acumularon ~21 % de errores** de causa no determinada; no representan capacidad sostenible ni benchmark reproducido sin JTL.

## Reproducibilidad

La [guía paso a paso](documentacion/reproduccion-paso-a-paso.md) organiza nueve fases: preparar el laboratorio, crear las VM, configurar Swarm, MySQL y las API, ejecutar Spark/dashboard, publicar el frontend Apache, verificar la futura API paginada, integrar visualmente Spark y registrar las evidencias. Incluye una matriz de verificación que distingue **código publicado, pruebas reales y procedimientos todavía manuales o no validados**. Es una **guía técnica parcial**, no un instalador automático certificado.

**Estado al 20/11/2026:** los cambios de paginación de Partidos y Equipos **ya fueron publicados en `main`**, mediante el [commit `593e8213`](https://github.com/shevig22/NOVATIX-Infraestructura-Final/commit/593e8213d0ef85551dd084822211f2928165fc56) que aplicó el parche original de Ubuntu2. **Las nuevas imágenes no están desplegadas en Docker Swarm** y todavía falta validación contra MySQL real. **Los siete archivos originales del frontend Ubuntu1 están ahora publicados en [`frontend/`](frontend/) y se verificaron mediante SHA-256/Git SHA frente al respaldo recibido.** También se publicó un ejemplo del proxy Spark de Apache; **el VirtualHost completo de las rutas transaccionales aún no se ha entregado ni probado en instalación nueva**. El dashboard embebido usa un control de rol de cliente que **no equivale a autorización segura del servidor**. Se documentó sin presentar estas funciones como completamente reproducibles o seguras.

## Limitaciones para reproducir la infraestructura completa

1. `infraestructura/Vagrantfile` crea las VM, pero **no instala automáticamente** Swarm, Spark, volúmenes y servicios.
2. `docker-swarm/stack.novatix.template.yml` está **sin validar para instalación limpia**; no ejecutarla sobre el laboratorio actual. Faltan secretos/usuarios, importación MySQL probada y despliegue integral de Spark/dashboard.
3. Los cinco CSV permiten verificar los análisis por lotes, **pero no contienen las columnas de usuarios necesarias para poblar directamente la base transaccional**, ni el generador original de cuotas.
4. `dashboard/Dockerfile` portable y su prueba aislada se publicaron, **sin evidencia aún de construcción o despliegue de esa nueva imagen**. El servicio original de dashboard sigue activo en 8090.
5. El frontend original y el proxy Spark de ejemplo están publicados; faltan el VirtualHost transaccional completo y pruebas de navegador en instalación limpia. La paginación del backend está publicada en GitHub, pero no desplegada en Swarm ni validada contra MySQL real.
6. La implementación académica conserva contraseñas sin hash y valores predeterminados inseguros: **no desplegar fuera de una red de laboratorio ni exponer por Internet**.

La lista priorizada de riesgos, archivos a mantener, pruebas verificadas y pendientes está en la [auditoría técnica](documentacion/auditoria-reproducibilidad-2026-11-20.md). No se reiniciaron ni modificaron servidores para organizar GitHub.

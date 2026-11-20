# NOVATIX — Infraestructura final

Proyecto académico de microservicios para apuestas deportivas **simuladas**, desplegado en tres máquinas virtuales Ubuntu con Docker Swarm, HAProxy, cinco MySQL y análisis por lotes mediante Apache Spark 3.5.9. Este repositorio documenta el entorno verificado el 20/11/2026 y permite repetir la analítica desde los cinco CSV publicados; **la reconstrucción integral del clúster desde cero sigue pendiente de validación**.

## Empezar aquí

| Quiero… | Documento o recurso |
|---|---|
| Conocer la topología real | [Arquitectura implementada](documentacion/arquitectura-implementada.md) y [diagramas](diagramas/) |
| Verificar los CSV de Spark | [Datos de entrada](datos/README.md), [manifiesto](datos/manifest-csv-v2.json) y [validador](datos/verificar_csv.py) |
| Ejecutar la analítica | [PySpark V2](spark/README.md), [script](spark/analisis_novatix_v2.py) |
| Entender el dashboard | [Dashboard Docker/Node.js](dashboard/README.md) |
| Reconstruir en laboratorio NUEVO | [Guía orientativa con dependencias pendientes](documentacion/reproduccion-paso-a-paso.md) |
| Evaluar qué es reproducible y qué falta | [**Auditoría profunda del repositorio**](documentacion/auditoria-reproducibilidad-2026-11-20.md) |
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

### Verificar los CSV clonados

```bash
python3 datos/verificar_csv.py
```

El verificador no altera archivos ni bases de datos; comprueba esquema, SHA-256, total de filas, ID duplicados y seis relaciones referenciales (incluye la selección especial `equipo_id=0` = «Empate»).

## Estado de las pruebas

- **Escalabilidad controlada, Equipos 1 vs 2 réplicas:** 720/720 respuestas HTTP 200; throughput de +25,0 % a +63,2 % según concurrencia, con mejora de latencia.
- **Balanceo 4/4 por API:** 80 GET HTTP 200 por API, distribuidos 20/20/20/20.
- **Estrés exploratorio JMeter, 10 vs 20 instancias:** 403,3 vs 550,2 RPS mostrados; 99 vs 64 ms de media. **Ambas corridas acumularon ~21 % de errores** de causa no determinada; no representan capacidad sostenible ni benchmark reproducido sin JTL.

## Limitaciones para reproducir la infraestructura completa

1. `infraestructura/Vagrantfile` crea las VM, pero **no instala automáticamente** Swarm, Spark, volúmenes y servicios.
2. `docker-swarm/stack.novatix.template.yml` está **sin validar para instalación limpia**; no ejecutarla sobre el laboratorio actual. Faltan secretos/usuarios, importación MySQL probada y despliegue integral de Spark/dashboard.
3. Los cinco CSV permiten verificar los análisis por lotes, **pero no contienen las columnas de usuarios necesarias para poblar directamente la base transaccional**, ni el generador original de cuotas.
4. `dashboard/Dockerfile` portable y su prueba aislada se publicaron, **sin evidencia aún de construcción o despliegue de esa nueva imagen**. El servicio original de dashboard sigue activo en 8090.
5. La implementación académica conserva contraseñas sin hash y valores predeterminados inseguros: **no desplegar fuera de una red de laboratorio ni exponer por Internet**.

La lista priorizada de riesgos, archivos a mantener, pruebas verificadas y pendientes está en la [auditoría técnica](documentacion/auditoria-reproducibilidad-2026-11-20.md). No se reiniciaron ni modificaron servidores para organizar GitHub.

# NOVATIX — Validación de la arquitectura definitiva de 20 instancias

**Origen de esta evidencia:** salida de terminal suministrada por el equipo, ejecutada en el manager `servidorUbuntu2` el 20/11/2026. El resultado de auditoría fue `ARQUITECTURA_20_INSTANCIAS=VALIDADA`. Es una comprobación operativa puntual, no una medición de estrés ni demostración de recuperación ante fallos.

## Inventario de cinco microservicios

| API | Ubuntu1 | Ubuntu2 | Total de réplicas | Máximo por nodo | Estado |
|---|---:|---:|---:|---:|---|
| Usuarios | 2 | 2 | 4/4 | 2 | OK |
| Equipos | 2 | 2 | 4/4 | 2 | OK |
| Partidos | 2 | 2 | 4/4 | 2 | OK |
| Apuestas | 2 | 2 | 4/4 | 2 | OK |
| Dinero | 2 | 2 | 4/4 | 2 | OK |
| **Total** | **10** | **10** | **20/20** | — | **Verificado** |

Los cinco servicios MySQL (`db-usuarios`, `db-equipos`, `db-partidos`, `db-apuestas` y `db-dinero`) mostraron una tarea `Running` cada uno en **Ubuntu3**.

## Balanceo HTTP del quinto servicio — Dinero

- URL de prueba: `GET http://192.168.100.3:8080/api/dinero`.
- **80/80 respuestas HTTP 200**; cero errores de red.
- `dinero1`, `dinero2`, `dinero3`, `dinero4`: **20 solicitudes por backend**, cada uno con estado HAProxy `UP`.
- Porcentaje observado: **25 % por instancia**.
- Las validaciones anteriores de Usuarios, Equipos, Partidos y Apuestas también registraron **80/80 GET 200** por servicio, distribución 20/20/20/20, cuatro backends `UP`, cero errores.
- Por consiguiente, las cinco API tienen evidencias de balanceo HTTP de cuatro réplicas, **sin afirmar rendimiento máximo ni disponibilidad global**.

## Despliegue y alcance

- Servidores: Ubuntu1 `192.168.100.2` (worker), Ubuntu2 `192.168.100.3` (manager + aplicaciones) y Ubuntu3 `192.168.100.4` (cinco MySQL).
- Swarm: 4 réplicas por API, máximo 2 por nodo, nodos Ubuntu1/Ubuntu2 con etiqueta `novatix.role=aplicaciones`; Ubuntu3 lleva `novatix.role=datos`.
- HAProxy: una instancia en Ubuntu2, Docker Config activa `novatix_stack_haproxy_cfg_4replicas_20261120` (ID `7cqgnfb906rpe8y2uihuiss3m`), cinco backends `roundrobin` con cuatro slots, HTTP `8080` y estadísticas `8888` publicados modo `host`.
- Configuración HAProxy previa conservada como respaldo en `/vagrant/novatix_haproxy_original_20261120_034541.cfg`, SHA-256 `d4269dedf6983e329c48931d525a00f2b8f4693898fc7577c39e7c83ac22237e`.
- Cinco servicios MySQL 8.0 en Ubuntu3 con volúmenes persistentes. HAProxy comunica con las API, **no directamente con MySQL**.
- Spark 3.5.9 procesa cinco CSV por lotes, genera reporte JSON para el dashboard en Ubuntu2 puerto `8090`. No es consulta SQL en tiempo real.
- Las pruebas anteriores de carga y escalabilidad de Equipos se ejecutaron **con una y dos réplicas**; sus RPS no describen la topología actual de cuatro réplicas.

## Aún pendiente

1. Medir throughput, latencia p95, errores y recursos bajo la configuración definitiva de **cuatro réplicas por API**.
2. Verificar recuperación ante fallo controlado y disponibilidad de datos. Ubuntu2 (HAProxy/manager) y Ubuntu3 (MySQL) son puntos únicos de fallo.
3. Publicar el JSON bruto del experimento, el dataset si procede y validar instalación reproducible desde cero.
4. Actualizar las diapositivas e informe IEEE con la cifra **20 instancias implementadas**, sin confundir la prueba histórica de 1 contra 2 con el desempeño de cuatro.

No se realizaron cambios en Docker Swarm durante la auditoría final.

## Nota de estado posterior a la validación

La auditoría de 20 instancias documentada arriba es histórica y fue correcta en el momento de ejecutarse. **Posteriormente** el equipo redujo las cinco API a **2/2 por servicio (10 instancias)** para un ensayo comparativo JMeter, manteniendo cinco MySQL y HAProxy. **Actualización posterior:** el equipo restauró las veinte instancias y confirmó `NOVATIX=20_INSTANCIAS_RESTAURADAS`, con distribución 10/10, cinco MySQL 1/1, HAProxy 1/1 y cinco endpoints HTTP 200. [Ver acta de restauración](restauracion-final-20-2026-11-20.md). [Comparación JMeter](comparativa-jmeter-10-vs-20-2026-11-20.md).

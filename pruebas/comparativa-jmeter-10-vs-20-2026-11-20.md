# NOVATIX — Comparativa exploratoria de estrés con 10 y 20 instancias API (JMeter)

**Fecha:** 20/11/2026. **Fuente:** capturas y videos de JMeter 5.6.3 aportados por el equipo, más auditorías de Docker Swarm suministradas en terminal. Las cifras son transcripciones de los reportes de resumen y puntos visibles en las grabaciones; no se dispone todavía de archivos JTL completos ni del detalle de códigos de error. **No se trata de una medición reproducida en varias corridas.**

## Propósito y arquitectura

Comparar cinco microservicios Node.js (Usuarios, Equipos, Partidos, Apuestas y Dinero) con dos despliegues Docker Swarm:

- **10 instancias API:** dos réplicas por servicio, una en Ubuntu1 y una en Ubuntu2; auditoría `ESCENARIO_10=VALIDADO`, con las cinco MySQL 1/1, HAProxy 1/1 y las cinco consultas GET respondiendo HTTP 200 antes del ensayo.
- **20 instancias API:** cuatro réplicas por servicio, dos por nodo. Arquitectura verificada previamente mediante `ARQUITECTURA_20_INSTANCIAS=VALIDADA`; cinco MySQL en Ubuntu3, HAProxy V4 en Ubuntu2.
- **Mismo balanceador HAProxy V4** en ambas configuraciones. Las pruebas observadas utilizaron solicitudes GET a `/api/equipos/1` y `/api/usuarios` desde JMeter en **Windows**, interfaz gráfica, sin escritura en bases de datos.
- La configuración mostrada para la prueba de diez réplicas fue **50 hilos, subida de 10 s, bucle infinito y duración programada de 120 s**. En el escenario de veinte también se mostraron 50 usuarios virtuales. Los reportes se capturaron antes o al finalizar cada ejecución; no se confirma que ambas permanecieran activas los 120 s previstos.

## Resultados observados

| Métrica | 10 instancias | 20 instancias |
|---|---:|---:|
| Solicitudes totalizadas por JMeter | 41.130 | 41.039 |
| Rendimiento promedio mostrado (solicitudes/s, incluidas fallidas) | 403,3 | 550,2 |
| Tiempo medio total (ms) | 99 | 64 |
| Error acumulado final (%) | 20,98 | 20,71 |
| Tiempo máximo observado (ms) | 50.033 | 1.121 |
| Equipos: solicitudes | 20.589 | 20.536 |
| Equipos: media (ms) | 59 | 50 |
| Equipos: errores (%) | 21,06 | 20,78 |
| Usuarios: solicitudes | 20.541 | 20.503 |
| Usuarios: media (ms) | 140 | 78 |
| Usuarios: errores (%) | 20,90 | 20,65 |
| Tiempo de ejecución visible aproximado | ~101 s | ~74 s |

**Diferencia del rendimiento mostrado:** `(550,2 - 403,3) / 403,3 × 100 = +36,43 %` a favor del despliegue de 20 instancias. **Diferencia de latencia media:** `(99 - 64) / 99 × 100 = 35,35 %` menor en la ejecución con 20. Estas diferencias son observaciones de pruebas exploratorias, **no estimaciones definitivas de capacidad máxima ni de throughput exitoso**: el valor de RPS de JMeter incluye fallos, no coincide necesariamente con la carga ofrecida, y las duraciones fueron distintas.

## Evolución visible de errores y capacidad de respuesta

**Con 10 instancias:** en el video aparecen aproximadamente **19.854 solicitudes a 1:00, con 0,11 % de errores**; **27.696 a 1:20, con 0,08 %**; **31.812 a 1:30, con 0,16 %**; y **41.130 a ~1:41 con 20,98 %**. Las tasas redondeadas pueden fluctuar por acumulación y no permiten localizar el instante exacto del **primer** error. Entre los dos últimos puntos, se observa un aumento brusco del error acumulado, compatible con fallos masivos al final de la prueba.

**Con 20 instancias:** la grabación/captura registra **33.770 solicitudes a ~1:06 con 3,65 % de errores** y el resumen **41.039 solicitudes con 20,71 % de errores**. La fase final también presenta incremento abrupto de fallos.

**Observación cualitativa del operador:** en la prueba de diez instancias se percibieron errores leves desde etapas tempranas y tramos donde el contador de solicitudes avanzaba lentamente; asimismo, el tiempo de respuesta parecía aumentar antes que con veinte. Esta apreciación se consigna como **observación visual**, coherente con las medias observadas (99 vs 64 ms) y el máximo de latencia mayor con diez, pero **no está probado el orden exacto de aparición del primer error entre las dos corridas**: faltan timestamps de cada muestra y no debe darse un umbral de número acumulado de solicitudes como si fuera capacidad del sistema. En particular, los puntos visibles por sí solos no demuestran que el **primer error** ocurriera antes con diez que con veinte.

El aumento del tiempo entre incrementos del contador también puede proceder de **esperas en las peticiones, límites del generador JMeter, procesamiento y visualización de receptores gráficos**, además del servidor. No se conoce la causa de los errores porque falta inspeccionar `Response code`/`Response message` de muestras fallidas.

## Interpretación académica

1. **Hipótesis respaldada preliminarmente:** la duplicación horizontal de réplicas muestra señales de mejor rendimiento, con throughput reportado **36,4 % superior** y media **35,4 % inferior** en el ensayo de 20 instancias.
2. **Degradación anterior percibida en diez:** el operador observó antes síntomas de lentitud y errores iniciales con menos réplicas; anotarlos como evidencia cualitativa **sin cuantificar todavía el instante preciso de inicio**.
3. **Fallo severo en ambas:** ambos ensayos acabaron alrededor del **21 % de errores**, por encima del umbral exploratorio del 15–20 %. No debe afirmarse que 550,2 solicitudes/s sea capacidad sostenible sin errores.
4. **No se ha establecido un límite real:** la cantidad total de peticiones atendidas, 41 mil aproximadamente, no equivale al umbral sostenible en solicitudes/segundo. El porcentaje acumulado mezcla etapas sanas y fallidas.
5. **Advertencia metodológica:** ambas corridas utilizaron receptores de la interfaz gráfica; hay duraciones diferentes y no existe desglose de errores ni latencia p95 por intervalos. Los tiempos máximos de 20/50 segundos con diez instancias justifican examinar timeouts y colas, pero no prueban saturación de MySQL ni de HAProxy.

## Próximas pruebas para confirmación

- Conservar y analizar los **JTL individuales** y los logs de JMeter; distinguir HTTP 5xx, errores de conexión, timeouts y respuestas no esperadas.
- Repetir **el mismo plan** en modo no gráfico, misma mezcla GET, hardware, ramp-up y fases de carga con incrementos escalonados y duración máxima de seguridad; idealmente varias corridas en cada arquitectura, alternando el orden de prueba.
- Medir **errores y RPS en ventanas temporales**, latencia p95 solo de respuestas satisfactorias, recursos de JMeter, Ubuntu1, Ubuntu2, Ubuntu3 y métricas HAProxy.
- Definir por anticipado capacidad aceptable (por ejemplo errores <1 % y p95 dentro de umbral) y punto de fallo grave (15–20 % de errores sostenidos); detener ante efectos severos sobre el clúster.
- Después del ensayo de diez instancias, **restaurar y verificar las veinte**; evitar reinicios o limpiezas de caché que alteren la comparación.

## Texto para utilizar en el informe IEEE

> En una comparación exploratoria de estrés con Apache JMeter se evaluaron dos configuraciones de cinco microservicios: diez instancias (dos réplicas por servicio) y veinte instancias (cuatro réplicas por servicio). Las ejecuciones registraron, respectivamente, 403,3 y 550,2 solicitudes por segundo, y tiempos medios de respuesta de 99 y 64 ms. Esto equivale a un throughput observado 36,4 % superior y una latencia media 35,4 % inferior en el escenario de veinte instancias. Durante el ensayo con diez instancias se percibieron antes síntomas de ralentización y errores iniciales, aunque las capturas disponibles no permiten establecer el instante exacto del primer error de cada ejecución. Ambas pruebas alcanzaron aproximadamente 21 % de errores acumulados, por lo que estos resultados se consideran preliminares y no representan capacidad sostenible. Se requieren registros individuales y ensayos repetidos no gráficos para confirmar el límite de rendimiento.

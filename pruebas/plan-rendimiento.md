# Plan de pruebas de rendimiento y balanceo — primera medición registrada

**Estado:** primera prueba HTTP GET de 360 solicitudes con dos réplicas reportada por el equipo; falta comprobar archivo JSON y continuar las pruebas de escalabilidad y resistencia. Ver [resultados](resultados-carga-2026-11-20.md).

## Línea base

- Registrar `docker node ls`, `docker service ls`, tareas actuales por nodo y HTTP 200 de las cinco rutas `/api/{usuarios,equipos,partidos,apuestas,dinero}`.
- Confirmar que HAProxy atiende solicitudes en `192.168.100.3:8080` y que el dashboard de Spark funciona en 8090.
- Registrar cliente de prueba, CPU/RAM, URL, duración, simultaneidad y fecha/hora.

## Pruebas propuestas y límites

| Ensayo | Procedimiento | Métricas |
|---|---|---|
| Balanceo | GET de solo lectura repetidos a través de HAProxy, inspeccionando backends en 8888 | Solicitudes por instancia, respuestas HTTP |
| Carga gradual | Probar concurrencias 10, 25, 50, solo con GET y límites temporales | RPS, latencia media, p95, respuestas no 2xx, timeouts |
| Réplicas | Comparar 1 vs 2 instancias de **una** API, solo después de guardar configuración inicial | RPS/p95/errores y recuperación del estado |
| Fallo controlado | Solo si existe respaldo y margen de tiempo: detener una tarea de API y observar reasignación automática | Tiempo hasta estado `Running`, continuidad HTTP |

## Precauciones

- NO comparar 2 vs 4 réplicas: con Ubuntu1/Ubuntu2 para API y `MaxReplicas=1`, el diseño no tiene cuatro ubicaciones válidas.
- NO reiniciar Ubuntu3 (bases MySQL) ni Ubuntu2 (HAProxy y Manager) como primera prueba.
- NO usar GET con modificaciones, ni generar apuestas o movimientos reales.
- Resultados de HAProxy 50/50 anteriores solo verifican distribución; no sustituyen latencia, throughput o pruebas de estrés.
- Registrar resultados brutos y entorno; marcar explícitamente toda prueba no ejecutada.

## Probador incorporado

La primera medición utiliza el script [`carga_segura.py`](carga_segura.py) sobre un solo equipo: `GET /api/equipos/1`, con 1, 10 y 25 solicitudes simultáneas y un máximo de 120 solicitudes por escenario. Ver [instrucciones](README-carga.md). No escalar ni reiniciar servicios en esta primera ronda.

## Comparación ejecutada (20/11/2026)

Se registró en la consola [ensayo real 1 vs 2](resultados-escalabilidad-2026-11-20.md): 720/720 HTTP 200, restauración 2/2, throughput superior con dos réplicas en los tres escenarios. Esta medición **no valida** una topología con cuatro réplicas por microservicio ni un total de veinte instancias.

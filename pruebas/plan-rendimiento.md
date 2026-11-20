# Plan de pruebas de rendimiento y balanceo — pendiente de ejecutar

**Estado:** plan preparado, sin métricas inventadas. No ejecutar hasta que el clúster esté estable y exista evidencia de recuperación/backups.

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

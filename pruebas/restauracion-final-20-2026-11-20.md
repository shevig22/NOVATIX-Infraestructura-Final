# Restauración definitiva de 20 réplicas después de JMeter — 20/11/2026

**Fuente:** salida de terminal de `servidorUbuntu2` aportada por el equipo tras finalizar el escenario de 10 instancias. La restauración se realizó con `docker service update --replicas 4 --replicas-max-per-node 2`, **uno por uno** para Usuarios, Equipos, Partidos, Apuestas y Dinero.

| Servicio | Swarm | Ubuntu1 | Ubuntu2 | GET vía HAProxy |
|---|---|---:|---:|---|
| usuarios | 4/4 | 2 | 2 | HTTP 200 |
| equipos | 4/4 | 2 | 2 | HTTP 200 |
| partidos | 4/4 | 2 | 2 | HTTP 200 |
| apuestas | 4/4 | 2 | 2 | HTTP 200 |
| dinero | 4/4 | 2 | 2 | HTTP 200 |
| **Total API** | **20/20** | **10** | **10** | **5 rutas HTTP 200** |

- Las cinco MySQL siguieron **1/1** y HAProxy siguió **1/1**.
- Para cada API, Docker reportó `Service converged` y `4/4`; la primera comprobación HTTP respondió 200 y verificó distribución `U1=2 U2=2`.
- Mensajes finales: `TOTAL_UBUNTU1=10`, `TOTAL_UBUNTU2=10`, `NOVATIX=20_INSTANCIAS_RESTAURADAS`, `RESULTADO=CORRECTO`, `FASE=COMPLETADA`.
- No se reiniciaron nodos ni se modificaron bases de datos.
- El respaldo histórico de configuración previo al experimento permanece registrado en `/vagrant/novatix_estado_prepruebas_20.txt`; el archivo es local al laboratorio.

**Estado actual confirmado por la última salida:** escenario definitivo de **20 instancias restaurado**. La arquitectura de **10 instancias** fue **temporal** y solo se utilizó para la comparación de estrés; no representa el estado final.

**Alcance:** este diagnóstico confirma el escalado y la respuesta inmediata HTTP tras restaurar. No equivale por sí solo a una nueva prueba de estrés ni a demostrar tolerancia ante fallas de nodo.

[Análisis de JMeter](comparativa-jmeter-10-vs-20-2026-11-20.md).

# NOVATIX — Prueba comparativa de escalabilidad de Equipos (1 frente a 2 réplicas)

**Fuente:** salida de terminal aportada por el equipo, ejecutada el 20/11/2026 en `vagrant@servidorUbuntu2`. Los tres JSON brutos aún no se han adjuntado ni publicado; estos valores se transcriben de la consola, sin sustitución de la evidencia original.

## Configuración

- Cliente: Ubuntu2 (misma VM que HAProxy); `GET http://192.168.100.3:8080/api/equipos/1`.
- Servicio: `novatix_stack_equipos`, límite `MaxReplicas=1` por nodo, despliegue inicial 2/2 (Ubuntu1 y Ubuntu2).
- Tres escenarios de concurrencia: 1, 10 y 25; **120 peticiones por escenario y por configuración**, por tanto 720 solicitudes en total.
- Secuencia: 2/2 → **1/1** (solo `equipos2`) → medición → restauración **2/2** → medición.
- Los demás servicios no se escalaron; ni bases MySQL ni nodos fueron reiniciados.

## Resultados de los dos escenarios de réplicas

| Concurrencia | RPS (1 réplica) | RPS (2 réplicas) | Incremento RPS | Media ms (1) | Media ms (2) | p95 ms (1) | p95 ms (2) | HTTP 200 |
|---:|---:|---:|---:|---:|---:|---:|---:|---|
| 1 | 139,07 | 173,78 | +24,96 % | 7,03 | 5,61 | 8,78 | 7,41 | 120/120 + 120/120 |
| 10 | 304,29 | 496,65 | +63,22 % | 31,22 | 18,04 | 52,22 | 39,23 | 120/120 + 120/120 |
| 25 | 394,61 | 527,75 | +33,74 % | 49,04 | 36,92 | 97,77 | 56,95 | 120/120 + 120/120 |
| **Total** | — | — | — | — | — | — | — | **720/720** |

- Configuración **1 réplica**: `equipos2` respondió las 120 peticiones de cada escenario (360 de 360 HTTP 200, cero fallos).
- Configuración **2 réplicas**: `equipos1` atendió 60 y `equipos2` 60 en cada escenario (180/180 en total, 360 de 360 HTTP 200, cero fallos).
- **Restauración** confirmada por el script: `RESTAURACION=CORRECTA_2/2` y `ESTADO_FINAL=2/2_HTTP200`.
- Los incrementos del throughput entre 1 y 2 réplicas fueron aproximadamente **25,0 %, 63,2 % y 33,7 %**, respectivamente.
- Se observó reducción en latencias medias y p95 en los tres escenarios comparados, pero los resultados no garantizan el mismo comportamiento con cargas o infraestructura distintas.

## Alcance y límites

1. Esta prueba **demuestra 1 vs 2 réplicas en total**, no una configuración de 20 instancias ni dos réplicas por nodo.
2. Son resultados de una sola corrida por escenario y con orden fijo 1→2; pueden intervenir efectos de caché y el hecho de que el cliente comparte VM con HAProxy.
3. Se verificó el balanceo 50/50 de dos réplicas, **no cuatro**.
4. Los mensajes `DOCKER_SWARM=NO_MODIFICADO` pertenecen al **subprograma de carga GET**; el ensayo de escalabilidad **sí modificó temporalmente** las réplicas del servicio Equipos y las restauró.
5. No se hizo prueba formal de estrés hasta saturación ni recuperación ante caída física de un nodo.

## Archivos de evidencia generados en el equipo

- `/vagrant/novatix_1replica_20261120_031703.json`
- `/vagrant/novatix_2replicas_20261120_031703.json`
- `/vagrant/novatix_comparacion_20261120_031703.json`

Estos archivos deben agregarse al repositorio después de revisar sus contenidos. No afirmar que ya están alojados en GitHub.

Ver también [la primera prueba de 360 solicitudes con dos réplicas](resultados-carga-2026-11-20.md).

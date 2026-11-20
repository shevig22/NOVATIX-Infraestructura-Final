# NOVATIX — Primera prueba HTTP de carga y balanceo

**Fecha (archivo de resultados del usuario):** 20/11/2026, nombre `novatix_carga_20261120_030835.json`. Los valores que siguen proceden de la **salida de terminal aportada por el equipo**; el JSON original aún no se ha adjuntado a la conversación ni subido a GitHub.

## Entorno y método

- Cliente: `servidorUbuntu2`, la misma VM que aloja HAProxy.
- URL: `GET http://192.168.100.3:8080/api/equipos/1`.
- Aplicación: servicio `novatix_stack_equipos`, dos réplicas (`equipos1`, `equipos2`), distribuidas con HAProxy `roundrobin`.
- Herramienta: Python 3, [`pruebas/carga_segura.py`](carga_segura.py), HTTP GET de solo lectura.
- Tres escenarios separados, cada uno de 120 peticiones, con concurrencias 1, 10 y 25.
- El experimento **no modifica Swarm** ni demuestra todavía capacidad con 1 vs 2 réplicas.

## Resultados reportados

| Concurrencia | Solicitudes | HTTP 200 | Errores de red | No-200 | RPS | Latencia media (ms) | p95 (ms) | `equipos1` | `equipos2` |
|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| 1 | 120 | 120 | 0 | 0 | 152,86 | 6,39 | 8,50 | 60 | 60 |
| 10 | 120 | 120 | 0 | 0 | 379,70 | 23,53 | 95,77 | 60 | 60 |
| 25 | 120 | 120 | 0 | 0 | 594,33 | 32,27 | 52,84 | 60 | 60 |
| **Total** | **360** | **360** | **0** | **0** | — | — | — | **180** | **180** |

### Hallazgos

1. **100 % HTTP 200** en estas 360 solicitudes, sin fallas de red.
2. **Distribución 50/50** entre las dos réplicas para cada carga; esto es evidencia de balanceo efectivo para el endpoint y los intervalos probados.
3. El **throughput aumentó** de 152,86 a 594,33 solicitudes por segundo cuando la concurrencia aumentó de 1 a 25. No se puede atribuir este incremento únicamente al número de réplicas porque la cantidad de réplicas fue constante.
4. El p95 con concurrencia 10 (95,77 ms) resultó **mayor** que con 25 (52,84 ms). Una sola corrida por escenario no permite explicar esta variación; se recomiendan repeticiones y dispersión estadística.
5. Como cliente y HAProxy están en Ubuntu2, las cifras no representan necesariamente la latencia de un usuario externo. Se trata de un endpoint individual de lectura; no representa pruebas de carga de las cinco APIs.

## Evidencias y pendientes

- Registro publicado: salida de terminal suministrada por el equipo durante la ejecución.
- **Archivo JSON original aún por adjuntar y subir:** `/vagrant/novatix_carga_20261120_030835.json`.
- Ejecutar la prueba al menos 3 veces por escenario para cuantificar variación.
- Comparación **1 vs 2 réplicas** de Equipos, con prechequeo y restauración garantizada; solo después de confirmar estado de salud y no tener operaciones concurrentes.
- Otras APIs, estrés, disponibilidad y recuperación ante fallos permanecen pendientes.

## Comando usado (sin modificar contenedores)

```bash
python3 pruebas/carga_segura.py --concurrencias 1,10,25 --solicitudes 120 --salida /vagrant/novatix_carga_20261120_030835.json
```

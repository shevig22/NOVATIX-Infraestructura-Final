# Estado de validación y pendientes — 19/11/2026

| Verificación | Evidencia observada | Estado |
|---|---|---|
| Swarm | 3 nodos `Ready` | Verificado |
| Microservicios | 10/10, uno por nodo y microservicio | Verificado |
| MySQL | 5/5 en Ubuntu3; verificaciones SQL previas | Verificado |
| HAProxy | 10 backends `UP`, 50/50 HTTP 200, 5/5 balanceados | Verificado |
| Spark Master y Workers | 1 Master + 2 Workers activos | Verificado |
| Spark V2 | Job `Complete`, 11/11 análisis, 2 ejecutores observados | Verificado |
| Dashboard V2 8090 | Servicio 1/1; rutas verificadas | Verificado |
| Retiro de dashboard duplicado 8093 | La auditoría final muestra únicamente `novatix_dashboard` | Verificado |
| Carga, latencia, escalabilidad y estrés | No hay mediciones comparativas reproducibles registradas aquí | Pendiente |
| Reinicio y persistencia de red | No se realizó prueba final tras reinicio | Pendiente |
| Informe IEEE y presentación | Entregables requeridos por profesor | Pendiente |
| Reproducibilidad desde GitHub | Código de cinco APIs, Spark V2, dashboard, HAProxy y diagramas; Vagrantfile publicado, inventario Swarm y plantilla no validada, cinco esquemas MySQL vacíos; siguen pendientes instalación limpia y datos de prueba | Parcial |

## Spark V2 — resultados observados

- 500 usuarios en CSV, 3.277 equipos, 88.958 partidos, 14.770 apuestas y 22.819 movimientos.
- 25 equipos top, 40 ligas, tres desenlaces, cuatro tipos de movimientos.
- 120 períodos mensuales para apuestas, transacciones y registros de usuarios.
- Fecha de ejecución: `2026-11-19T23:23:43.714586+00:00`.
- Reporte basado en CSV sintéticos, no es consulta SQL en tiempo real.

## Entrega académica

El enunciado requiere: selección/justificación del dataset, comparación de soluciones, diagramas, implementación, pruebas de funcionamiento, escalabilidad y desempeño, informe IEEE de hasta 10 páginas, diapositivas y repositorio reproducible.

No fabricar métricas de desempeño que todavía no se hayan medido. Explicar que el dataset usado es sintético y justificar su relación con el objetivo del proyecto.

## Siguiente importación a GitHub

1. Vagrantfile efectivo publicado. Recuperar los scripts de instalación del software por nodo.
2. Inventario sanitizado de 17 servicios publicado; validar el manifiesto de Docker Swarm en entorno aislado.
3. Cinco esquemas MySQL publicados; recuperar o regenerar datos de ejemplo sin datos sensibles.
4. Añadir evidencias reproducibles de carga, latencia y escalabilidad.
5. Finalizar informe IEEE, presentación y guía paso a paso.

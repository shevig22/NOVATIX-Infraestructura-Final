# Estado de validación y pendientes — 20/11/2026

| Verificación | Evidencia observada | Estado |
|---|---|---|
| Swarm | 3 nodos `Ready` | Verificado |
| Microservicios | **20/20**, cuatro réplicas por API, dos por nodo; 10 en Ubuntu1 y 10 en Ubuntu2 | Verificado |
| MySQL | 5/5 en Ubuntu3; verificaciones SQL previas | Verificado |
| HAProxy | Docker Config V4 activa, **20 slots de backend UP** (4 por API); 80 HTTP 200 por API y distribución 20/20/20/20 | Verificado |
| Spark Master y Workers | 1 Master + 2 Workers activos | Verificado |
| Spark V2 | Job `Complete`, 11/11 análisis, 2 ejecutores observados | Verificado |
| Dashboard V2 8090 | Servicio 1/1; rutas verificadas | Verificado |
| Retiro de dashboard duplicado 8093 | La auditoría final muestra únicamente `novatix_dashboard` | Verificado |
| Carga y latencia inicial | Primera prueba GET de equipos: 360/360 HTTP 200, 50/50 entre réplicas; RPS 152,86–594,33; p95 8,50–95,77 ms; JSON pendiente | Evidencia textual |
| Escalabilidad de Equipos (1 vs 2) | 720/720 HTTP 200, cero errores, RPS aumentó de 25,0 % a 63,2 % según la concurrencia, servicio restaurado a 2/2 | Verificado por salida textual; JSON pendiente |
| Estrés JMeter 10 vs 20 | Primera comparación exploratoria de dos API: 403,3 vs 550,2 solicitudes/s; latencia media 99 vs 64 ms; ~21 % errores en ambas; observaciones visuales de ralentización anterior con diez | Registrado; requiere JTL y repetición no gráfica |
| Recuperación ante fallos / estrés reproducible | Aún no medida de forma controlada con métricas de intervalos y p95 | Pendiente |
| Arquitectura definitiva 20 instancias | 4/4 por API, máximo 2 por nodo; 10 Ubuntu1 + 10 Ubuntu2; 5 MySQL en Ubuntu3; reducida temporalmente a 10 y **restaurada a 20** tras el ensayo, con cinco API HTTP 200 | **20/20 activo según la última validación** |
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
4. Publicar los JSON brutos de pruebas históricas y medir carga de 4 réplicas; las 20 instancias ya están implementadas y verificadas.
5. Finalizar informe IEEE, presentación y guía paso a paso.

## Comparación JMeter de diez y veinte instancias (evidencia exploratoria)

[Resultados, cronología de errores, observaciones de lentitud y limitaciones metodológicas](../pruebas/comparativa-jmeter-10-vs-20-2026-11-20.md). En el escenario de diez instancias el equipo reportó percepción de errores leves y lentitud antes que con veinte. La evidencia resumida **no determina los tiempos exactos del primer error**; registrar la observación cualitativa sin convertirla en umbral certificado. Es necesario verificar códigos HTTP de fallos y obtener archivos JTL.

## Estado final del laboratorio tras el experimento

Se restauraron las cinco API a **4/4** y dos por nodo, sumando **20 instancias**; los MySQL permanecen 1/1 y HAProxy 1/1. La última salida reporta cinco endpoints HTTP 200 y `NOVATIX=20_INSTANCIAS_RESTAURADAS`. [Acta de restauración](../pruebas/restauracion-final-20-2026-11-20.md). El estado de 10 instancias ya es histórico.

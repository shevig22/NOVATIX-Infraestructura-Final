# NOVATIX — Criterios de cierre y reproducibilidad

Fecha de revisión: 20/11/2026. Alcance: inspección del repositorio **sin acceso a una instalación limpia ni ejecución de servicios activos**.

## Semáforo de cierre

| Control | Estado | Evidencia y condición de aceptación |
|---|---|---|
| Fuentes de cinco microservicios | Documentado | Existen Dockerfile y fuentes; exigir compilación y pruebas de integración desde el clon |
| Cinco CSV Spark | Verificado previamente | Comparar SHA-256, filas, esquema y seis relaciones mediante `python3 pruebas/comprobar-entrega.py` |
| Frontend Apache Ubuntu1 | Copia original publicada | Siete archivos y hashes; falta ensayar VirtualHost transaccional completo en laboratorio limpio |
| Spark V2 | Ejecutado en entorno original | Falta repetir Master + 2 Workers, `spark-submit` y JSON íntegro en VM nueva |
| Dashboard | Imagen portable propuesta | Falta `docker build` y smoke test documentado de nueva imagen |
| Docker Swarm de 3 VM | Arquitectura operó en laboratorio | Falta instalación desde cero mediante instrucciones verificadas, secretos, volumen y rutas |
| MySQL 5/5 | Esquemas sin datos disponibles | Faltan usuarios de aplicación y datos sintéticos transaccionales consistentes importables |
| HAProxy 4/4 para cada API | Balanceo histórico verificado | Falta ensayo limpio end-to-end y conteos por backend |
| Paginación Partidos/Equipos | Código en main | Faltan MySQL real, nueva imagen, despliegue y regresión con datos reales |
| Seguridad fuera de laboratorio | **Bloqueante** | Contraseñas sin hash, permisos/roles de cliente, defaults, CORS y reconciliación de dinero |
| Rendimiento JMeter 10 vs 20 | Parcial | Faltan JMX/JTL; ~21 % de errores impide afirmar capacidad sostenida |
| CI GitHub | Propuesta en esta rama | Se agregó workflow; debe ejecutarse y pasar antes de combinar el PR |
| Informe y presentación final | Sin constancia en auditoría | Agregar si la rúbrica académica los exige |

## Definición de «reproducible»

No basta con que haya un README. Una persona distinta al equipo debe poder:

1. Clonar un commit/tag exacto en un equipo nuevo con recursos documentados.
2. Crear las tres VM, verificar conectividad, instalar dependencias en versiones fijadas y desplegar red Swarm.
3. Crear cinco instancias de MySQL con volúmenes propios, usuarios de mínimo privilegio y cinco esquemas, sin reutilizar datos ni claves reales.
4. Poblar las tablas con datos **sintéticos transaccionales** coherentes; los CSV analíticos publicados **no** sustituyen esa etapa.
5. Construir y publicar las cinco APIs y HAProxy; comprobar 4 réplicas por API y su ubicación entre Ubuntu1 y Ubuntu2.
6. Ejecutar Spark 3.5.9 con Master y dos Workers, generar el informe JSON desde los cinco CSV incluidos y servirlo con la imagen de dashboard reconstruida.
7. Configurar Apache, ejercitar login, rutas, apuestas **simuladas**, panel administrador, paginación, endpoint de Spark y aislamiento de roles.
8. Ejecutar un conjunto de pruebas repetibles y aportar resultados, logs no sensibles, versiones, checksums y evidencia de restauración ante fallo.
9. Documentar la limpieza de recursos del laboratorio sin afectar instalaciones existentes.

Hasta que **los nueve pasos sean ejecutados y evidenciados de principio a fin en un laboratorio nuevo**, el estado correcto es: **reproducibilidad parcial, no certificada**.

## Orden de ejecución sugerido

**P0 — Seguridad funcional:** hashes de password con migración probada; autorización real en backend para operaciones administrativas y dashboard; roles no controlables por el cliente; eliminar credenciales por defecto; definir reintentos idempotentes/reconciliación de apuestas y dinero simulado. Ejecutar pruebas de regresión antes de publicar servicios.

**P1 — Despliegue reproducible:** aprovisionamiento VM sin descarga insegura; stack nuevo probado sin reutilizar nombres/volúmenes de producción académica; aprovisionamiento SQL de mínimo privilegio; generador de datos transaccionales; imágenes construibles, healthchecks, dependencias Spark y Apache probadas.

**P1 — Estado del código vs lo instalado:** validar paginación contra MySQL real y desplegar nuevas imágenes de forma gradual con rollback; verificar que frontend Apache y servicios Swarm sirven el mismo commit publicado. No afirmar que cambiar GitHub cambia lo ya desplegado.

**P2 — Entrega científica:** conservar JMX y JTL (eliminar información privada), diagnosticar tasa de error, repetir pruebas de carga; anexar informe y presentación académicos si corresponde.

## Comprobación automática desde un clon

```bash
python3 pruebas/comprobar-entrega.py
```

El workflow `.github/workflows/validar-repositorio.yml` también ejecuta estos controles en push, PR y manualmente. Estas son **pruebas estáticas** y de integridad de material, no pruebas de despliegue o seguridad.

## Seguridad de operación

- **NO** ejecutar la plantilla `docker-swarm/stack.novatix.template.yml` directamente sobre el clúster activo.
- **NO** subir secretos, tokens de Swarm, respaldos, SQL con datos, información personal o dumps.
- Validar cambios en una VM/Swarm independiente y tener rollback antes de tocar las 20 instancias API.
- No publicar el laboratorio por Internet ni interpretar la comprobación local de rol del frontend como autorización.
- No hacer migración de contraseñas en caliente sin estrategia de compatibilidad, backups y pruebas.

## Evidencias que faltan para declarar cierre

Se requieren logs de instalación limpia, SHA del commit, versiones de Docker/Ubuntu/Spark/MySQL, resultados de `docker node ls`, `docker service ls`, balanceo de 4 réplicas por servicio, tablas y usuarios SQL mínimos, `spark-submit` exitoso con informe JSON, `docker build` y respuestas HTTP del dashboard, flujos completos del frontend y JMX/JTL sin datos privados.

**Importante:** este documento y el workflow cierran vacíos de organización y validación estática en GitHub; no reemplazan evidencias de esas pruebas reales.

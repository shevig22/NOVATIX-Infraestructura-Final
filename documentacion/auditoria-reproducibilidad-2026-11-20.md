# Auditoría profunda de NOVATIX en GitHub — 20/11/2026

**Repositorio:** [shevig22/NOVATIX-Infraestructura-Final](https://github.com/shevig22/NOVATIX-Infraestructura-Final). **Método:** inventario recursivo de `main`, lectura de código, manifiestos, esquemas, pruebas y documentación; comparación de los objetos Git de los cinco CSV subidos con copias originales disponibles en el entorno de trabajo y sus SHA-256; examen de relaciones de los CSV mediante Python. **No** se hizo un `vagrant up`, `docker stack deploy`, prueba de carga en vivo o `spark-submit` con un clúster nuevo.

## Actualización posterior a esta auditoría (20/11/2026)

**Se conservan los hallazgos históricos siguientes para trazabilidad.** Tras la auditoría se recibió un respaldo de siete archivos del frontend de `servidorUbuntu1` y se publicaron íntegramente en [`frontend/`](../frontend/README.md). Los SHA de objeto Git del repositorio coinciden uno a uno con los de la copia aportada y el script [`pruebas/comprobar-entrega.py`](../pruebas/comprobar-entrega.py) incorpora sus SHA-256. Además se publicó una configuración de **ejemplo** del proxy Spark y un **VirtualHost MODELO** para laboratorio nuevo, todavía sin ensayar en instalación limpia. Por tanto, el estado «sin frontend publicado» descrito más abajo ya **no** refleja el estado actual del repositorio.

**Sigue pendiente:** la fuente de paginación de Partidos y Equipos está en un commit local de Ubuntu2 (`a2dbe75`) que no se pudo subir por HTTPS (403). Se generó un parche de 43 KB, pero **no está adjunto en esta conversación**. Esas modificaciones no aparecen todavía en `main`. Persisten las limitaciones de seguridad, datos MySQL e instalación Swarm/Spark integral sin validar. No se desplegó ni se modificó ningún servicio al publicar estos archivos.

## Dictamen

| Alcance | Estado | Evidencia o impedimento |
|---|---|---|
| Repositorio con cinco CSV exactos | **Confirmado** | 5/5 hashes SHA-256, filas y cabeceras iguales al manifiesto |
| Coherencia de claves entre CSV | **Confirmada en seis relaciones** | Sin referencias huérfanas (Empate=0 tratado como categoría especial) ni IDs duplicados |
| Código PySpark sobre CSV | **Documentado, ejecutado en el laboratorio original** | `spark/analisis_novatix_v2.py`, resultados de 11 conjuntos, JSON previo |
| Repetir Spark desde un clúster nuevo | **Parcialmente reproducible** | Datos y script sí; instalación automatizada de Master/Workers + montajes y ensayo nuevo no |
| Construcción de microservicios desde sus fuentes | **Fuente disponible; no validada ahora** | Cinco Dockerfile/lockfiles; exposición de puertos inconsistentes, imágenes fijadas por digest en plantilla |
| Instalación completa Docker Swarm desde cero | **No reproducida** | Vagrant solo crea VM; plantilla Swarm marcada no desplegar; secretos, usuarios, volúmenes, MySQL y Spark sin aprovisionamiento integral |
| Replicar los datos transaccionales MySQL | **No** | Los CSV Spark no son volcados SQL íntegros y usuarios.csv omite campos obligatorios |
| Generar otra vez los mismos CSV a partir de Kaggle | **No** | Falta script histórico, semillas y reglas exactas |
| Repetir métricas de JMeter | **No completamente** | No hay plan JMX ni JTL bruto de ambas corridas; solo tablas, capturas y actas |
| Dashboard portable por Dockerfile | **Código presente; no validado en VM** | Dockerfile sin evidencia de build/smoke test exitoso; imagen histórica sigue en servicio |
| Reproducción de informe/presentación desde GitHub | **No** | No hay entregables PDF/Word/PPTX incorporados al árbol inspeccionado |

## Datos: controles realmente ejecutados

| Archivo | Filas | SHA-256 esperado y comprobado |
|---|---:|---|
| `datos/usuarios.csv` | 500 | `7361d528bc36ab79cedc73907a498979fb9635946c18cd8f9a1c7b2033bf0432` |
| `datos/equipos.csv` | 3.277 | `8299902074663ce376951b39a9aa481ae861f0faad1e04f2d6a073725be22b6e` |
| `datos/partidos.csv` | 88.958 | `fa541b4d9df8ea888f154af441c8447191193c1f90d8b4669eee418d05dd6673` |
| `datos/apuestas.csv` | 14.770 | `b5830923d2cb4d69b3d8e1c05a2c9bc455f781a1d7451f873b223a60c930b0f2` |
| `datos/dinero.csv` | 22.819 | `82c25c75c4e5f17aa4025d7571ae7f793927c96943ac56201222f5695523424a` |

Comprobamos **130.324 filas**, ningún ID duplicado y **cero referencias huérfanas** en `partidos.id_equipo_local`, `partidos.id_equipo_visitante`, `apuestas.user_id`, `apuestas.part_id`, `apuestas.equipo_id` (interpretando `0` como «Empate»), `dinero.id_usuario`. Exactamente **5.556 apuestas** usan Empate. El tipo `premio` aparece 5.986 veces en `dinero.csv`; esto no implica que el esquema transaccional lo procese igual.

Las cinco copias originales de GitHub estaban **en la raíz**; las reubicamos, **sin modificar bytes ni hashes**, bajo `datos/`. Se puede ejecutar [verificar_csv.py](../datos/verificar_csv.py) para repetir los controles en un clon sin Docker.

## Hallazgos que necesitan trabajo — orden de prioridad

### P0 · Seguridad y consistencia de la aplicación (no exponer a Internet)

1. `microservicios/usuarios/src/Models/Usuariosmodels.js` inserta el valor `password` **sin hashing**. Las notas del código reconocen comparación de texto plano en el controlador. Antes de producción habría que migrar a Argon2/bcrypt con pruebas, no solo cambiar una línea.
2. Los modelos de las API tienen fallbacks inseguros `DB_USER=root`, `DB_PASSWORD=mysql`; el código de Usuarios habilita CORS `*` y algunas rutas de datos operacionales carecen de controles adecuados. Mantener únicamente en red cerrada y no publicar secretos ni puertos SQL.
3. `microservicios/apuestas/src/controllers/apuestasController.js` intenta reembolsar después de un fallo al guardar, pero responde «el dinero fue devuelto» **incluso si el reembolso también falló**. No se ha probado el rollback distribuido extremo a extremo. Requiere reconciliación/idempotencia y pruebas antes de mover dinero, aunque sea simulado.
4. El CSV de dinero usa la categoría `premio`, mientras que `DineroModels.registrarTransaccion` reconoce `ganancia` (no `premio`) como ingreso. No garantiza por sí solo un bug de despliegue —el CSV y las API tienen procesos de generación distintos—, pero **sí una incompatibilidad semántica a revisar** antes de importar o reutilizar esa categoría.

### P1 · Reconstrucción de clúster

1. `infraestructura/Vagrantfile` tiene `vm.box_download_insecure=true` y depende de `eth1` y una box de Vagrant disponible. No instala Docker/Spark.
2. `docker-swarm/stack.novatix.template.yml` contempla once servicios transaccionales y **no** los servicios Spark ni el dashboard; depende de variables, volúmenes externos y config por archivo. Su propio encabezado dice **NO DESPLEGAR EN EL CLÚSTER ACTIVO**. Una plantilla con dependencias no probadas **no** equivale a despliegue reproducible.
3. Faltan importaciones de MySQL documentadas/probadas para cinco bases y creación de usuario SQL no root. Los esquemas `mysql/esquemas/*.sql` existen, pero los cinco CSV no permiten llenar la tabla de usuarios con campos NOT NULL (`nombre,email,usuario,password`).
4. Los Dockerfiles recuperados de cuatro APIs muestran `EXPOSE` distinto del puerto real de Node.js. El repositorio conserva ese defecto como trazabilidad; arreglarlo en una rama separada con pruebas y reconstrucción.
5. `dashboard/Dockerfile` portable y `probar-contenedor-aislado.sh` son recientes, pero no hay un log comprobado de `docker build` + HTTP 200 de la nueva imagen. El dashboard actual sigue utilizando una imagen local histórica.

### P2 · Metodología y claridad

1. Los ensayos de Equipos 1 vs 2 réplicas tuvieron **720/720 HTTP 200** y mejoras de +25 % a +63,2 % de throughput según concurrencia; esa es la evidencia de escalabilidad más sólida.
2. JMeter 10 vs 20 instancias mostró **403,3 vs 550,2 RPS** (incluye errores), latencia media 99 vs 64 ms y **~21 % de errores** al final en ambos. Sin códigos de error ni JTL no puede atribuirse el fallo al servidor ni llamarse capacidad sostenible.
3. Faltan artefactos `.jmx`/`.jtl` de pruebas, JSON completo Spark y reporte de construcción de contenedores. `datos/resultados-resumen-v2.json` es **solo un resumen**, no el JSON íntegro del dashboard.
4. El generador de datos y la transformación de Kaggle no se han publicado. Los CSV públicos bastan para repetir la **analítica**, pero no la creación exacta de los datos.
5. El código versionado del dashboard etiqueta `equipo_id=0` como «Empate», pero no se verificó que el contenedor 8090 en ejecución se haya actualizado. Evitar afirmar que el frontend activo ya lo presenta.
6. Varias pruebas y documentos son históricas (2, 10 y 20 réplicas, fechas diferentes). Se simplificó el README para separar el **estado final validado** de los experimentos temporales.

## ¿Qué mantener, simplificar y evitar?

| Archivo o conjunto | Decisión | Razón |
|---|---|---|
| `datos/*.csv` y manifiesto | **Mantener** | Entrada real Spark + hashes |
| `datos/verificar_csv.py` | **Agregar** | Prueba repetible de integridad |
| `spark/analisis_novatix_v2.py` | **Mantener** | Procesamiento real |
| `dashboard/`, `microservicios/`, `mysql/esquemas/` | **Mantener** | Código, interfaz y estructura del proyecto |
| `diagramas/*.drawio` | **Mantener** | Diagramas editables originales del equipo |
| `docker-swarm/inventario-activo-sanitizado.json` | **Mantener, etiquetado como histórico** | Evidencia real pero no estado actual |
| `docker-swarm/stack.novatix.template.yml` | **Mantener con advertencia** | Base para futura instalación, todavía no deploy probado |
| `pruebas/*.md` y scripts de auditoría | **Mantener** | Trazabilidad, aunque haya evidencia exploratoria |
| `dashboard/Dockerfile.portable` | **Opcional** | Copia idéntica de `dashboard/Dockerfile`; se puede eliminar después de validar la imagen principal |
| Informes y diapositivas | **Pendiente de subir** | Necesarios para entrega académica, no afectan el clúster |

## Próximos pasos para llamar el proyecto «reproducible»

1. En **laboratorio nuevo**, validar `vagrant up`, Docker/Swarm, red overlay y secretos de manera segura. Aprovisionar MySQL, crear usuarios y datos de ensayo; registrar resultados de cada paso.
2. Desplegar y probar las cinco API desde sus fuentes, HAProxy y el balanceo 4/4; luego Master y Workers Spark y dashboard desde Dockerfile portable.
3. Montar `datos/` en `/datos`, ejecutar Spark, verificar el reporte JSON generado y el endpoint `/api/spark/v2`.
4. Recuperar y publicar el generador/transfomador original de Kaggle, con semillas y licencia/procedencia. Guardar evidencia JMX/JTL (sin datos privados) y repetir JMeter no gráfico para caracterizar errores.
5. Incluir informe IEEE y presentación final en un directorio de entrega, junto a instrucciones para reproducir los experimentos.

**Conclusión:** el repositorio **tiene sentido técnico y coherencia en los cinco CSV**, y la arquitectura de veinte instancias fue validada históricamente. Con los CSV y PySpark se ha cerrado la principal dependencia de datos para repetir el análisis en un entorno Spark configurado. Sin embargo, **no existe aún una reconstrucción automatizada y ensayada desde cero**. Este informe es una auditoría documental y estática; no certifica el clúster desplegado ni la seguridad de producción.

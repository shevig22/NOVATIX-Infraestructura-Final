# Procedencia de datos de NOVATIX

## Fuente abierta y preparación

El equipo identificó como fuente de partida el conjunto público **[Football Data from Transfermarkt](https://www.kaggle.com/datasets/davidcariboo/player-scores)** publicado por `davidcariboo` en Kaggle. Según el equipo, dicha información futbolística sirvió de base para preparar parte del material que consume NOVATIX. Se generaron además datos complementarios para adecuarlos al dominio de las cinco API (usuarios, equipos, partidos, apuestas y dinero).

**Aclaración de alcance:** en la ejecución Spark V2 verificada, el programa no descarga directamente Kaggle ni consulta MySQL. Lee los cinco CSV preparados en `/datos` y escribe un informe JSON en `/resultados/reporte_novatix_v2.json`. Por tanto, un registro derivado de datos reales no debe presentarse automáticamente como observación original sin comprobar la transformación. En particular, apuestas, saldos y pagos teóricos no son transacciones reales.

El equipo informó que consultó con el docente y que este aceptó el uso de información generada o transformada a partir de un dataset real. Esta nota documenta lo comunicado por el equipo y no sustituye una evidencia de la autorización docente.

## Archivos usados por Spark V2

| CSV | Cantidad observada en el trabajo completado | Propósito |
|---|---:|---|
| `usuarios.csv` | 500 | Evolución mensual de registros |
| `equipos.csv` | 3.277 | Liga, país y unión con otros datos |
| `partidos.csv` | 88.958 | Goles, desenlaces, cuotas y temporadas |
| `apuestas.csv` | 14.770 | Volumen, cuota y resultado simulado |
| `dinero.csv` | 22.819 | Movimientos y montos simulados |

**Total leído:** 130.324 registros en esos cinco CSV (no equivale a los recuentos de las bases MySQL). El módulo `spark/analisis_novatix_v2.py` genera once bloques analíticos y usa dos ejecutores observados según el registro de ejecución anterior.

## Reproducción pendiente

Para reconstruir el dataset aún debe publicarse alguno de estos mecanismos:

1. Fuente y versión descargada de Kaggle (archivos y fecha/versionado), con licencia/condiciones de redistribución revisadas.
2. Script de limpieza, normalización y mapeo desde los CSV de origen a `equipos.csv` y `partidos.csv`, **si existe y se conserva**.
3. Script y semilla de generación de usuarios/apuestas/dinero, **si se utilizaron**.
4. **Completado:** inventario de nombres de columna, cantidades y SHA-256 de los cinco CSV en [`datos/manifest-csv-v2.json`](../datos/manifest-csv-v2.json); faltan los contenidos/generadores.
5. Solo cuando proceda según la licencia, archivos de entrada/salida sin credenciales ni datos personales.

No inventar una transformación histórica que todavía no se haya podido recuperar.

## Verificación adicional del archivo íntegro

La revisión del paquete de seis archivos `novatix_datos_spark_v2_20261120_025952.tar.gz` confirmó los cinco hashes y el reporte Spark V2; el dataset de origen declara licencia CC0 en su repositorio oficial. Se documentaron resultados y aclaración del marcador de empates en [resultados Spark V2](resultados-spark-v2.md). La transformación original desde Kaggle sigue sin código reproducible; los datos ya preparados permiten repetir la analítica si se incorporan al repositorio.

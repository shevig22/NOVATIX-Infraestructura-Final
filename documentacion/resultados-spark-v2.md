# Resultados comprobados de Spark V2 (20/11/2026)

El archivo `novatix_datos_spark_v2_20261120_025952.tar.gz` entregado por el equipo fue abierto y verificado. La huella SHA-256 del paquete es `cd7856d351e74c87cf6510e4a24b03db5dec3c00d5a2775c2b50a6af14c5687c`. Contiene los cinco CSV originales y el reporte `reporte_novatix_v2.json`.

**El código Spark V2 efectivamente produjo el reporte a partir de esos cinco CSV; esto no significa que todos los datos provengan directamente de Kaggle.** Los CSV son una adaptación combinada con datos complementarios simulados.

## Tamaño del conjunto verificado

| Archivo | Registros | Intervalo temporal observado |
|---|---:|---|
| `usuarios.csv` | 500 | 2012-02-14 a 2025-05-07 |
| `equipos.csv` | 3.277 | Sin fecha |
| `partidos.csv` | 88.958 | 2006-06-09 a 2026-07-06 |
| `apuestas.csv` | 14.770 | 2012-05-31 a 2026-06-23 |
| `dinero.csv` | 22.819 | 2012-02-21 a 2026-07-04 |
| **Total** | **130.324** | |

## Análisis cuantitativo extraído de `reporte_novatix_v2.json`

| Resultado | Conteo | Porcentaje |
|---|---:|---:|
| Victoria local en partidos finalizados | 40.081 | 45,06 % |
| Victoria visitante | 29.575 | 33,25 % |
| Empates | 19.302 | 21,70 % |
| Apuestas simuladas ganadas | 5.986 | 40,53 % |
| Apuestas simuladas perdidas | 8.784 | 59,47 % |

- **Total de apuestas simuladas:** 14.770, valor apostado 20.294.639,57 unidades simuladas. Pago teórico calculado por cuotas: 21.655.233,46 unidades simuladas; **no representa desembolsos reales ni ganancias reales**.
- Liga/competición con más partidos entre las 40 agrupaciones del reporte: `INT` / «Internacional», 12.040 partidos, promedio 3,58 goles.
- **Motor:** Spark 3.5.9. **Distribución observada:** dos identificadores de ejecutor presentes en `ejecutores_observados`. El reporte **no demuestra en qué nodos físicos** se ejecutaron.

## Interpretación correcta de las 5.556 apuestas con `equipo_id=0`

La primera agrupación de `top_equipos` aparece con `eq_id: null`. La auditoría de los CSV determinó que **las 5.556 apuestas** (37,62 % del total) usan exactamente `equipo_id=0`. El identificador 0 codifica la **selección «Empate»**, y no es un ID faltante de un equipo: todas sus cuotas coinciden con `cuota_empate` en el partido asociado y la condición `ganada/perdida` concuerda con el marcador.

**Implicación:** la unión de `apuestas` con `equipos` de Spark usa `left join`, por lo que este caso aparece como categoría nula. En el dashboard **debería** etiquetarse «Empate». No se ha editado el reporte ni la aplicación en ejecución; no presentar ese grupo como un equipo real.

## Fuente pública y advertencias

- [Football Data from Transfermarkt](https://www.kaggle.com/datasets/davidcariboo/player-scores), `davidcariboo`. El proyecto origen declara licencia **CC0** en sus metadatos; los CSV de NOVATIX contienen transformaciones y datos generados por el equipo.
- No se encontraron columnas directas de email, teléfono, contraseña o documento en los cinco CSV. Existen IDs de usuarios simulados y datos monetarios de la aplicación; no se presume que los hashes anonimizan datos.
- El paquete completo de 3,6 MB aún **no está subido a GitHub** desde el conector; el manifiesto y este resumen sí.
- Esta evidencia analítica **no sustituye las pruebas de latencia, concurrencia, escalado y recuperación** solicitadas por el profesor.

## Reproducir

Los hashes de los cinco CSV están en [`datos/manifest-csv-v2.json`](../datos/manifest-csv-v2.json). Ejecutar `spark/analisis_novatix_v2.py` en el entorno Spark V2 con los cinco CSV en `/datos`; el resultado quedará en `/resultados/reporte_novatix_v2.json`. El programa no consulta MySQL ni descarga Kaggle durante el procesamiento.

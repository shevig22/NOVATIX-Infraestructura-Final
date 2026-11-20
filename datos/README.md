# Datos de entrada Spark V2 — inventario comprobado

Esta carpeta documenta los **cinco archivos CSV que Spark V2 procesó realmente**. El manifiesto `manifest-csv-v2.json` contiene los nombres de columnas, las filas y los hashes SHA-256 emitidos por la inspección de solo lectura en `servidorUbuntu2`.

Los CSV **aún no se publican** aquí: su contenido y autorización de redistribución están pendientes de revisión. El equipo reporta un conjunto futbolístico de Kaggle como fuente de partida y la adición de datos simulados. El reporte Spark actual usa archivos ya preparados y no consulta Kaggle ni MySQL en vivo.

## Inventario observado

| Archivo | Filas sin cabecera | Columnas |
|---|---:|---|
| `usuarios.csv` | 500 | `id`, `fecha_registro`, `estado`, `rol` |
| `equipos.csv` | 3.277 | `id`, `nombre`, `pais`, `liga`, `escudo`, `estado` |
| `partidos.csv` | 88.958 | `id`, `id_equipo_local`, `id_equipo_visitante`, `equipo_local_nombre`, `equipo_visitante_nombre`, `escudo_local`, `escudo_visitante`, `fecha_partido`, `cuota_local`, `cuota_empate`, `cuota_visitante`, `goles_local`, `goles_visitante`, `estado` |
| `apuestas.csv` | 14.770 | `id`, `user_id`, `part_id`, `equipo_id`, `dinero_apostado`, `cuota`, `resultado`, `fecha_apuesta` |
| `dinero.csv` | 22.819 | `id`, `id_usuario`, `saldo_real`, `saldo_congelado`, `saldo_disponible`, `tipo`, `monto`, `saldo_antes`, `saldo_despues`, `fecha_transaccion`, `estado` |
| **Total** | **130.324** | |

Los nombres `user_id` e `id_usuario` son identificadores de aplicación y podrían permitir relacionar registros; la ausencia de columnas llamadas `email` o `password` **no equivale** a una auditoría de privacidad. Algunas rutas de escudos también deben revisarse antes de redistribuir.

## Comprobación de integridad

En Ubuntu2, sin cambiar ningún archivo:

```bash
cd /vagrant/novatix_spark_datos
sha256sum usuarios.csv equipos.csv partidos.csv apuestas.csv dinero.csv
```

Comparar con los valores en `manifest-csv-v2.json`. El reporte JSON generado se encuentra en `/vagrant/novatix_spark_resultados/reporte_novatix_v2.json` y sirve como fuente para el dashboard en el puerto 8090.

## Estado de reproducibilidad

1. **Verificado:** cinco CSV legibles, 130.324 filas, esquema de 43 columnas sumadas; ejecución Spark V2 con 11 bloques analíticos y distribución observada.
2. **Pendiente:** archivos CSV originales o un generador determinista; licencia y autorización de distribución del origen de Kaggle; revisión completa de contenido.
3. **Pendiente:** reconstruir y documentar la transformación de la fuente pública y los datos complementarios. No atribuir el conjunto completo al origen Kaggle si incluye datos simulados.
4. **Pendiente:** confirmar en un entorno nuevo que el pipeline con los mismos hashes reproduce el reporte.

Las tablas MySQL `apuestas` y `dinero` manejan la columna `fecha`, mientras que Spark necesita `fecha_apuesta` y `fecha_transaccion` en CSV: la normalización fue parte de la preparación, pero su implementación histórica aún no ha sido recuperada.


## Paquete completo verificado

Se revisó el contenido del archivo `novatix_datos_spark_v2_20261120_025952.tar.gz` (3.718.237 bytes, SHA-256 `cd7856d351e74c87cf6510e4a24b03db5dec3c00d5a2775c2b50a6af14c5687c`). Contiene los cinco CSV y el reporte JSON V2. Los cinco hashes de CSV coinciden con el manifiesto. La fuente pública Transfermarkt declara CC0 en sus metadatos. La revisión encontró datos futbolísticos y datos transaccionales simulados, sin columnas directas de contraseñas, emails o documentos. La publicación del archivo **aún está pendiente**; el paquete puede cargarse mediante la interfaz web de GitHub a este directorio para reproducir el pipeline. Ver [resultados verificados](../documentacion/resultados-spark-v2.md).

## Herramientas nuevas de preparación

- [`preparar_csv_spark.py`](preparar_csv_spark.py): recibe los **cinco CSV originales** en una carpeta, exige que los encabezados necesarios existan y escribe una carpeta nueva para Spark. En `usuarios.csv` conserva únicamente `id`, `fecha_registro`, `estado` y `rol`; **no arrastra nombres, emails, usuarios ni contraseñas** que puedan existir en archivos de origen. No importa a MySQL y **no reproduce** el generador histórico de cuotas/apuestas.
- [`mapear_apuestas_mysql.py`](mapear_apuestas_mysql.py): traduce el encabezado `fecha_apuesta` del CSV analítico al `fecha` de la tabla relacional `apuestas` y produce **otro CSV**; no ejecuta SQL ni modifica esquemas/volúmenes. Validar tipos, claves y transacciones antes de importarlo en entorno vacío.

Ejemplo (fuera del clúster productivo):

```bash
python3 datos/preparar_csv_spark.py --entrada ./csv_originales --salida ./csv_spark_preparados
python3 datos/mapear_apuestas_mysql.py --entrada ./csv_spark_preparados/apuestas.csv --salida ./apuestas_mysql_importacion.csv
```

**Privacidad:** los CSV de origen pueden contener campos personales o contraseñas en texto claro. No publicar los originales. El archivo para Spark reduce columnas de Usuarios, pero sigue requiriendo revisión antes de redistribución pública, al igual que las rutas de escudos, vínculos entre identificadores y la licencia de las fuentes.

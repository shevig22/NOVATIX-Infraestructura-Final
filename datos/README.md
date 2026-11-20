# Datos de NOVATIX para Apache Spark

## ¿Qué hay en esta carpeta?

En NOVATIX trabajamos con **cinco archivos CSV**, que contienen las filas utilizadas por Apache Spark para producir el dashboard:

| Archivo | Registros | Contenido |
|---|---:|---|
| `usuarios.csv` | 500 | Fecha de registro, estado y rol (copia depurada) |
| `equipos.csv` | 3.277 | Equipos y ligas del fútbol |
| `partidos.csv` | 88.958 | Partidos reales adaptados y cuotas simuladas |
| `apuestas.csv` | 14.770 | Apuestas simuladas |
| `dinero.csv` | 22.819 | Movimientos monetarios simulados |
| **Total** | **130.324** | |

**Estado al 20/11/2026:** los cinco CSV fueron comprobados en el entorno y existe un paquete depurado listo para subir, pero **todavía no están publicados en esta carpeta del repositorio**.

### ¿Qué es `manifest-csv-v2.json`?

Es la **ficha de control** de los CSV, no contiene los datos mismos. Por cada archivo indica:
- Nombre, cantidad de filas y nombres de columnas.
- Hash **SHA-256**, que funciona como huella digital del archivo y permite verificar que los datos no fueron cambiados.

**V2** significa «versión 2» de nuestro pipeline de Spark, no un formato especial. Los archivos CSV son las **entradas**; el archivo JSON que genera Spark es la **salida**.

### Subir los cinco CSV

1. Abrir [la carpeta datos del repositorio](https://github.com/shevig22/NOVATIX-Infraestructura-Final/tree/main/datos).
2. Seleccionar **Add file → Upload files**.
3. Subir **los cinco CSV individuales** de la copia preparada para Spark (no el ZIP comprimido).
4. Confirmar la carga en `main` y revisar que los nombres coincidan con esta tabla.
5. Verificar que `usuarios.csv` tenga solo las columnas `id,fecha_registro,estado,rol`, nunca `nombre,email,usuario,password`.

Se recomienda conservar el manifiesto sin modificar: los archivos preparados fueron verificados con los SHA-256 que ya contiene.

### Dónde están en el laboratorio

- CSV de entrada: `/vagrant/novatix_spark_datos/`.
- JSON generado por Spark: `/vagrant/novatix_spark_resultados/reporte_novatix_v2.json`.
- Programa que procesa los CSV: `spark/analisis_novatix_v2.py`.

Los datos de Apuestas, Usuarios y Dinero son **simulados**. La fuente de partidos/equipos se adaptó desde [Kaggle/Transfermarkt](https://www.kaggle.com/datasets/davidcariboo/player-scores). Los CSV permiten repetir el análisis, pero reconstruir exactamente la simulación desde cero requiere recuperar los scripts históricos.

> **Privacidad:** el `usuarios.csv` original incluye nombres, correos y contraseñas. No publicarlo. Subir únicamente la versión depurada del paquete para Spark. Las rutas de escudos, identificadores y permisos de reutilización deben revisarse antes de otra difusión pública.

---

## Detalle técnico y trazabilidad anteriores


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

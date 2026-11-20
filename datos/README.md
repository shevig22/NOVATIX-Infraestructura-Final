# Datos de entrada para Apache Spark V2

Los **cinco CSV que realmente procesó Spark** están en esta carpeta. **«V2» significa versión 2 del análisis**, no una segunda base de datos.

| Archivo | Filas | Procedencia y propósito |
|---|---:|---|
| [usuarios.csv](usuarios.csv) | 500 | Registros simulados sin datos personales directos; fechas y estados |
| [equipos.csv](equipos.csv) | 3.277 | Equipos/ligas adaptados de datos futbolísticos abiertos |
| [partidos.csv](partidos.csv) | 88.958 | Resultados deportivos adaptados y cuotas simuladas |
| [apuestas.csv](apuestas.csv) | 14.770 | Apuestas simuladas; `equipo_id=0` significa Empate |
| [dinero.csv](dinero.csv) | 22.819 | Movimientos monetarios simulados |
| **Total** | **130.324** | |

## ¿Qué es el manifiesto?

[`manifest-csv-v2.json`](manifest-csv-v2.json) es la **ficha de integridad** de los CSV: guarda nombres, cabeceras, cantidad de filas y un hash SHA-256 por archivo. No contiene registros ni reemplaza los CSV.

La subida de los cinco CSV se verificó por SHA-256 **y por su identificación de objeto en GitHub**, sin diferencias frente a los cinco archivos usados en Spark. El archivo Usuarios incluido es la versión de cuatro columnas `id,fecha_registro,estado,rol` sin contraseñas ni direcciones de correo.

En un clon local con Python 3, ejecutar:

```bash
python3 datos/verificar_csv.py
```

El validador comprueba SHA-256, esquema, cantidad de filas, unicidad de IDs y relaciones entre tablas. Es de **solo lectura**; no importa a MySQL.

## Diferencia fundamental entre Spark y MySQL

- Los CSV contienen **los datos analíticos por lotes**, no una copia íntegra de las cinco bases relacionales.
- El CSV `usuarios.csv` carece intencionalmente de `nombre`, `email`, `usuario` y `password`, necesarios en el esquema MySQL transaccional. **No usarlo directamente para poblar esa tabla.**
- En el CSV de apuestas el campo es `fecha_apuesta`; en el SQL transaccional se llama `fecha`. [`mapear_apuestas_mysql.py`](mapear_apuestas_mysql.py) crea una copia con el encabezado adaptado, pero **no prueba la importación de todas las tablas**.
- El [script de depuración](preparar_csv_spark.py) reduce columnas en una nueva carpeta, pero **no es el script histórico de generación de apuestas y cuotas**.
- Los cinco CSV contienen el resultado final del procesamiento de la fuente deportiva [Transfermarkt/Kaggle](https://www.kaggle.com/datasets/davidcariboo/player-scores) y de la simulación: **la transformación exacta y la semilla del generador original siguen pendientes**.

## Uso de los archivos en la arquitectura

**En el laboratorio original:** entrada Spark `/vagrant/novatix_spark_datos/=` montaje `/datos/`; salida `/vagrant/novatix_spark_resultados/reporte_novatix_v2.json` montada como `/resultados/`.

Para reproducir la analítica en otra instalación Spark, hay que copiar estos cinco CSV a un directorio que el contenedor Spark monte en `/datos`. El programa está en [`spark/analisis_novatix_v2.py`](../spark/analisis_novatix_v2.py); no descarga Kaggle ni importa a MySQL en tiempo real.

**Privacidad:** no publicar los CSV transaccionales originales que contienen contraseñas en texto plano. Aunque estos cinco están depurados en columnas, revisar identificadores, escudos y condiciones de origen antes de su redistribución fuera del ámbito académico.

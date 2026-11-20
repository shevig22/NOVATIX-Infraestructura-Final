#!/usr/bin/env python3
"""NOVATIX Spark V2: analitica sobre CSV de la infraestructura existente.
No consulta ni modifica las cinco bases de datos MySQL.
"""
import json
import os
import socket
from datetime import datetime, timezone
from pathlib import Path

from pyspark.sql import SparkSession, functions as F

DATOS = Path('/datos')
SALIDA = Path('/resultados/reporte_novatix_v2.json')
SCHEMA = {
    'apuestas': {'id', 'equipo_id', 'dinero_apostado', 'cuota', 'resultado', 'fecha_apuesta'},
    'partidos': {'id', 'id_equipo_local', 'goles_local', 'goles_visitante', 'cuota_local', 'cuota_visitante', 'cuota_empate', 'fecha_partido', 'estado'},
    'equipos': {'id', 'nombre', 'pais', 'liga'},
    'dinero': {'id', 'tipo', 'monto', 'fecha_transaccion'},
    'usuarios': {'id', 'fecha_registro'},
}

spark = SparkSession.builder.appName('NOVATIX-Spark-Analytics-V2').getOrCreate()
spark.sparkContext.setLogLevel('WARN')

def filas(df, limite=30):
    return [r.asDict(recursive=True) for r in df.limit(limite).collect()]

def fecha_mes(columna):
    return F.date_format(F.to_date(F.col(columna)), 'yyyy-MM')

def redondeo(c):
    return F.round(c, 2)

def cargar(nombre):
    ruta = DATOS / (nombre + '.csv')
    if not ruta.is_file():
        raise RuntimeError('CSV_FALTANTE=' + nombre)
    df = spark.read.option('header', 'true').option('inferSchema', 'true').csv(str(ruta))
    faltan = SCHEMA[nombre] - set(df.columns)
    if faltan:
        raise RuntimeError('COLUMNAS_FALTANTES=' + nombre + ':' + ','.join(sorted(faltan)))
    return df

try:
    a = cargar('apuestas')
    p = cargar('partidos')
    e = cargar('equipos')
    d = cargar('dinero')
    u = cargar('usuarios')

    # Pago teorico basado en cuota de apuestas ganadas; no equivale a dinero real pagado.
    a = a.withColumn('importe', F.col('dinero_apostado').cast('double')) \
         .withColumn('cuota_n', F.col('cuota').cast('double')) \
         .withColumn('resultado_n', F.lower(F.trim(F.col('resultado')))) \
         .withColumn('pago_teorico', F.when(F.col('resultado_n') == 'ganada',
             F.col('importe') * F.col('cuota_n')).otherwise(F.lit(0.0)))
    a = a.withColumn('balance_teorico', F.col('importe') - F.col('pago_teorico'))
    d = d.withColumn('importe', F.col('monto').cast('double'))
    p = p.withColumn('goles_l', F.col('goles_local').cast('double')) \
         .withColumn('goles_v', F.col('goles_visitante').cast('double')) \
         .withColumn('cuota_l', F.col('cuota_local').cast('double')) \
         .withColumn('cuota_v', F.col('cuota_visitante').cast('double'))
    terminados = p.filter(F.lower(F.trim(F.col('estado'))) == 'finalizado') \
         .withColumn('goles_total', F.col('goles_l') + F.col('goles_v')) \
         .withColumn('desenlace', F.when(F.col('goles_l') > F.col('goles_v'), 'Local')
             .when(F.col('goles_l') < F.col('goles_v'), 'Visitante').otherwise('Empate'))

    eq = e.select(F.col('id').cast('long').alias('eq_id'), 'nombre', 'pais', 'liga')
    aeq = a.join(F.broadcast(eq), F.col('equipo_id').cast('long') == F.col('eq_id'), 'left')
    pliga = terminados.join(F.broadcast(eq), F.col('id_equipo_local').cast('long') == F.col('eq_id'), 'left')

    top_equipos = aeq.groupBy('eq_id', 'nombre', 'pais', 'liga').agg(
        F.count('*').alias('apuestas'),
        redondeo(F.sum('importe')).alias('volumen_apostado'),
        redondeo(F.sum('pago_teorico')).alias('pago_teorico'),
        redondeo(F.sum('balance_teorico')).alias('balance_teorico'),
        redondeo(F.avg('cuota_n')).alias('cuota_promedio'),
    ).orderBy(F.desc('volumen_apostado'))

    ligas = pliga.groupBy('pais', 'liga').agg(
        F.count('*').alias('partidos'),
        redondeo(F.avg('goles_total')).alias('promedio_goles'),
        redondeo(F.avg('cuota_l')).alias('cuota_local_promedio'),
        redondeo(F.avg('cuota_v')).alias('cuota_visitante_promedio'),
        redondeo(F.avg(F.when(F.col('cuota_l') > 0, 100.0 / F.col('cuota_l')))).alias('probabilidad_local_implicita_pct'),
    ).orderBy(F.desc('partidos'))

    apuestas_resultados = a.groupBy('resultado_n').agg(
        F.count('*').alias('apuestas'),
        redondeo(F.sum('importe')).alias('volumen_apostado'),
        redondeo(F.sum('pago_teorico')).alias('pago_teorico'),
    ).orderBy(F.desc('apuestas'))

    apuestas_mensuales = a.withColumn('mes', fecha_mes('fecha_apuesta')) \
        .filter(F.col('mes').isNotNull()).groupBy('mes').agg(
            F.count('*').alias('apuestas'),
            redondeo(F.sum('importe')).alias('volumen_apostado'),
        ).orderBy('mes')

    dinero_tipo = d.groupBy('tipo').agg(
        F.count('*').alias('transacciones'),
        redondeo(F.sum('importe')).alias('monto_total'),
        redondeo(F.avg('importe')).alias('monto_promedio'),
    ).orderBy(F.desc('transacciones'))

    dinero_mensual = d.withColumn('mes', fecha_mes('fecha_transaccion')) \
        .filter(F.col('mes').isNotNull()).groupBy('mes').agg(
            F.count('*').alias('transacciones'),
            redondeo(F.sum('importe')).alias('monto_total'),
        ).orderBy('mes')

    registros_mensuales = u.withColumn('mes', fecha_mes('fecha_registro')) \
        .filter(F.col('mes').isNotNull()).groupBy('mes').agg(
            F.count('*').alias('usuarios_registrados'),
        ).orderBy('mes')

    desenlaces = terminados.groupBy('desenlace').agg(
        F.count('*').alias('partidos'),
        redondeo(F.avg('cuota_l')).alias('cuota_local_media'),
        redondeo(F.avg('cuota_v')).alias('cuota_visitante_media'),
    ).orderBy(F.desc('partidos'))

    partidos_mensuales = terminados.withColumn('mes', fecha_mes('fecha_partido')) \
        .filter(F.col('mes').isNotNull()).groupBy('mes').agg(
            F.count('*').alias('partidos'),
            redondeo(F.avg('goles_total')).alias('promedio_goles'),
        ).orderBy('mes')

    goles_rangos = terminados.withColumn('grupo',
        F.when(F.col('goles_total') >= 5, '5+').otherwise(F.col('goles_total').cast('int').cast('string'))
    ).groupBy('grupo').agg(F.count('*').alias('partidos')).orderBy('grupo')

    cuotas_rangos = a.withColumn('rango',
        F.when(F.col('cuota_n') < 1.5, '<1.5')
         .when(F.col('cuota_n') < 2, '1.5-2')
         .when(F.col('cuota_n') < 3, '2-3')
         .otherwise('3+')) \
        .groupBy('rango').agg(F.count('*').alias('apuestas')).orderBy('rango')

    totales = {
        'usuarios': u.count(), 'equipos': e.count(),
        'partidos': p.count(), 'apuestas': a.count(), 'movimientos_dinero': d.count(),
        'partidos_finalizados': terminados.count(),
    }

    # Ejecutar tareas reales para observar los contenedores ejecutores activos.
    ejecutores = sorted(set(spark.sparkContext.parallelize(
        list(range(48)), 48).map(lambda _: socket.gethostname()).collect()))

    informe = {
        'sistema': 'NOVATIX', 'version': 'spark-v2',
        'fecha_utc': datetime.now(timezone.utc).isoformat(),
        'motor': spark.version,
        'ejecutores_observados': ejecutores,
        'distribucion_observada': len(ejecutores) >= 2,
        'fuente': '5 CSV sinteticos; no MySQL en tiempo real',
        'totales': totales,
        'top_equipos': filas(top_equipos, 25),
        'ligas': filas(ligas, 40),
        'apuestas_por_resultado': filas(apuestas_resultados, 12),
        'apuestas_mensuales': filas(apuestas_mensuales, 120),
        'movimientos_por_tipo': filas(dinero_tipo, 25),
        'movimientos_mensuales': filas(dinero_mensual, 120),
        'usuarios_registrados_mensuales': filas(registros_mensuales, 120),
        'desenlaces_partidos': filas(desenlaces, 5),
        'partidos_mensuales': filas(partidos_mensuales, 120),
        'distribucion_goles': filas(goles_rangos, 10),
        'distribucion_cuotas': filas(cuotas_rangos, 10),
        'nota_monetaria': 'Unidades monetarias sinteticas; pago y balance teoricos calculados a partir de las cuotas.',
    }
    # Escribir atomico: el reporte anterior sigue intacto.
    SALIDA.parent.mkdir(parents=True, exist_ok=True)
    temporal = SALIDA.with_suffix('.json.tmp')
    with temporal.open('w', encoding='utf-8') as f:
        json.dump(informe, f, ensure_ascii=False, indent=2, default=str, allow_nan=False)
        f.write('\n')
    os.replace(temporal, SALIDA)
    print('SPARK_V2=GENERADO')
    print('ARCHIVO=' + str(SALIDA))
    print('SECCIONES=' + str(len(informe)))
    print('TOTALES=' + str(totales))
    print('EJECUTORES=' + str(len(ejecutores)))
finally:
    spark.stop()
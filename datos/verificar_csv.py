#!/usr/bin/env python3
"""NOVATIX: verificación SOLO LECTURA de datos Spark V2 y relaciones."""
import csv
import hashlib
import json
from pathlib import Path

DATA = Path(__file__).resolve().parent

def inspeccionar():
    manifest = json.loads((DATA / 'manifest-csv-v2.json').read_text(encoding='utf-8'))
    tablas = {}
    valido = True
    print('=== NOVATIX - INTEGRIDAD DE CSV SPARK V2 ===')
    for entrada in manifest['archivos']:
        nombre = entrada['nombre']
        archivo = DATA / nombre
        if not archivo.is_file():
            print(f'ERROR=ARCHIVO_FALTANTE {nombre}')
            valido = False
            continue
        hash_actual = hashlib.sha256(archivo.read_bytes()).hexdigest()
        with archivo.open(newline='', encoding='utf-8-sig') as handle:
            reader = csv.DictReader(handle)
            columnas = reader.fieldnames or []
            rows = list(reader)
        tablas[nombre.removesuffix('.csv')] = rows
        ok = (hash_actual == entrada['sha256'] and columnas == entrada['columnas']
              and len(rows) == entrada['filas'])
        ids = [r.get('id') for r in rows]
        if len(ids) != len(set(ids)):
            ok = False
            print(f'ERROR=ID_DUPLICADO {nombre}')
        print(f'{nombre}: filas={len(rows)} sha256={"OK" if hash_actual==entrada["sha256"] else "ERROR"} columnas={"OK" if columnas==entrada["columnas"] else "ERROR"} resultado={"OK" if ok else "ERROR"}')
        valido &= ok
    if len(tablas) != len(manifest['archivos']):
        return False
    ids = {nombre: {row['id'] for row in rows} for nombre, rows in tablas.items()}
    refs = [('partidos','id_equipo_local','equipos'),('partidos','id_equipo_visitante','equipos'),
            ('apuestas','user_id','usuarios'),('apuestas','part_id','partidos'),
            ('apuestas','equipo_id','equipos'),('dinero','id_usuario','usuarios')]
    for tabla,columna,destino in refs:
        huerfanos=sum(1 for row in tablas[tabla] if row[columna] not in ids[destino]
                      and not (tabla=='apuestas' and columna=='equipo_id' and row[columna]=='0'))
        print(f'RELACION={tabla}.{columna}->{destino}.id HUERFANOS={huerfanos}')
        valido &= (huerfanos==0)
    total=sum(len(rows) for rows in tablas.values())
    print('TOTAL_REGISTROS='+str(total))
    valido &= total==manifest['filas_totales']
    print('SELECCION_ESPECIAL_EMPATE='+str(sum(x['equipo_id']=='0' for x in tablas['apuestas'])))
    print('RESULTADO='+('CORRECTO' if valido else 'REQUIERE_REVISION'))
    return bool(valido)

if __name__=='__main__':
    if not inspeccionar():
        raise SystemExit(1)

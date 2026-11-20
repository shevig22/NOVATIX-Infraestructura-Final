#!/usr/bin/env python3
"""Mapea fecha_apuesta del CSV analitico a fecha del esquema MySQL; NO importa."""
import argparse,csv
from pathlib import Path
COLUMNAS=['id','user_id','part_id','equipo_id','dinero_apostado','cuota','fecha','resultado']
def convertir(entrada,salida):
 entrada=Path(entrada).resolve();salida=Path(salida).resolve()
 if entrada==salida or salida.exists():raise ValueError('La salida debe ser archivo nuevo')
 with entrada.open(encoding='utf-8-sig',newline='') as fi:
  lector=csv.DictReader(fi)
  requerido=(set(COLUMNAS)-{'fecha'})|{'fecha_apuesta'}
  if not requerido.issubset(lector.fieldnames or []):raise ValueError('Columnas faltantes')
  with salida.open('w',encoding='utf-8',newline='') as fo:
   escritor=csv.DictWriter(fo,fieldnames=COLUMNAS);escritor.writeheader()
   for fila in lector:
    registro={col:fila[col] for col in COLUMNAS if col!='fecha'}
    registro['fecha']=fila['fecha_apuesta'];escritor.writerow(registro)
 print('CSV adaptado generado. NO se ha escrito en MySQL.')
if __name__=='__main__':
 p=argparse.ArgumentParser();p.add_argument('--entrada',required=True);p.add_argument('--salida',required=True)
 a=p.parse_args();convertir(a.entrada,a.salida)

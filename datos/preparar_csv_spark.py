#!/usr/bin/env python3
"""Minimiza cinco CSV para Spark; NO reproduce el generador historico."""
import argparse,csv
from pathlib import Path
CAMPOS={
'usuarios':['id','fecha_registro','estado','rol'],
'equipos':['id','nombre','pais','liga','escudo','estado'],
'partidos':['id','id_equipo_local','id_equipo_visitante','equipo_local_nombre','equipo_visitante_nombre','escudo_local','escudo_visitante','fecha_partido','cuota_local','cuota_empate','cuota_visitante','goles_local','goles_visitante','estado'],
'apuestas':['id','user_id','part_id','equipo_id','dinero_apostado','cuota','resultado','fecha_apuesta'],
'dinero':['id','id_usuario','saldo_real','saldo_congelado','saldo_disponible','tipo','monto','saldo_antes','saldo_despues','fecha_transaccion','estado']}
def preparar(entrada,salida):
 entrada=Path(entrada).resolve();salida=Path(salida).resolve()
 if entrada==salida:raise ValueError('Carpetas de entrada y salida iguales')
 if not entrada.is_dir():raise FileNotFoundError(entrada)
 if salida.exists() and any(salida.iterdir()):raise ValueError('La salida debe estar vacia')
 for nombre,campos in CAMPOS.items():
  with (entrada/(nombre+'.csv')).open(encoding='utf-8-sig',newline='') as f:
   lector=csv.DictReader(f)
   faltan=set(campos)-set(lector.fieldnames or [])
   if faltan:raise ValueError(nombre+': faltan '+str(sorted(faltan)))
 salida.mkdir(parents=True,exist_ok=True)
 for nombre,campos in CAMPOS.items():
  cantidad=0
  with (entrada/(nombre+'.csv')).open(encoding='utf-8-sig',newline='') as fi,(salida/(nombre+'.csv')).open('w',encoding='utf-8',newline='') as fo:
   lector=csv.DictReader(fi);escritor=csv.DictWriter(fo,fieldnames=campos,extrasaction='ignore');escritor.writeheader()
   for fila in lector:
    escritor.writerow({c:fila.get(c,'') for c in campos});cantidad+=1
  print(nombre+'.csv:',cantidad,'filas')
 print('AVISO=Revisar datos/licencias antes de redistribuir. No escribe MySQL.')
if __name__=='__main__':
 p=argparse.ArgumentParser();p.add_argument('--entrada',required=True);p.add_argument('--salida',required=True)
 a=p.parse_args();preparar(a.entrada,a.salida)

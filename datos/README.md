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


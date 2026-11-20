# Dashboard NOVATIX Spark Analytics V2

El servicio desplegado como `novatix_dashboard` en Ubuntu2 escucha desde el host en el puerto **8090** (puerto interno 8080). La versión actual lee `/resultados/reporte_novatix_v2.json`, el resultado de Spark V2.

## Fuente del código

Los archivos de la interfaz están en el paquete de despliegue original `novatix_dashboards_spark_v2.tar.gz`, **todavía pendiente de incorporar en este directorio**. No confundir con el dashboard del GitHub anterior: aquel consumía `reportes_db` mientras esta versión consume un JSON generado por Spark.

Archivos requeridos de ese paquete:

- `server-v2.js` — servidor Node.js de solo lectura.
- `public/index.html`, `public/styles.css`, `public/app.js` — interfaz del dashboard.
- `Dockerfile` — receta original que extiende una imagen de pruebas disponible localmente.
- `desplegar.sh` — instalador histórico que reemplazaba los puertos 8090 y 8093; **no ejecutarlo en el diseño final de dashboard único**, requiere revisión previa.

## Construcción portable propuesta

Esta variante `Dockerfile.portable` usa Node 22 y los módulos estándar sin depender de la imagen local antigua. **No se ha validado en el clúster**; ejecutar pruebas de construcción antes de adoptarla. Se conserva la receta original en la instalación local para comparar.

```sh
docker build -f Dockerfile.portable -t novatix-dashboard:spark-v2-portable .
```

El contenedor requiere acceso de solo lectura al JSON mediante un bind mount en `/resultados/reporte_novatix_v2.json`.

## Pruebas de referencia

```sh
curl -fsS http://192.168.100.3:8090/api/health
curl -fsS http://192.168.100.3:8090/api/spark/v2
```

No hay dependencia JDBC, ni SQL en vivo: los datos proceden de cinco CSV sintéticos procesados por Spark.

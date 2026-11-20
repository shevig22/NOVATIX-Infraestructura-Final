# Dashboard NOVATIX Spark Analytics V2

El servicio desplegado como `novatix_dashboard` en Ubuntu2 escucha desde el host en el puerto **8090** (puerto interno 8080). La versión actual lee `/resultados/reporte_novatix_v2.json`, el resultado de Spark V2.

## Fuente del código

Los archivos **ya están publicados** en este directorio: `server-v2.js`, `public/index.html`, `public/styles.css`, `public/app.js` y `Dockerfile`. Proceden del paquete de despliegue original `novatix_dashboards_spark_v2.tar.gz` instalado en Ubuntu2. No confundir con el dashboard del GitHub anterior: aquel consumía `reportes_db` mientras esta versión consume un JSON generado por Spark.

Archivos requeridos de ese paquete:

- `server-v2.js` — servidor Node.js de solo lectura.
- `public/index.html`, `public/styles.css`, `public/app.js` — interfaz del dashboard.
- `Dockerfile` — receta portable basada en `node:22-alpine` para construir desde el código publicado.
- `desplegar.sh` — instalador histórico que reemplazaba los puertos 8090 y 8093; **no ejecutarlo en el diseño final de dashboard único**, requiere revisión previa.

## Construcción portable propuesta

El `Dockerfile` utiliza Node 22 y módulos estándar sin depender de la imagen local antigua. **Este Dockerfile portable no ha sido validado en el clúster**; construir y probar antes de utilizarlo como reemplazo de la versión que funciona. `Dockerfile.portable` se conserva como alternativa equivalente. Se conserva la receta original en la instalación local para comparar.

```sh
docker build -t novatix-dashboard:spark-v2-portable .
```

El contenedor requiere acceso de solo lectura al JSON mediante un bind mount en `/resultados/reporte_novatix_v2.json`.

## Pruebas de referencia

```sh
curl -fsS http://192.168.100.3:8090/api/health
curl -fsS http://192.168.100.3:8090/api/spark/v2
```

No hay dependencia JDBC, ni SQL en vivo: los datos proceden de cinco CSV sintéticos procesados por Spark.

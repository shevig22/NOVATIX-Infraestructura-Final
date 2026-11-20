# Dashboard NOVATIX Spark Analytics V2 — imagen portable

**Estado del laboratorio:** el dashboard ya funciona como **servicio Docker Swarm `novatix_dashboard`** fijado a **servidorUbuntu2**, puerto `8090` externo → `8080` en el contenedor. El inventario anterior utiliza una **imagen local** `novatix-dashboard:spark-v2-20261119_234042`. El dashboard es un servidor Node.js (módulo HTTP nativo) que distribuye frontend HTML/CSS/JS y consulta el reporte JSON; **no accede a MySQL**.

## Empaquetado nuevo desde GitHub

El `Dockerfile` y el `Dockerfile.portable` ahora usan `node:22-alpine` directamente, **sin la dependencia anterior de `novatix-dashboard:1.2.0`**. Copian `server-v2.js` y la carpeta `public/`; exponen `8080`, ejecutan como usuario no privilegiado `node` y comprueban `/api/health` mediante `HEALTHCHECK`.

```text
dashboard/
├── Dockerfile
├── server-v2.js
├── public/
│   ├── index.html
│   ├── styles.css
│   └── app.js
└── probar-contenedor-aislado.sh
```

No requiere instalación de paquetes npm externos. **El código del contenedor está preparado, pero esta nueva imagen no ha sido construida ni desplegada en las VMs aún.** El servicio `novatix_dashboard` original permanece sin cambios.

## ¿Dónde está el JSON de Spark?

- En Ubuntu2 (host Vagrant): `/vagrant/novatix_spark_resultados/reporte_novatix_v2.json`.
- Dentro del contenedor: `/resultados/reporte_novatix_v2.json`.
- Montaje real: `/vagrant/novatix_spark_resultados:/resultados:ro`, **solo lectura**.
- Datos de entrada a Spark: `/vagrant/novatix_spark_datos/*.csv`.

Spark realiza un trabajo **por lotes** y guarda el JSON; el dashboard lo lee y lo entrega al frontend cuando el navegador hace consultas. El dashboard no genera ni escribe ese archivo.

## Validar la imagen portable sin tocar la instalación actual

En **Ubuntu2**, desde un clon actualizado del repositorio nuevo:

```bash
bash dashboard/probar-contenedor-aislado.sh
```

El script crea solo una imagen local y levanta temporalmente un contenedor **distinto** en `127.0.0.1:18090`, con el reporte JSON en un montaje de solo lectura. Prueba los endpoints `/api/health`, `/`, `/app.js` y `/api/spark/v2`. Luego elimina únicamente el contenedor temporal de nombre exacto. **No ejecuta `docker service update` ni `docker stack deploy`**. Verificar la disponibilidad y permisos de `/vagrant/novatix_spark_resultados` antes de ejecutarlo.

No sustituir el dashboard 8090 ni la imagen actual hasta que esta comprobación resulte satisfactoria. Una eventual sustitución del servicio requerirá validación y plan de reversión separado.

## Corrección visual de «Empate»

En `public/app.js`, la categoría `eq_id=0` se muestra como **Empate**. El endpoint de compatibilidad `/api/dashboard` tiene la misma etiqueta. Estos cambios están versionados, pero **aún no se han desplegado en el contenedor actualmente activo**.

## Auditoría de la instalación actual (sin modificarla)

```bash
sudo -n docker service ls --filter name=novatix_dashboard --format '{{.Name}} {{.Replicas}}'
sudo -n docker service inspect novatix_dashboard --format '{{.Spec.TaskTemplate.ContainerSpec.Image}}'
curl -fsS http://192.168.100.3:8090/api/health
```

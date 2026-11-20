# Frontend NOVATIX — Ubuntu1 (Apache)

La copia original fue obtenida del servidor `servidorUbuntu1` el 20/11/2026, desde `/var/www/html2`.

## Archivos identificados en la copia del servidor

| Archivo original | Función | SHA-256 |
|---|---|---|
| `index.html` | Login, registro, apuestas y panel administrativo | `15cf89484cc8f735f2b6ed416388172d37a9cdf1b9d7adba6988c8e92b5a6d88` |
| `app.js` | Cliente de API, apuesta y carga bajo demanda | `e33f09c3a19b4cec963c0fd4d4c047132966891004495ed8016d5c0e52052c12` |
| `estilos.css` | Estilos del frontend | `6867036627a7fad47e89bde1f2a49c300bcb0f89f380ab0761ccf6ebb65af0b5` |
| `spark-integracion.js` | Abrir iframe desde la zona de administración | `251271c74fe76866829f9494def658406e7d1b1e401522556c63884a22f9da8f` |
| `spark-dashboard.html` | Vista adaptada del dashboard | `6f891e7282b1afe34db8ed97703a479f32df29782f6515373f5ee210c1921a8f` |
| `spark-dashboard-app.js` | Carga agregados desde `/novatix-spark-api/v2` | `ee018340f4faffae36709904b0258d05d7e36354c87db0d0238372c9e8ae6c8f` |
| `spark-dashboard-styles.css` | Diseño del dashboard integrado | `a533e9d3fab28054d02f421323a39daba5883cdfbe7bde9096db07dc84c8f618` |

**Estado de publicación: COMPLETO para el respaldo recibido de Ubuntu1.** Los siete archivos se publicaron por separado en esta carpeta y sus SHA de objeto Git coincidieron **uno por uno** con las huellas Git calculadas sobre los bytes originales del respaldo. Los SHA-256 de la tabla permiten repetir la verificación con `python3 pruebas/comprobar-entrega.py`. Esto confirma igualdad de los archivos, **no** significa que se haya realizado una instalación limpia ni que la seguridad esté corregida.

## Implementación observada

- Apache sirve el frontend desde `/var/www/html2` en Ubuntu1.
- `app.js` usa rutas relativas `/usuarios`, `/equipos`, `/partidos`, `/apuestas` y `/dinero`; Apache debe reenviarlas a HAProxy.
- La carga inicial de partidos se pospuso y se presenta «Ver primeros 20 partidos»; **el backend desplegado originalmente aún puede devolver todos los datos** hasta sustituirlo por la API paginada.
- El dashboard abre `/spark-dashboard.html` y consulta `/novatix-spark-api/v2`; la ruta proxy de Apache dirige la API al dashboard de Ubuntu2.

## Reproducción segura en una máquina de laboratorio nueva

1. Clonar el repositorio; los siete archivos se encuentran directamente en `frontend/`. Ejecutar `python3 pruebas/comprobar-entrega.py` para verificar sus huellas SHA-256.
2. Instalar Apache y habilitar las rutas API hacia HAProxy, sin copiar valores secretos ni exponer MySQL.
3. Publicar los archivos en el DocumentRoot de la nueva VM y adaptar el VirtualHost a su red.
4. Configurar `mod_proxy` y `mod_proxy_http` para el endpoint Spark; comprobar `apache2ctl configtest` antes de recargar.
5. Verificar el sitio desde navegador: login, navegación, apuestas sintéticas, renderizado de Spark y errores de consola.
6. Implementar autenticación y autorización **en el servidor** antes de abrirlo fuera del laboratorio.

**Advertencia:** el código original solo comprueba `usuarioActual.rol` en JavaScript. Esta validación de cliente no constituye control de acceso seguro. El backend original tampoco debe exponerse en Internet sin resolver sus problemas de credenciales y permisos.

Ver la [guía de reproducción general](../documentacion/reproduccion-paso-a-paso.md).
## Configuración de Apache

Se incluye [un ejemplo de `ProxyPass` para Spark](apache/novatix-spark-proxy.conf), adaptado de la fase S2. Todavía **no se ha publicado el VirtualHost transaccional real completo** (rutas relativas `/usuarios`, `/partidos`, `/equipos`, `/apuestas`, `/dinero`). Por tanto, es necesario configurar y comprobar ese enrutamiento hacia HAProxy en el laboratorio nuevo antes de probar el frontend. La guía [paso a paso](../documentacion/reproduccion-paso-a-paso.md) describe el procedimiento y sus límites.

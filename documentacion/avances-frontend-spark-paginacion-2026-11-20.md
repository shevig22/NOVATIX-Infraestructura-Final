# Avances de integración NOVATIX — 20 de noviembre de 2026

Este documento distingue cambios **aplicados al laboratorio**, **pruebas aisladas** y **pendientes de publicación/despliegue**. No sustituye a la auditoría de reproducibilidad.

## 1. Backend: paginación de Partidos y Equipos

En `servidorUbuntu2` se editaron las copias locales de:

- `microservicios/partidos/src/controllers/partidosController.js`
- `microservicios/partidos/src/models/partidosModel.js`
- `microservicios/equipos/src/controllers/equiposController.js`
- `microservicios/equipos/src/models/equiposModel.js`
- `microservicios/partidos/package.json` y `package-lock.json` (dependencia `axios`, utilizada por el controlador).

**Contrato nuevo, preparado localmente, pendiente de desplegar en las réplicas Swarm:**

- `GET /api/partidos?page=1&limit=20`: responde `{items, page, limit, hasMore}`. Consulta SQL ordenada por `id DESC` con `LIMIT` y `OFFSET`.
- `GET /api/equipos?page=1&limit=20&q=...`: misma estructura; búsqueda por prefijo de nombre.
- Sin parámetros se conserva la respuesta original de tipo arreglo, para compatibilidad temporal. **Esto no evita consultas completas para clientes antiguos**.
- Los límites de página son validados y acotados a 100; las respuestas usan una fila adicional para calcular `hasMore`.

**Pruebas ejecutadas:**

- R6C: cuatro archivos pasaron `node --check` con Node 12 y `git diff --check`.
- R7: dos imágenes locales `novatix-partidos:paginacion-r7-local` y `novatix-equipos:paginacion-r7-local` construidas en Ubuntu2.
- R8B: pruebas HTTP con 45 filas simuladas por servicio; primera/segunda/última página, validación de parámetros, compatibilidad con cliente anterior y búsqueda de equipos aprobadas. Las pruebas no consultaron MySQL real.
- R9–R10: se verificó la red overlay, **no attachable**, y los servicios de las bases de datos; **no se ejecutó todavía R11 con MySQL real**.
- Durante estas comprobaciones las APIs de Partidos y Equipos se mantuvieron en **4/4 réplicas originales cada una**. No existe evidencia de que las imágenes nuevas estén desplegadas en Swarm.

**Respaldos locales:** `/home/vagrant/novatix_respaldos_rendimiento/`. No subir respaldos al repositorio.

## 2. Frontend Apache: mitigación de carga

Frontend real de laboratorio: `/var/www/html2` en `servidorUbuntu1`, con `index.html`, `app.js` y `estilos.css`.

Se aplicó un parche de emergencia **en Ubuntu1, no publicado todavía en este repositorio**:

- Se deshabilitó la carga automática inicial de partidos y equipos administrativos.
- Se agregó el botón «Ver primeros 20 partidos»; la carga se realiza bajo demanda.
- `app.js` solicita `?page=1&limit=20` y limita el número de tarjetas renderizadas a 20.
- **Limitación:** hasta desplegar la nueva API, el backend original ignora esos parámetros y sigue transfiriendo todos los registros cuando el usuario pulsa el botón. El listado de equipos aún puede descargarse completo bajo demanda.
- Se verificó `HTTP 200` para `app.js` y Apache activo. No equivale a una prueba completa de navegación, apuestas o rendimiento percibido.

Respaldo realizado: `/var/backups/novatix-integracion-spark/app_antes_optimizar_20261120_144046.js`.

## 3. Dashboard Spark integrado visualmente

Se desplegó en el frontend Apache de Ubuntu1 una sección «📊 Analítica Spark» dentro del panel administrativo:

- `index.html`: tarjeta y botón; iframe que se carga únicamente cuando se pulsa.
- `spark-integracion.js`: muestra el dashboard al usuario cuyo `usuarioActual.rol` sea `admin`, validación **solamente del cliente**.
- `spark-dashboard.html`, `spark-dashboard-app.js` y `spark-dashboard-styles.css`: copia de la interfaz del dashboard con rutas adaptadas a NOVATIX.
- Apache: `/etc/apache2/conf-available/novatix-spark-proxy.conf` redirige `/novatix-spark-api/` a la API del dashboard en Ubuntu2 (8090).
- S2: Apache `Syntax OK`, y las cuatro rutas de la interfaz y API devolvieron HTTP 200. **Queda pendiente la verificación visual completa en navegador**.

**Advertencia de seguridad:** no hay autorización del lado del servidor para los activos y el endpoint Spark. `localStorage` es modificable y el dashboard de Ubuntu2 expone acceso directo por el puerto 8090. **No describir esta función como acceso seguro exclusivo de administradores**. Antes de exposición en redes no confiables, implementar una sesión verificable del lado del servidor, restringir los endpoints y cerrar accesos directos; además, corregir el registro de usuarios que acepta el rol remitido por el cliente.

Respaldo S2: `/var/backups/novatix-integracion-spark/spark_s2_20261120_145053/`.

## 4. Trabajo pendiente prioritario

1. Sincronizar al repositorio los cambios reales del backend desde Ubuntu2, revisando previamente el diff y excluyendo secretos, respaldos y archivos generados.
2. Publicar la fuente real del frontend de Ubuntu1 de forma saneada; la carpeta `/var/www/html2` no estaba versionada en este repositorio.
3. Probar las consultas paginadas contra MySQL real sin modificar registros; desplegar imágenes con etiquetas nuevas disponibles en ambos nodos y con posibilidad de rollback.
4. Adaptar la administración de equipos para buscar/seleccionar sin descargar todos; confirmar paginación en la API ya desplegada.
5. Implementar **autenticación y autorización verificable en servidor** antes de declarar el dashboard privado.
6. Repetir pruebas funcionales (login, apuestas, administración, Spark) y mediciones de rendimiento.

## 5. Precauciones

Este repositorio corresponde a un proyecto académico de apuestas **simuladas**. No subir contraseñas, tokens, dumps MySQL, copias de seguridad, datos personales ni material interno de laboratorio. Evitar declarar «solucionado» el problema de carga hasta desplegar el backend paginado y repetir las pruebas.

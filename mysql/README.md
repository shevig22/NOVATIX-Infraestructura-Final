# MySQL 8.0 — esquemas reales de NOVATIX

Estos cinco archivos SQL permiten crear las **estructuras vacías** de los cinco microservicios en una instalación nueva de MySQL 8.0. Se derivaron de la exportación **`novatix_mysql_esquemas_20261120_025105.tar.gz`**, ejecutada en `servidorUbuntu3`.

## Origen verificado

- **SHA-256 del archivo comprimido original:** `eb26a44286dcb8c57662d4428020cc0245475cc2a183ae2271fe3b52492cdb47`.
- Exportación con `mysqldump --no-data --skip-triggers --no-tablespaces --set-gtid-purged=OFF --databases`.
- Cinco archivos de origen y sus líneas: `usuarios.sql` (42), `equipos.sql` (38), `partidos.sql` (46), `apuestas.sql` (40), `dinero.sql` (43).
- Las cinco tablas se verificaron en la exportación. El dump **no contiene registros de datos, sentencias INSERT ni valores de contraseñas**.
- Los cinco SQL de la carpeta [`esquemas/`](esquemas/) son **adaptaciones no destructivas**: conservan columnas, tipos, índices y valores por defecto, pero eliminan `DROP TABLE IF EXISTS`, las cabeceras de sesión de `mysqldump`, `AUTO_INCREMENT=N` históricos y los metadatos de cifrado de tablas. Usan `CREATE ... IF NOT EXISTS`. **No son copias textuales** del dump original.

## Tablas por servicio

| Base de datos | Tabla | Campos principales | Restricciones |
|---|---|---|---|
| `usuarios_db` | `usuarios` | nombre, email, usuario, password, fecha_registro, estado, rol | PK `id`; email y usuario únicos |
| `equipos_db` | `equipos` | nombre, pais, liga, escudo, estado | PK `id` |
| `partidos_db` | `partidos` | equipos local y visitante, goles, fecha_partido, cuotas, estado | PK `id` |
| `apuestas_db` | `apuestas` | user_id, part_id, equipo_id, dinero_apostado, cuota, fecha, resultado | PK `id` |
| `dinero_db` | `dinero` | id_usuario, saldos, tipo, monto, saldo_antes, saldo_despues, fecha | PK `id` |

No se encontraron claves foráneas en estos cinco `CREATE TABLE`: las referencias entre APIs son **lógicas**, y sus bases se encuentran en instancias de MySQL distintas.

## Cómo utilizar en una instalación NUEVA

En un host con cliente MySQL 8.0 configurado y **contra una instancia vacía y aislada**, ejecutar cada script por separado:

```bash
mysql --host=127.0.0.1 --user=root --password < mysql/esquemas/usuarios.sql
mysql --host=127.0.0.1 --user=root --password < mysql/esquemas/equipos.sql
mysql --host=127.0.0.1 --user=root --password < mysql/esquemas/partidos.sql
mysql --host=127.0.0.1 --user=root --password < mysql/esquemas/apuestas.sql
mysql --host=127.0.0.1 --user=root --password < mysql/esquemas/dinero.sql
```

**No ejecutar estos comandos sobre el clúster activo.** `CREATE TABLE IF NOT EXISTS` evita borrar tablas pero no comprueba coincidencia del esquema ni migra estructuras existentes; solo crea bases y tablas faltantes.

## Qué falta para reproducir el entorno funcional

1. Provisionar cinco MySQL 8.0 con las variables de entorno y los volúmenes correctos. Consultar [inventario Swarm](../docker-swarm/inventario-activo-sanitizado.json) y [plantilla no probada](../docker-swarm/stack.novatix.template.yml).
2. Crear las cuentas de aplicación con privilegios limitados y credenciales **externas al repositorio** (no se incluyen secretos ni usuarios privilegiados).
3. Preparar/importar datos de prueba o sintetizarlos con proceso documentado. Los scripts SQL crean **tablas vacías**; no cargan los 130.324 registros de los CSV Spark ni las filas de producción académica.
4. Validar las consultas de cada API y acceso de red desde las VMs.
5. Probar la importación en un entorno aislado antes de clasificar la instalación como reproducible.

## Nota de integración Spark

En las tablas `apuestas` y `dinero` de MySQL el campo temporal es **`fecha`**; el programa Spark V2 necesita las columnas **`fecha_apuesta`** y **`fecha_transaccion`** en los CSV. La preparación de los archivos debió normalizar esos nombres o generarlos; el procedimiento histórico exacto aún debe documentarse.

## Seguridad

La columna `usuarios.password` forma parte del esquema; **no se exportó ningún valor**. El código original de la API de usuarios usa verificación de contraseñas en texto plano, problema conocido para producción. Los esquemas por sí solos no se consideran un sistema seguro.

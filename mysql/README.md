# Persistencia MySQL — por completar

La implementación verificada dispone de cinco servicios MySQL 8.0 en `servidorUbuntu3`: `novatix_stack_db-usuarios`, `db-equipos`, `db-partidos`, `db-apuestas` y `db-dinero`, todos con 1 réplica y volúmenes persistentes.

## Falta publicar

- Esquemas SQL (`CREATE TABLE`, índices y relaciones) de cada base, exportados con un usuario autorizado.
- Instrucciones para inicializar bases vacías y cargar datos de muestra legalmente redistribuibles.
- Plantilla de configuración sin contraseñas ni cadenas de conexión activas.
- Descripción de volúmenes y la ubicación/afinidad a Ubuntu3, extraída del inventario real.
- Verificación por `SHOW TABLES`, conteos y consulta HTTP, sin revelar datos individuales.

No subir `mysqldump` con contraseñas, identificadores personales o datos de usuarios. No asumir disponibilidad alta de MySQL: las cinco bases residen en un único nodo.

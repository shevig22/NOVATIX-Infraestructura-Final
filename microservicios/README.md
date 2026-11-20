# Microservicios Node.js — fuentes recuperadas de las imágenes desplegadas

Este directorio contiene los **30 archivos originales** recuperados mediante `docker cp` desde los cinco contenedores en ejecución del clúster NOVATIX en `servidorUbuntu2` (19-20 de noviembre de 2026). Se conservaron el código fuente, la estructura de mayúsculas y minúsculas, `package.json`, `package-lock.json` y el `Dockerfile` original.

| Servicio | Imagen Docker Hub verificada | Puerto **real** de la aplicación | Puerto `EXPOSE` del Dockerfile original |
|---|---|---:|---:|
| Usuarios | `shevig2208/novatix-usuarios:4` | 3001 | 3001 |
| Equipos | `shevig2208/novatix-equipos:3` | 3004 | 3000 |
| Partidos | `shevig2208/novatix-partidos:3` | 3002 | 3000 |
| Apuestas | `shevig2208/novatix-apuestas:3` | 3000 | 3005 |
| Dinero | `shevig2208/novatix-dinero:3` | 3003 | 3000 |

**Importante:** el valor `EXPOSE` de cuatro Dockerfiles no coincide con el puerto donde el proceso Node.js escucha. No se corrigieron aquí los archivos recuperados, para preservar la trazabilidad del material extraído. La configuración Swarm desplegada utiliza los puertos reales.

## Código fuente y operación

Cada servicio incluye un directorio `src` con `index.js`, controlador y modelo (con nombres y mayúsculas originales), además de `package.json`, `package-lock.json` y `Dockerfile`.

Los modelos de datos utilizan `mysql2` y pueden recibir `DB_HOST`, `DB_USER`, `DB_PASSWORD` y `DB_NAME` por variables de entorno. El clúster usa servicios MySQL internos de Swarm, no las IP de la topología antigua. No hay un `.env` copiado desde los contenedores.

La configuración de despliegue y las credenciales efectivas no están incluidas en las fuentes recuperadas. Para reproducir el sistema completo faltan los servicios Swarm/volúmenes y esquemas de las cinco bases, que se documentarán por separado.

## Observaciones del código académico (sin cambios en los fuentes)

- La implementación de usuarios comprueba contraseñas en texto plano; no se ha migrado a hashing.
- Los Dockerfiles originales están basados en `node:18-alpine`, con instalación de dependencias mediante `npm install`.
- La autenticación y la seguridad no se han auditado para una publicación en producción; se trata del entorno académico local.
- La publicación de imágenes en el espacio `shevig2208` indica origen de la imagen recuperada, **no autoría individual del código**.

**No se realizaron cambios ni reinicios de los contenedores o de las imágenes publicadas en Docker Hub para esta exportación.**

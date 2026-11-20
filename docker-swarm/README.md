# Docker Swarm — estado y reconstrucción

**Esta carpeta está en preparación.** No incluye todavía un `stack.yml` fiel a la configuración desplegada; el archivo debe obtenerse de los servicios reales, no copiarse del repositorio antiguo.

## Topología observada

- `servidorUbuntu1` (192.168.100.2): worker; una réplica de cada API; Spark Worker 1.
- `servidorUbuntu2` (192.168.100.3): líder Swarm; una réplica de cada API; HAProxy; dashboard 8090; Spark Master y Worker 2.
- `servidorUbuntu3` (192.168.100.4): worker; cinco MySQL, cada uno 1/1.
- Red Docker overlay: `novatix_stack_novatix_net_new` (10.77.0.0/24).
- API: usuarios `3001`, equipos `3004`, partidos `3002`, apuestas `3000`, dinero `3003`. Cada servicio tiene 2 réplicas, con máximo una por nodo.
- HAProxy: puerto publicado `8080`, estadísticas `8888`, balanceo `roundrobin` en dos tareas por backend.

## Pendiente para despliegue reproducible

- Inventario `docker service inspect` **sanitizado**: imagen y digest, replicas, mounts, redes, puertos, constraints, secretos/configs por **nombre**, variables de entorno por **nombre**.
- Manifestaciones YAML equivalentes y probadas en instalación limpia.
- Overlay y redes, dependencias y órdenes de instalación.
- Definición de config `haproxy/haproxy.cfg`, registrada ya desde la configuración viva.
- Variables `.env.example` con valores no secretos (no cargar contraseñas).
- Verificaciones posteriores a la instalación; comparar contra `pruebas/auditoria-infraestructura-2026-11-19.md`.

**No realizar `docker stack deploy`, `service update` ni `service scale` únicamente a partir de esta documentación.**

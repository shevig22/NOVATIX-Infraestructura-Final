# HAProxy V4 — configuración activada y validada

La configuración [`haproxy-4-replicas.candidate.cfg`](haproxy-4-replicas.candidate.cfg) fue validada con `haproxy -c`, registrada como Docker Config `novatix_stack_haproxy_cfg_4replicas_20261120` (ID `7cqgnfb906rpe8y2uihuiss3m`) y después **activada** en el servicio `novatix_stack_haproxy`. Docker Swarm confirmó convergencia **1/1** y HTTP 200.

Mantiene puertos HTTP 8080 y estadísticas 8888 publicados en modo `host`. Tiene cinco backends `roundrobin`, cada uno con cuatro slots `server-template`. Tras escalar las cinco API a **4/4**, las pruebas por cada API confirmaron **80/80 HTTP 200**, distribución **20/20/20/20** entre las cuatro réplicas y cuatro servidores `UP`. [Evidencia de la validación final](../pruebas/validacion-arquitectura-20-instancias.md).

La configuración [`haproxy.cfg`](haproxy.cfg) de dos slots es **histórica**. La Docker Config previa `novatix_stack_haproxy_cfg_v2_20261119193336` (ID `t9hvbx5t03xlssciioi7gftov`) se conserva; su respaldo local en `/vagrant/novatix_haproxy_original_20261120_034541.cfg` tenía SHA-256 `d4269dedf6983e329c48931d525a00f2b8f4693898fc7577c39e7c83ac22237e`.

**Límite arquitectónico:** HAProxy está solo en Ubuntu2 y constituye un punto único de fallo. La validación no prueba resistencia a fallos de nodo ni rendimiento bajo carga intensiva.

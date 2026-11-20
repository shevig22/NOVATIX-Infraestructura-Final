# HAProxy: configuración candidata para cuatro tareas por API

**Estado: candidata, NO ACTIVADA.** El clúster comprobado mantiene dos instancias por API y utiliza la Docker Config `novatix_stack_haproxy_cfg_v2_20261119193336`. El HAProxy real es `haproxy:2.8`, servicio `novatix_stack_haproxy` 1/1 en `servidorUbuntu2`, publica `8080→80` y `8888→8888` en modo host.

- Archivo actual activo (huella observada desde el contenedor): SHA-256 `d4269dedf6983e329c48931d525a00f2b8f4693898fc7577c39e7c83ac22237e`.
- Archivo original versionado: [`haproxy.cfg`](haproxy.cfg). Mantenerlo intacto hasta que haya aprobación del ensayo.
- Archivo candidato: [`haproxy-4-replicas.candidate.cfg`](haproxy-4-replicas.candidate.cfg).

**Único cambio textual en la candidata:** cinco líneas `server-template <nombre> 2 tasks...` cambian de `2` a `4` (usuarios, apuestas, partidos, dinero, equipos). No cambian rutas, resolver DNS Docker, healthchecks, frontend, estadísticas ni puertos.

El cambio a cuatro slots es **necesario pero no suficiente**: hay que confirmar que DNS devuelve las cuatro tareas, que aparecen cuatro backends `UP` y que `X-Replica` representa las cuatro respuestas. HAProxy seguirá alojado solo en Ubuntu2 y será un punto único de fallo.

## Verificación aislada de sintaxis (sin cambiar el servicio activo)

Desde `servidorUbuntu2` se puede crear una copia temporal del archivo candidato y comprobarla con una instancia efímera de la misma imagen de HAProxy en `--network none`. En ninguna circunstancia se ejecuta `docker service update` ni `docker config rm` en esta etapa.

Antes de validar, comprobar que el archivo activo sigue teniendo exactamente la huella SHA-256 mencionada. Guardar el candidato en un archivo temporal, verificar que contiene exactamente cinco `server-template` con valor 4 y ejecutar:

```bash
sudo docker run --rm --network none --pull never \
  --mount "type=bind,src=/ruta/absoluta/candidato.cfg,dst=/usr/local/etc/haproxy/haproxy.cfg,readonly" \
  haproxy:2.8 haproxy -c -f /usr/local/etc/haproxy/haproxy.cfg
```

Si el contenedor tiene como ENTRYPOINT `haproxy`, omitir el nombre adicional antes de `-c`, o usar `--entrypoint haproxy` para forzarlo. Validar siempre los argumentos de la imagen antes de ejecutarlos.

## Para la puesta en marcha posterior

1. Tener evidencia del 2/2 actual de HAProxy y diez tareas API.
2. Confirmar recursos y plan de reversión.
3. Crear **un nuevo Docker Config inmutable** con la candidata; no modificar el archivo de configuración activo en el contenedor.
4. Cambiar el servicio HAProxy para usar el nuevo Config de forma controlada, preservando el anterior para reversión.
5. Verificar HTTP 200 antes de escalar API; después ampliar **solo Equipos** de 2 a 4 instancias con `max_replicas_per_node=2`; comprobar distribución 2/2 entre Ubuntu1 y Ubuntu2 y los cuatro servidores balanceados.
6. Continuar con los otros cuatro servicios únicamente si Equipos y HAProxy funcionan bien. Actualizar la plantilla YAML y el informe una vez completado.

**Nunca aplicar `docker stack deploy` directamente con `stack.novatix.template.yml` al clúster activo.**

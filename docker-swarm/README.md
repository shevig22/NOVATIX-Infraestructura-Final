# Docker Swarm — reconstrucción documentada desde el clúster real

El archivo [inventario-activo-sanitizado.json](inventario-activo-sanitizado.json) procede de `docker service inspect` sobre **17 servicios** del clúster Ubuntu2 y está limitado a imágenes, réplicas, restricciones, puertos, redes, montajes y **nombres** de variables; no contiene sus valores.

## Distribución observada

- **11 servicios del stack transaccional**: cinco APIs `shevig2208` (2 réplicas cada una), cinco MySQL 8.0 (una réplica en Ubuntu3 cada uno) y HAProxy 2.8 (una réplica en Ubuntu2).
- **6 servicios independientes**: dashboard (uno), Spark Master (uno), Workers (dos) y jobs batch V1/V2 (dos).
- Los cinco microservicios usan `node.labels.novatix.role==aplicaciones` y `max_replicas_per_node: 1`, lo que permite ubicar uno en Ubuntu1 y otro en Ubuntu2 cuando los nodos están etiquetados.
- El inventario proporciona un ID de red `klq9z33usype07g3s0tmj6ala`. De una inspección anterior del clúster se confirmó el nombre `novatix_stack_novatix_net_new` y la subred `10.77.0.0/24`; comprobar que el nombre siga apuntando a ese ID antes de utilizar la plantilla.
- Las cinco bases usan los volúmenes reales `novatix_stack_db_{usuarios,equipos,partidos,apuestas,dinero}_data`, ubicados con los servicios en Ubuntu3; no hay failover automático de datos ante pérdida de ese nodo.
- HAProxy publica 8080→80 y 8888→8888 en modo `host`; carga su configuración verificada desde `../haproxy/haproxy.cfg`.

## Plantilla YAML: NO DESPLEGAR sobre el entorno activo

[`stack.novatix.template.yml`](stack.novatix.template.yml) incluye **solo los 11 servicios del stack transaccional** y refleja su imagen exacta (tag + digest), restricciones, puertos y volúmenes. Es una **plantilla informativa, no el manifiesto original ni una receta probada de instalación**. Algunos valores de conexión siguen como variables de entorno (ejemplo [`variables.example`](variables.example)). El inventario original no contiene `Command`, `Args`, valores secretos, certificados ni las definiciones/atributos completos de las redes.

Para mantener la identidad de los servicios, la plantilla presupone nombre de stack **`novatix_stack`**, red overlay existente y volúmenes externos previamente creados. La configuración `haproxy.cfg` se incorpora por archivo; no se puede presumir que el nombre/id de Docker Config sea idéntico al del servicio actual al redesplegar.

La plantilla **no debe ejecutarse** hasta validar configuración real, volúmenes, variables, imágenes, recursos, comandos, red y dependencias en un entorno de prueba. Desplegar sobre el stack activo podría recrear los contenedores y afectar la información.

## Qué falta

1. Recuperar `docker service inspect` selectivo para `Command`/`Args`, `WorkingDir`, recursos, política de reinicio, montajes y posibles secrets/configs sin mostrar sus valores.
2. Verificar `docker network inspect novatix_stack_novatix_net_new` y etiquetas de nodos.
3. Obtener en un entorno seguro los nombres reales de bases y rutas internas, **sin publicar contraseñas**.
4. Comprobar que los volúmenes de MySQL contienen respaldos íntegros y que funcionan tras restauración.
5. Registrar comandos Spark Master/Workers, funciones de inicio y reporte batch (ver [servicios-analitica.md](servicios-analitica.md)).
6. Validar la reconstrucción desde cero antes de presentar el YAML como reproducible.

No reemplazar los servicios existentes ni ejecutar `docker stack deploy` con esta plantilla.

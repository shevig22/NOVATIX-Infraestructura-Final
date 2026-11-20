# Ensayo de escalabilidad controlado (Equipos, 1 vs 2 replicas)



Script: ensayo_escalado_controlado.py; depende de carga_segura.py.

Precondicion: ejecutarlo solo en servidorUbuntu2, servicio novatix_stack_equipos 2/2, máximo una replica por nodo, MySQL y HAProxy saludables.

El script modifica temporalmente el número de replicas de Equipos: 2 → 1 → 2. No cambia bases de datos, imágenes ni otros servicios. Ejecuta la misma carga GET 120×3 con una replica, restaura a dos en un bloque finally, confirma 2/2 y repite la carga.

Es posible una breve interrupción de la API durante el ajuste de HAProxy. No ejecutar mientras otras personas estén cambiando el clúster.

Los resultados quedan en /vagrant/novatix_1replica_*.json, novatix_2replicas_*.json y novatix_comparacion_*.json.

Una sola corrida y la localidad del cliente no son suficientes para conclusiones de rendimiento universal. Repetir si hay tiempo.

IMPORTANTE: ni finally ni ningún script del nodo puede proteger frente a SIGKILL, caída eléctrica o pérdida del Manager. En caso de no ver restauración confirmada, ejecutar manualmente sudo docker service scale novatix_stack_equipos=2 y revisar docker service ls.

El programa no tiene instrucciones exit para cerrar la sesión SSH.

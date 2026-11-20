# Auditoría segura antes de ampliar de 10 a 20 instancias

El equipo confirmó como **arquitectura definitiva** dos instancias de cada microservicio en Ubuntu1 y dos en Ubuntu2 (4 por API; 20 en total). La configuración anterior comprobada tenía 10 instancias, con máximo una por nodo.

El script `auditar-capacidad-20.sh` recopila estado y etiquetas de los nodos, CPU/RAM asignada, límites/reservas de servicios y tareas actuales. **Solo consulta Docker; no cambia servicios.** Las estadísticas instantáneas de contenedores se obtienen de Ubuntu2. La ocupación efectiva de RAM/CPU de Ubuntu1 requiere revisión adicional antes de escalar.

Para la meta se necesitará configurar **4 réplicas por microservicio, máximo 2 por nodo**, y ampliar a **4 slots por backend** el HAProxy que actualmente dispone de 2. Debe comprobarse que Swarm coloca exactamente 2 por nodo y que HAProxy distribuye las peticiones entre las cuatro. No ejecutar el YAML incompleto sobre el clúster actual.

## Corrección de auditoría

La primera consulta de reservas de memoria de las cinco API devolvió `ERROR=INSPECCION_*` porque el formato Go accedía a `Resources.Limits.MemoryBytes` aunque el objeto `Resources` puede no estar definido. Se corrigió el script para analizar JSON, presentar `NO_DEFINIDO` y evitar el falso error. En la primera auditoría los servicios estaban `Running` y los tres nodos `Ready`.

La revisión adicional de Ubuntu1 está en [auditar-ubuntu1.sh](auditar-ubuntu1.sh). **No escalar antes de leer el consumo real de Ubuntu1.**

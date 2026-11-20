# Vagrant y tres máquinas virtuales — por completar

La infraestructura activa tiene **tres nodos**: Ubuntu1 (`192.168.100.2`), Ubuntu2 (`192.168.100.3`) y Ubuntu3 (`192.168.100.4`). La configuración Vagrant exacta aún no se ha recuperado para este repositorio. No se incluye un `Vagrantfile` inventado, ya que la distribución de CPUs, RAM, discos, reenvío de puertos y aprovisionamiento debe corresponder al equipo de ejecución real.

## Material pendiente

1. Copia revisada del `/vagrant/Vagrantfile` vigente, sin rutas ni contraseñas sensibles.
2. Scripts de instalación Docker y Swarm por nodo, si existen.
3. Instalación, redes privadas y rutas de comunicación que sobrevivan a reinicio.
4. Instrucciones para montar los directorios compartidos de Spark y del informe JSON.
5. Verificación `vagrant validate` y un procedimiento reproducible desde cero.

**No reiniciar las VMs ni modificar Netplan para preparar esta documentación antes de la entrega.**

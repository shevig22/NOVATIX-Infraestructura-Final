# Infraestructura NOVATIX — Vagrantfile original

Este directorio contiene el **Vagrantfile real** del entorno auditado de NOVATIX (tres máquinas VirtualBox con `bento/ubuntu-22.04`), comparado con el archivo `/vagrant/Vagrantfile` del nodo `servidorUbuntu2`.

- SHA-256 del archivo fuente: `bd205309847738fdfe6ec66246409880f50077dbc17fe54edf03dccad87fc182`.
- Comprobación estática Ruby: `Syntax OK`; no se hizo `vagrant validate` en el anfitrión.
- Archivo conservado sin cambiar su comportamiento, con finales de línea originales.
- No se encontraron contraseñas ni tokens explícitos.

## Máquinas virtuales

| VM | IP privada | vCPU | RAM | SSH anfitrión | Función |
|---|---|---:|---:|---:|---|
| servidorUbuntu1 | `192.168.100.2` | 2 | 4096 MB | 2201→22 | Worker Swarm, cinco APIs, Spark Worker 1 |
| servidorUbuntu2 | `192.168.100.3` | 4 | 8192 MB | 2202→22 | Manager Swarm, cinco APIs, HAProxy, dashboard y Spark Master/Worker 2 |
| servidorUbuntu3 | `192.168.100.4` | 2 | 6144 MB | 2203→22 | Cinco MySQL persistentes |

**Total:** 8 vCPU y 18 GB de RAM. Cada VM habilita `--natdnsproxy1 on`. Hay instrucciones de provisión shell `run: "always"` que ejecutan `ip route replace ... dev eth1` para rutas IPv4 entre nodos.

## Validación no destructiva

En un equipo con Vagrant instalado, desde este directorio:

```bash
vagrant validate
```

No se ejecutó `vagrant up`, `reload` ni `provision` al revisar este archivo.

## Alcance y precauciones

1. Este archivo crea/configura las VMs, **pero no instala** Docker, Swarm, MySQL, HAProxy ni Spark; faltan instrucciones de aprovisionamiento de esos programas.
2. La box `bento/ubuntu-22.04` requiere disponibilidad y la instalación necesita Vagrant y VirtualBox.
3. Las tres VMs tienen `vm.box_download_insecure = true`, lo que omite verificaciones TLS durante la descarga de la box. **No se recomienda para nuevas instalaciones seguras**. Se conserva únicamente para reflejar la configuración real.
4. Las rutas `ip route replace` asumen `eth1` como interfaz privada. Verificar dispositivos y red `192.168.100.0/24` en otros anfitriones.
5. `vagrant-vbguest` es opcional; si existe, el archivo deshabilita sus actualizaciones automáticas.
6. El `Vagrantfile` no constituye por sí solo una reproducción completa del proyecto: faltan scripts de instalación, manifiestos validados y esquemas MySQL.

**No ejecutar `vagrant provision` ni reiniciar las VMs existentes solamente para documentar el proyecto.**

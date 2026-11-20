# NOVATIX — Reconstrucción guiada en laboratorio nuevo

> **Estado:** receta técnica preparada a partir de la arquitectura real auditada. **No ha sido ejecutada de principio a fin en un clúster vacío**. No sustituye el inventario Docker real ni un instalador automático. **No ejecutar sobre el clúster NOVATIX que ya funciona**. Las contraseñas, tokens de Swarm y variables reales NO se publican.

## 0. Requisitos y topología

Equipo anfitrión con VirtualBox, Vagrant y recursos para **8 vCPU y 18 GiB RAM**. Descargar este repositorio nuevo. El archivo [Vagrantfile](../infraestructura/Vagrantfile) crea **Ubuntu1** `192.168.100.2` (2 vCPU, 4 GiB), **Ubuntu2** `192.168.100.3` (4 vCPU, 8 GiB) y **Ubuntu3** `192.168.100.4` (2 vCPU, 6 GiB). Verificar que la red privada `192.168.100.0/24` no entre en conflicto con otra interfaz. El Vagrantfile usa una opción insegura de descarga de box: revisar antes de reproducirlo.

## 1. Crear las máquinas (solo en laboratorio nuevo)

En el anfitrión, en una carpeta que contenga la copia del Vagrantfile:

```bash
vagrant validate
vagrant up
vagrant status
vagrant ssh servidorUbuntu2
```

El Vagrantfile **no instala Docker ni Spark**. Instalar esos componentes en cada VM con paquetes apropiados y verificar compatibilidad; esta secuencia para **Ubuntu 22.04** ilustra paquetes de Ubuntu, no garantiza exactamente la versión de Docker usada por el equipo:

```bash
sudo apt-get update
sudo apt-get install -y docker.io
sudo systemctl enable --now docker
sudo docker version
```

Instalar en las tres VM (Ubuntu1, Ubuntu2, Ubuntu3); confirmar conectividad entre `.2`, `.3`, `.4`. No colocar credenciales en comandos públicos.

## 2. Crear Docker Swarm y etiquetar roles

En Ubuntu2:

```bash
sudo docker swarm init --advertise-addr 192.168.100.3
sudo docker swarm join-token worker
```

Ejecutar **solo** el comando join que muestre el manager, desde Ubuntu1 y Ubuntu3. El token es un secreto; no publicarlo. De vuelta en Ubuntu2:

```bash
sudo docker node ls
sudo docker node update --label-add novatix.role=aplicaciones servidorUbuntu1
sudo docker node update --label-add novatix.role=aplicaciones servidorUbuntu2
sudo docker node update --label-add novatix.role=datos servidorUbuntu3
sudo docker network create --driver overlay --attachable --subnet 10.77.0.0/24 novatix_stack_novatix_net_new
sudo docker network inspect novatix_stack_novatix_net_new
```

Las cinco API tienen ubicación restringida a aplicaciones; las cinco bases se fijan a Ubuntu3. La red Swarm overlay requiere conectividad entre nodos, incluidos los puertos de control/overlay según la documentación oficial de Docker.

## 3. Preparar el almacenamiento y las cinco MySQL

Consultar [esquemas](../mysql/README.md), [plantilla de Swarm](../docker-swarm/stack.novatix.template.yml) e [inventario auditado](../docker-swarm/inventario-activo-sanitizado.json). Los volúmenes locales persistentes se alojan en **Ubuntu3**; al reconstruir crear previamente las ubicaciones/volúmenes con sus nombres definitivos, y confirmar el contexto de Docker en Ubuntu3. La plantilla usa cinco servicios MySQL 8.0 de **una réplica** cada uno.

En un entorno nuevo, crear **credenciales privadas** y bases según esquemas: Usuarios, Equipos, Partidos, Apuestas, Dinero. Revisar los nombres de las variables de [`variables.example`](../docker-swarm/variables.example). La plantilla no incluye valores reales de passwords/usuarios, imports, secretos o todas las instrucciones originales del contenedor. **No ejecutar el `docker stack deploy` hasta completar y validar esas dependencias en un clúster de pruebas sin datos existentes.**

## 4. Desplegar y verificar las API y HAProxy

La [plantilla](../docker-swarm/stack.novatix.template.yml) muestra las imágenes fijadas por digest, red externa, ubicación de MySQL y **4 réplicas por cada API, máximo 2 por nodo**. La configuración de HAProxy V4 está en [`haproxy/haproxy-4-replicas.candidate.cfg`](../haproxy/haproxy-4-replicas.candidate.cfg).

El orden recomendado para una implementación *nueva*, una vez completados secretos, volúmenes y variables, es: MySQL → esquemas y datos de pruebas → API → HAProxy. No hemos probado la plantilla como instalador integral; la sección de Docker Swarm explica limitaciones. Verificar en Ubuntu2:

```bash
sudo docker node ls
sudo docker service ls
sudo docker service ps novatix_stack_usuarios
sudo docker service ps novatix_stack_db-usuarios
curl -fsS http://192.168.100.3:8080/api/usuarios
curl -fsS http://192.168.100.3:8080/api/equipos/1
curl -fsS http://192.168.100.3:8080/api/partidos/1
curl -fsS http://192.168.100.3:8080/api/apuestas/usuario/0
curl -fsS http://192.168.100.3:8080/api/dinero
```

Esperado con los datos de prueba apropiados: API 4/4, diez instancias en cada nodo de aplicaciones, cinco MySQL 1/1 en Ubuntu3 y HAProxy 1/1. Los puertos **3000–3004 son internos**; para el cliente de pruebas siempre se usó el puerto **8080**.

## 5. Preparar los datos, ejecutar Spark y publicar el dashboard

Descargar el dataset abierto de [Kaggle Transfermarkt](https://www.kaggle.com/datasets/davidcariboo/player-scores). Los archivos de origen (*games, clubs, competitions*, etc.) **no son directamente** los cinco CSV de NOVATIX. El equipo transformó equipos/partidos y añadió apuestas, usuarios y movimientos simulados. Falta el **script histórico de generación** y su semilla. No afirmar que el repositorio actual permite recrear exactamente esos 130.324 registros descargando solamente Kaggle.

Si se dispone de los cinco CSV de proyecto, usar [`datos/preparar_csv_spark.py`](../datos/preparar_csv_spark.py) para generar una copia minimizada y consultar [manifest y hashes](../datos/manifest-csv-v2.json). Spark lee `/datos/*.csv` y escribe `/resultados/reporte_novatix_v2.json`. Los servicios Spark Master y Workers emplearon la imagen `spark:3.5.9-python3`; la guía [Spark](../spark/README.md) y el ejecutor [`ejecutar-v2-novatix.sh`](../spark/ejecutar-v2-novatix.sh) describen la tarea `spark-submit`. **La automatización de instalación de Master/Workers no está incorporada**, y exige que esas rutas bind existan en cada nodo que ejecute tareas.

El [dashboard](../dashboard/README.md) utiliza un servicio Node.js sobre JSON del batch, expuesto en Ubuntu2:`8090`. No realiza consultas MySQL en vivo. Verificar:

```bash
curl -fsS http://192.168.100.3:8090/api/health
curl -fsS http://192.168.100.3:8090/api/spark/v2
```

## 6. Validación y limitaciones

Realizar la prueba de balanceo de cuatro réplicas por servicio y registrar las respuestas `X-Replica`/stats HAProxy. Los ensayos históricos están en [`pruebas/`](../pruebas/). El ensayo limpio 1→2 réplicas logró **720/720 HTTP 200** y el estrés JMeter exploratorio de 10 vs 20 acumuló ~21 % de errores. No atribuir esos fallos al servidor sin sus códigos y JTL.

**Faltantes identificados:** generador histórico de datos sintéticos, transformación exacta de Kaggle, datos de prueba redistribuibles y verificados, automatización integral de Spark y volúmenes, valores de entorno protegidos, importadores de MySQL validados, campaña JMeter no gráfica repetida. Hasta completarlos, esta guía es un **paso a paso orientativo** y el repositorio sigue siendo parcialmente reproducible.

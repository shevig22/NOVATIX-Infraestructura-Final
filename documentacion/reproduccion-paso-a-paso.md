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
sudo docker network create --driver overlay --subnet 10.77.0.0/24 novatix_stack_novatix_net_new
sudo docker network inspect novatix_stack_novatix_net_new
```

**Nota:** la red original fue verificada como **no attachable**. Por eso el comando anterior no agrega `--attachable`; las pruebas con contenedores independientes deben usar otra red y no presuponer que pueden unirse directamente a la overlay original. En un despliegue nuevo, revisar el ciclo de vida de la red externa antes de usar la plantilla.

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

Los cinco CSV preparados ya están en [`datos/`](../datos/README.md), y se pueden validar con `python3 datos/verificar_csv.py`. Una vez descargados, montar esa carpeta en `/datos` dentro del contenedor Spark o copiarlos a `/vagrant/novatix_spark_datos/` en un laboratorio nuevo. Si se dispone de CSV transaccionales de origen adicionales, usar [`datos/preparar_csv_spark.py`](../datos/preparar_csv_spark.py) para generar una copia minimizada y consultar [manifest y hashes](../datos/manifest-csv-v2.json). Spark lee `/datos/*.csv` y escribe `/resultados/reporte_novatix_v2.json`. Los servicios Spark Master y Workers emplearon la imagen `spark:3.5.9-python3`; la guía [Spark](../spark/README.md) y el ejecutor [`ejecutar-v2-novatix.sh`](../spark/ejecutar-v2-novatix.sh) describen la tarea `spark-submit`. **La automatización de instalación de Master/Workers no está incorporada**, y exige que esas rutas bind existan en cada nodo que ejecute tareas.

El [dashboard](../dashboard/README.md) utiliza un servicio Node.js sobre JSON del batch, expuesto en Ubuntu2:`8090`. No realiza consultas MySQL en vivo. Verificar:

```bash
curl -fsS http://192.168.100.3:8090/api/health
curl -fsS http://192.168.100.3:8090/api/spark/v2
```

## 6. Publicar el frontend Apache de NOVATIX (fuentes originales ya versionadas)

**Actualización tras recibir el respaldo de Ubuntu1:** los siete archivos de `/var/www/html2` están publicados **sin modificaciones** en [`frontend/`](../frontend/README.md). Sus objetos Git se contrastaron con los siete archivos del respaldo del 20/11/2026 y coincidieron exactamente. El frontend contiene login, apuestas, panel administrativo y la integración visual de Spark.

En el entorno original, Ubuntu1 ejecuta Apache y sirve la aplicación desde `/var/www/html2`. En un **laboratorio nuevo y aislado**, después de clonar el repositorio, se puede preparar el contenido estático:

```bash
sudo apt-get update
sudo apt-get install -y apache2
sudo a2enmod proxy proxy_http
sudo install -d -m 0755 /var/www/html2
sudo cp frontend/index.html frontend/app.js frontend/estilos.css \
  frontend/spark-integracion.js frontend/spark-dashboard.html \
  frontend/spark-dashboard-app.js frontend/spark-dashboard-styles.css /var/www/html2/
sudo apache2ctl configtest
```

**Fase de configuración pendiente de validación:** existe un [VirtualHost MODELO para laboratorio nuevo](../frontend/apache/novatix-laboratorio.conf) basado en el mapa HAProxy V4. **No se extrajo del Apache original ni fue probado en instalación limpia**. Las rutas `/usuarios`, `/partidos`, `/equipos`, `/apuestas` y `/dinero` deben pasar a `192.168.100.3:8080`, conservando su prefijo, porque HAProxy lo reescribe antes de llegar a cada API.

En un entorno **nuevo y aislado**, luego de revisar el archivo MODELO y adaptar `ServerName`, IP y permisos, habilitarlo:

```bash
sudo cp frontend/apache/novatix-laboratorio.conf /etc/apache2/sites-available/novatix-laboratorio.conf
sudo a2ensite novatix-laboratorio
sudo apache2ctl configtest
```

**Solo si** devuelve `Syntax OK`, y después de verificar que el VirtualHost correcto prevalece sobre el sitio por defecto, recargar Apache con `sudo systemctl reload apache2`. Si el sitio por defecto interfiere, revisar `apache2ctl -S`; no deshabilitar sitios sin comprobar los requisitos de esa VM.

En Ubuntu1 se implementó una optimización de emergencia: el botón **«Ver primeros 20 partidos»** solicita `?page=1&limit=20` y limita a 20 tarjetas la representación. **La API original desplegada todavía puede descargar todos los registros**, porque el backend paginado nuevo no está desplegado. El formulario administrativo de equipos también puede consultar el listado completo bajo demanda.

Tras configurar el VirtualHost y los servicios, verificar desde un navegador login, saldo, consulta de partidos, operaciones académicas con datos simulados y errores de consola. **Un HTTP 200 del HTML no certifica funcionalidad de las API.** No ejecutar estos pasos sobre Ubuntu1 original solo para evaluar la guía.

## 7. Paginación de las API Partidos y Equipos (fuentes publicadas, despliegue pendiente)

El 20/11/2026 se modificaron **seis archivos** en un clon de Ubuntu2 (commit local `a2dbe75`). Se recibió el parche original y se aplicó con validación de los cambios de cada línea. Las fuentes **ya están disponibles al clonar `main`** desde el [commit `593e8213`](https://github.com/shevig22/NOVATIX-Infraestructura-Final/commit/593e8213d0ef85551dd084822211f2928165fc56). **Esto no significa que las imágenes se hayan desplegado en las réplicas activas**.

Los cambios previstos conservan las rutas anteriores sin parámetros y añaden:

| Solicitud | Respuesta esperada con backend nuevo |
|---|---|
| `GET /api/partidos?page=1&limit=20` | Objeto `{items, page, limit, hasMore}`; SQL con límite y desplazamiento |
| `GET /api/equipos?page=1&limit=20` | Objeto `{items, page, limit, hasMore}` |
| `GET /api/equipos?page=1&limit=20&q=nombre` | Equipos que coinciden con el prefijo buscado |
| `GET /api/partidos` o `GET /api/equipos` | Arreglo anterior, **sin paginación**, por compatibilidad |

**Validación pendiente en un laboratorio nuevo**, ahora que el código está publicado: confirmar `node --check`, instalar dependencias desde el `package-lock` versionado, construir imágenes locales con etiquetas **nuevas**, consultar MySQL con datos de prueba, verificar primera y última página, parámetros inválidos, compatibilidad sin parámetros y búsqueda por prefijo. No sustituir imágenes del Swarm activo con una versión sin pruebas ni plan de reversión.

Las imágenes `novatix-partidos:paginacion-r7-local` y `novatix-equipos:paginacion-r7-local` fueron construidas únicamente en Ubuntu2 y sus pruebas aisladas usaron datos simulados, **no MySQL real**. Un clon nuevo de GitHub no recibe esas imágenes locales y la plantilla de Swarm conserva las versiones desplegadas históricas.

## 8. Incorporar el dashboard Spark al panel administrativo (fuentes publicadas, configuración pendiente)

La interfaz está publicada en [`frontend/`](../frontend/README.md) con los archivos exactos del respaldo de Ubuntu1:

| Archivo versionado | Propósito |
|---|---|
| [`frontend/index.html`](../frontend/index.html) | Tarjeta «Analítica Spark» con iframe |
| [`frontend/spark-integracion.js`](../frontend/spark-integracion.js) | Apertura bajo demanda; comprobación **solo del lado del cliente** |
| [`frontend/spark-dashboard.html`](../frontend/spark-dashboard.html) | Página HTML adaptada |
| [`frontend/spark-dashboard-app.js`](../frontend/spark-dashboard-app.js) | Consulta el JSON mediante `/novatix-spark-api/v2` |
| [`frontend/spark-dashboard-styles.css`](../frontend/spark-dashboard-styles.css) | Estilos del dashboard |
| [`frontend/apache/novatix-spark-proxy.conf`](../frontend/apache/novatix-spark-proxy.conf) | Configuración de **ejemplo** del proxy Apache al servicio en Ubuntu2:8090 |

En una VM de **laboratorio nueva**, con Apache ya preparado (apartado 6), adaptar la IP y habilitar la configuración de proxy, después de revisar sus restricciones:

```bash
sudo cp frontend/apache/novatix-spark-proxy.conf /etc/apache2/conf-available/novatix-spark-proxy.conf
sudo a2enconf novatix-spark-proxy
sudo apache2ctl configtest
```

**Solo si** `configtest` devuelve `Syntax OK`, recargar Apache en la VM de laboratorio. El archivo de proxy se ha publicado como **ejemplo** basado en S2; todavía no se ha validado un despliegue completo desde cero.

Verificaciones desde la VM nueva una vez instalado todo:

```bash
curl -sS -o /dev/null -w 'HTML=%{http_code}\n' http://127.0.0.1/spark-dashboard.html
curl -sS -o /dev/null -w 'JS=%{http_code}\n' http://127.0.0.1/spark-dashboard-app.js
curl -sS -o /dev/null -w 'CSS=%{http_code}\n' http://127.0.0.1/spark-dashboard-styles.css
curl -sS -o /dev/null -w 'API=%{http_code}\n' http://127.0.0.1/novatix-spark-api/v2
```

**Criterio de aceptación:** cuatro respuestas HTTP 200 **y** que el dashboard muestre indicadores reales del JSON cuando se abre desde el panel. S2 obtuvo cuatro HTTP 200 en Ubuntu1 original, pero **no prueba una instalación limpia ni autoriza acceso seguro por rol**.

**Seguridad pendiente:** ocultar la tarjeta con `usuarioActual.rol` o `localStorage` **no protege la API**. Para una publicación fuera de una red cerrada hay que implementar autorización verificable en servidor, limitar `Ubuntu2:8090`, corregir las cuentas y el registro de administradores, y proteger el transporte/credenciales. No exponer este laboratorio a Internet.

## 9. Validación y limitaciones

### Verificar los materiales descargados con un solo comando

Desde la raíz del repositorio clonado:

```bash
python3 pruebas/comprobar-entrega.py
```

El script solo lee archivos: comprueba la presencia de las fuentes/versiones publicadas y ejecuta la verificación de integridad y relaciones de los cinco CSV. También identifica el frontend de Ubuntu1 que aún no se ha versionado. **No sustituye** una instalación con Vagrant, Swarm, Spark y Apache ni certifica que estén funcionando.


Realizar la prueba de balanceo de cuatro réplicas por servicio y registrar las respuestas `X-Replica`/stats HAProxy. Los ensayos históricos están en [`pruebas/`](../pruebas/). El ensayo limpio 1→2 réplicas logró **720/720 HTTP 200** y el estrés JMeter exploratorio de 10 vs 20 acumuló ~21 % de errores. No atribuir esos fallos al servidor sin sus códigos y JTL.

### Matriz de comprobación para una entrega académica

| Parte | Material versionado | ¿Repetible desde un clon limpio? | Evidencia exigible |
|---|---|---|---|
| Vagrant / topología | `infraestructura/Vagrantfile` | **Parcial**: crea VMs, no instala toda la pila | `vagrant validate`, `vagrant status`, IP de los tres nodos |
| Swarm / HAProxy | Plantilla + archivo candidato | **No demostrado de extremo a extremo** | servicios 4/4, MySQL 1/1, balanceo entre nodos |
| Datos / Spark V2 | Cinco CSV + script + manifiesto | **Sí para verificación de CSV; parcial para Spark distribuido** | verificador sin errores; job Complete; 11 secciones del JSON |
| Dashboard Spark independiente | Código y Dockerfile del servicio | **Parcial**: empaquetado disponible, no validado en instalación nueva | contenedor de pruebas, `/api/health`, indicadores visibles |
| Frontend NOVATIX | **7 fuentes originales y VirtualHost MODELO publicados** | **Parcial**: el modelo de Apache aún no está probado en VM nueva | Apache, login y consulta funcional |
| Integración Spark en frontend | **Fuentes adaptadas y proxy de ejemplo publicados** | **Parcial**: requiere Apache + servicio Spark y autorización | panel abre dashboard, proxy retorna datos, autorización validada |
| API paginada nueva | **6 archivos publicados en `main` (`593e8213`)** | **Parcial**: fuente disponible; no desplegada ni probada contra MySQL real | construcción de imagen, MySQL real, pruebas de páginas |
| Rendimiento JMeter | Tablas/resúmenes | **No completamente**: faltan planes y resultados crudos | JMX, JTL, mismo escenario, tasa de error documentada |

**Faltantes principales:** validación del VirtualHost modelo y reconstrucción de la aplicación, generación histórica y transformación exacta de Kaggle, carga transaccional de MySQL, automatización de Swarm/Spark/volúmenes, credenciales seguras, VirtualHost transaccional completo y autorización del dashboard, despliegue y validación real de paginación, pruebas de navegador y repetición de JMeter con JMX/JTL.

**Conclusión:** esta guía permite seguir la arquitectura por etapas y verificar los componentes que cuentan con materiales. **No certifica una instalación integral desde cero.** Para cumplir un requisito estricto de reproducción total, el equipo debe completar y probar las etapas marcadas «No» antes de afirmar que cualquier tercero puede instalar NOVATIX usando únicamente este repositorio.

Consulta los [avances fechados](avances-frontend-spark-paginacion-2026-11-20.md) y la [auditoría de reproducibilidad](auditoria-reproducibilidad-2026-11-20.md).

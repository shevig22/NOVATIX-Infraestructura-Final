# Prueba de carga HTTP — lectura segura

[`carga_segura.py`](carga_segura.py) es un probador pequeño basado exclusivamente en Python 3. **No modifica Docker Swarm ni ninguna base de datos**. Solo consulta el endpoint individual `GET /api/equipos/1` mediante HAProxy en `192.168.100.3:8080`. Este endpoint existe en `microservicios/equipos/src/controllers/equiposController.js` y lee un solo equipo.

## Primera medición: mantener 2 réplicas y NO escalar

En `servidorUbuntu2`, después de descargar el script publicado a una ruta temporal o sincronizar el repositorio:

```bash
python3 pruebas/carga_segura.py --concurrencias 1,10,25 --solicitudes 120 --salida /vagrant/novatix_carga_$(date +%Y%m%d_%H%M%S).json
```

El parámetro `--salida` requiere una ruta nueva dentro de `/vagrant`. Si la carpeta de GitHub está en otra ubicación, ajustar la ruta `pruebas/carga_segura.py`. **No se asume que el repositorio se encuentre instalado en `/vagrant`.**

Mide RPS, latencia media, percentil 95, máximo, errores HTTP, fallas de red y distribución del encabezado `X-Replica`. Límites programados: 25 hilos, 300 solicitudes por escenario, máximo cuatro escenarios. Si aparecen errores, se detienen los siguientes escenarios. No registra cuerpos de respuesta ni datos de usuarios.

## Interpretación y método

- Ejecutar desde Ubuntu2 (cliente y balanceador comparten VM); indicar esta limitación de medición.
- Comparación de concurrencias **con dos réplicas activas**; no equivale a comparar 1 vs 2 réplicas.
- El número de peticiones no es lo mismo que cantidad de usuarios reales. El p95 se calcula sobre la duración de cada petición, incluido errores si existen.
- No publicar los números RPS/p95 hasta ejecutar la prueba y conservar su JSON.
- Comparar 1 vs 2 réplicas solo como ensayo posterior controlado y reversible; no hacerlo antes de validar el estado del clúster.

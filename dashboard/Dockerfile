# Reutiliza la imagen del dashboard de pruebas que ya existe en Ubuntu2.
# No descarga dependencias, no reconfigura Docker Swarm y no consulta MySQL.
FROM novatix-dashboard:1.2.0
WORKDIR /app
COPY server-v2.js /app/server-v2.js
COPY public /app/public-v2
ENV NODE_ENV=production PORT=8080 NOVATIX_REPORTE=/resultados/reporte_novatix_v2.json
EXPOSE 8080
CMD ["node", "/app/server-v2.js"]

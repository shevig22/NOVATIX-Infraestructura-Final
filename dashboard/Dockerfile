FROM node:22-alpine

ENV NODE_ENV=production
ENV PORT=8080
ENV NOVATIX_REPORTE=/resultados/reporte_novatix_v2.json

WORKDIR /app

COPY server-v2.js /app/server-v2.js
COPY public /app/public-v2

EXPOSE 8080

CMD ["node", "/app/server-v2.js"]

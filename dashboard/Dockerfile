# NOVATIX Spark V2: frontend y API Node en imagen portable
FROM node:22-alpine
LABEL org.opencontainers.image.title="NOVATIX Spark Analytics V2"
WORKDIR /app
COPY --chown=node:node server-v2.js /app/server-v2.js
COPY --chown=node:node public/ /app/public-v2/
ENV NODE_ENV=production PORT=8080 NOVATIX_REPORTE=/resultados/reporte_novatix_v2.json
USER node
EXPOSE 8080
HEALTHCHECK --interval=30s --timeout=4s --start-period=10s --retries=3 CMD node -e "const http=require('node:http');const r=http.get('http://127.0.0.1:8080/api/health',s=>{s.resume();process.exit(s.statusCode===200?0:1)});r.on('error',()=>process.exit(1));r.setTimeout(3000,()=>r.destroy())"
CMD ["node", "/app/server-v2.js"]

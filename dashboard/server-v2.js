'use strict';
/* NOVATIX Spark V2 · API de agregados de solo lectura.
   No usa MySQL, credenciales, dependencias npm ni servicios externos. */
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const url = require('node:url');

const PORT = Number(process.env.PORT || 8080);
const REPORT = process.env.NOVATIX_REPORTE || '/resultados/reporte_novatix_v2.json';
const STATIC = path.join(__dirname, 'public-v2');
const sections = ['top_equipos', 'ligas', 'apuestas_por_resultado', 'apuestas_mensuales',
  'movimientos_por_tipo', 'movimientos_mensuales', 'usuarios_registrados_mensuales',
  'desenlaces_partidos', 'partidos_mensuales', 'distribucion_goles', 'distribucion_cuotas'];
const mime = {'/':'text/html; charset=utf-8','/index.html':'text/html; charset=utf-8',
  '/styles.css':'text/css; charset=utf-8','/app.js':'application/javascript; charset=utf-8'};

function readReport() {
  const stat = fs.statSync(REPORT);
  if (!stat.isFile() || stat.size < 250 || stat.size > 15*1024*1024) throw new Error('REPORTE_INVALIDO');
  const data = JSON.parse(fs.readFileSync(REPORT, 'utf8'));
  if (!data || data.version !== 'spark-v2' || typeof data.totales !== 'object' ||
      sections.some(name => !Array.isArray(data[name]))) throw new Error('ESQUEMA_INCOMPLETO');
  return {data, bytes: stat.size, mtime: stat.mtime.toISOString()};
}
function headers(type) {
  return {'Content-Type':type,'Cache-Control':'no-store','X-Content-Type-Options':'nosniff',
    'Referrer-Policy':'no-referrer', 'X-Frame-Options':'DENY',
    'Content-Security-Policy':"default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; connect-src 'self'; font-src 'self'; object-src 'none'; frame-ancestors 'none'; base-uri 'none'"};
}
function json(res, code, body, method='GET') {
  res.writeHead(code, headers('application/json; charset=utf-8'));
  res.end(method === 'HEAD' ? undefined : JSON.stringify(body));
}
const server = http.createServer((req, res) => {
  const method = req.method || 'GET';
  if (method !== 'GET' && method !== 'HEAD') return json(res,405,{ok:false,error:'METODO_NO_ADMITIDO'},method);
  let pathname;
  try { pathname = new url.URL(req.url, 'http://localhost').pathname; }
  catch { return json(res,400,{ok:false,error:'RUTA_INVALIDA'},method); }

  if (pathname === '/api/health' || pathname === '/api/spark/v2' || pathname === '/api/spark/reporte' || pathname === '/api/dashboard') {
    try {
      const {data,bytes,mtime} = readReport();
      if (pathname === '/api/health') {
        return json(res,200,{ok:true,service:'novatix-dashboard-spark-v2',version:'2.0.0',
          source:'5 CSV sinteticos',report_version:data.version,report_generated_at:data.fecha_utc,
          report_bytes:bytes,report_file_updated_at:mtime,sections:sections.length},method);
      }
      if (pathname === '/api/spark/reporte') {
        return json(res,200,{ok:true,fuente:'Apache Spark · 5 CSV sintéticos',reporte:data},method);
      }
      if (pathname === '/api/dashboard') {
        // Compatibilidad básica: se incluyen agregados y los nombres de colección anteriores.
        const topTeams = data.top_equipos.map(x=>({name:Number(x.eq_id)===0?'Empate':x.nombre,pais:x.pais,liga:x.liga,
          apuestas:x.apuestas,volumen:x.volumen_apostado,pagado:x.pago_teorico,
          balance:x.balance_teorico,cuota:x.cuota_promedio}));
        const leagues = data.ligas.map(x=>({pais:x.pais,liga:x.liga,partidos:x.partidos,
          goles:x.promedio_goles,cuotaLocal:x.cuota_local_promedio,
          cuotaVisitante:x.cuota_visitante_promedio,probLocal:x.probabilidad_local_implicita_pct}));
        const trends = data.desenlaces_partidos.map(x=>({name:x.desenlace,value:x.partidos,
          cuotaLocal:x.cuota_local_media,cuotaVisitante:x.cuota_visitante_media}));
        return json(res,200,{ok:true,version:'spark-v2',updatedAt:data.fecha_utc,
          source:'Apache Spark · CSV sintéticos',totals:data.totales,
          topTeams,leagues,trends,
          availableLeagues:[...new Set(data.ligas.map(x=>x.liga).filter(Boolean))],
          report:data},method);
      }
      return json(res,200,{ok:true,source:'Apache Spark 3.5.9 / CSV sinteticos',report:data},method);
    } catch(err) {
      console.error('SPARK_V2_REPORT_ERROR:',err.code || err.message);
      return json(res,503,{ok:false,error:'REPORTE_V2_NO_DISPONIBLE'},method);
    }
  }
  if (!Object.hasOwn(mime,pathname)) return json(res,404,{ok:false,error:'RUTA_NO_ENCONTRADA'},method);
  const file = path.join(STATIC, pathname === '/' ? 'index.html' : pathname.slice(1));
  fs.readFile(file, (err, content) => {
    if (err) return json(res,500,{ok:false,error:'ASSET_NO_DISPONIBLE'},method);
    res.writeHead(200, headers(mime[pathname]));
    res.end(method === 'HEAD' ? undefined : content);
  });
});
server.requestTimeout = 12000;
server.headersTimeout = 9000;
server.listen(PORT, '0.0.0.0', () => console.log('NOVATIX_SPARK_V2_DASHBOARD_LISTO puerto=' + PORT));
process.on('SIGTERM', () => server.close());
process.on('SIGINT', () => server.close());

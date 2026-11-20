const express = require('express');
const router = express.Router();
const modelo = require('../models/apuestasModel');

const DINERO_URL   = process.env.DINERO_URL   || 'http://dinero:3003';
const PARTIDOS_URL = process.env.PARTIDOS_URL || 'http://partidos:3002';

async function pedirJSON(url, opciones = {}) {
  const r = await fetch(url, {
    ...opciones,
    headers: { 'Content-Type': 'application/json' },
    signal: AbortSignal.timeout(5000)
  });
  const texto = await r.text();
  let datos = null;
  try { datos = texto ? JSON.parse(texto) : null; } catch (e) { /* no JSON */ }
  return { ok: r.ok, status: r.status, datos };
}

function movimiento(id_usuario, tipo, monto) {
  return pedirJSON(`${DINERO_URL}/api/movimiento`, {
    method: 'POST',
    body: JSON.stringify({ id_usuario, tipo, monto })
  });
}

router.get('/api/apuestas', async (req, res) => {
  try { res.json(await modelo.obtenerApuestas()); }
  catch (e) {
    console.error('Error al listar apuestas:', e.message);
    res.status(500).json({ error: 'No se pudieron consultar las apuestas' });
  }
});

router.get('/api/apuestas/usuario/:id', async (req, res) => {
  try { res.json(await modelo.obtenerApuestasPorUsuario(Number(req.params.id))); }
  catch (e) {
    console.error('Error al listar apuestas del usuario:', e.message);
    res.status(500).json({ error: 'No se pudieron consultar tus apuestas' });
  }
});

router.post('/api/apuestas', async (req, res) => {
  const user_id = Number(req.body.user_id);
  const part_id = Number(req.body.part_id);
  const tipo = req.body.tipo;
  const monto = Number(req.body.dinero_apostado);

  if (!user_id || !part_id || !['local', 'empate', 'visitante'].includes(tipo)) {
    return res.status(400).json({ error: 'Datos de la apuesta incompletos' });
  }
  if (!Number.isFinite(monto) || monto < 1000) {
    return res.status(400).json({ error: 'La apuesta mínima es $1.000' });
  }

  // 1. Leer el partido real (la cuota la pone el servidor, no el navegador)
  let partido;
  try {
    const r = await pedirJSON(`${PARTIDOS_URL}/api/partidos/${part_id}`);
    partido = Array.isArray(r.datos) ? r.datos[0] : r.datos;
    if (!r.ok || !partido || !partido.id) return res.status(404).json({ error: 'El partido no existe' });
  } catch (e) {
    console.error('Partidos no responde:', e.message);
    return res.status(503).json({ error: 'El servicio de partidos no responde' });
  }
  if (partido.estado && partido.estado !== 'programado') {
    return res.status(400).json({ error: 'Este partido ya no acepta apuestas' });
  }

  const cuota = Number(tipo === 'local' ? partido.cuota_local
                     : tipo === 'visitante' ? partido.cuota_visitante
                     : partido.cuota_empate);
  const equipo_id = tipo === 'local' ? Number(partido.id_equipo_local)
                  : tipo === 'visitante' ? Number(partido.id_equipo_visitante)
                  : 0;
  if (!cuota) return res.status(500).json({ error: 'El partido no tiene cuota para esa opción' });

  // 2. Descontar el saldo
  try {
    const r = await movimiento(user_id, 'apuesta', monto);
    if (!r.ok) {
      return res.status(r.status === 400 ? 400 : 502)
                .json({ error: (r.datos && r.datos.error) || 'No se pudo descontar el saldo' });
    }
  } catch (e) {
    console.error('Dinero no responde:', e.message);
    return res.status(503).json({ error: 'El servicio de dinero no responde' });
  }

  // 3. Guardar la apuesta (si falla, se devuelve el dinero)
  try {
    const [info] = await modelo.crearApuesta(user_id, part_id, equipo_id, monto, cuota);
    res.status(201).json({ mensaje: 'Apuesta realizada', id: info.insertId, cuota, ganancia_posible: monto * cuota });
  } catch (e) {
    console.error('Error al guardar apuesta, reembolsando:', e.message);
    try { await movimiento(user_id, 'reembolso', monto); }
    catch (e2) { console.error('REEMBOLSO FALLIDO user', user_id, 'monto', monto, e2.message); }
    res.status(500).json({ error: 'No se pudo registrar la apuesta; el dinero fue devuelto' });
  }
});

module.exports = router;

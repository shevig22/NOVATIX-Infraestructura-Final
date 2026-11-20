const express = require('express');
const router = express.Router();
const modelo = require('../Model/DineroModels');

const TIPOS_INTERNOS = ['apuesta', 'reembolso', 'ganancia'];

function responderError(res, e, contexto) {
  console.error(contexto + ':', e.message);
  const esNegocio = e.message === 'Saldo insuficiente';
  res.status(esNegocio ? 400 : 500).json({ error: esNegocio ? e.message : 'Error interno en dinero' });
}

router.get('/api/dinero', (req, res) => res.json({ status: 'ok', service: 'dinero' }));

router.get('/api/saldo/:id', async (req, res) => {
  try { res.json(await modelo.obtenerSaldo(Number(req.params.id))); }
  catch (e) { responderError(res, e, 'Error al obtener saldo'); }
});

router.get('/api/transacciones/:id', async (req, res) => {
  try { res.json(await modelo.obtenerTransacciones(Number(req.params.id))); }
  catch (e) { responderError(res, e, 'Error al obtener transacciones'); }
});

router.post('/api/recargar', async (req, res) => {
  const id = Number(req.body.id_usuario);
  const monto = Number(req.body.monto);
  if (!id || !Number.isFinite(monto)) return res.status(400).json({ error: 'id_usuario y monto son obligatorios' });
  if (monto < 1000) return res.status(400).json({ error: 'El monto mínimo es $1.000' });
  try {
    const r = await modelo.registrarTransaccion(id, 'deposito', monto);
    res.json({ mensaje: 'Recarga exitosa', ...r });
  } catch (e) { responderError(res, e, 'Error al recargar'); }
});

// Uso interno: el servicio de apuestas descuenta o reembolsa por aquí
router.post('/api/movimiento', async (req, res) => {
  const id = Number(req.body.id_usuario);
  const monto = Number(req.body.monto);
  const tipo = req.body.tipo;
  if (!id || !Number.isFinite(monto) || monto <= 0 || !TIPOS_INTERNOS.includes(tipo)) {
    return res.status(400).json({ error: 'Movimiento inválido' });
  }
  try { res.json(await modelo.registrarTransaccion(id, tipo, monto)); }
  catch (e) { responderError(res, e, 'Error en movimiento ' + tipo); }
});

module.exports = router;

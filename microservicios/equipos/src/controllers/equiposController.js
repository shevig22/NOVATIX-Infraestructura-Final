const { Router } = require('express'); 
const router = Router(); 
const equiposModel = require('../models/equiposModel'); 
 
router.get('/api/equipos', async (req, res) => {
  try {
    if (req.query.page === undefined &&
        req.query.limit === undefined &&
        req.query.q === undefined) {
      return res.json(await equiposModel.obtenerEquipos());
    }

    const page = Number(req.query.page === undefined ? 1 : req.query.page);
    const limit = Number(req.query.limit === undefined ? 20 : req.query.limit);
    const q = String(req.query.q === undefined ? '' : req.query.q).trim();

    if (!Number.isSafeInteger(page) || page < 1 ||
        !Number.isSafeInteger(limit) || limit < 1 || limit > 100 ||
        !Number.isSafeInteger((page - 1) * limit) ||
        q.length > 80) {
      return res.status(400).json({ error: 'Consulta invalida' });
    }

    const filas = await equiposModel.obtenerEquiposPaginados(
      limit + 1, (page - 1) * limit, q
    );

    return res.json({
      items: filas.slice(0, limit),
      page,
      limit,
      hasMore: filas.length > limit
    });
  } catch (error) {
    console.error('Error al consultar equipos:', error);
    res.status(500).json({ error: 'Error consultando equipos' });
  }
});

router.get('/api/equipos/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const equipo = await equiposModel.obtenerEquipoPorId(id);
    if (!equipo) {
      return res.status(404).json({ error: "Equipo no encontrado" });
    }
    res.status(200).json(equipo);
  } catch (error) {
    console.error("Error al obtener equipo por ID:", error);
    res.status(500).json({ error: "Error del servidor al obtener equipo" });
  }
});
 
router.post('/api/equipos', async (req, res) => {
  try {
    const { nombre, pais, liga, escudo, estado } = req.body;
    await equiposModel.crearEquipo(nombre, pais, liga, escudo, estado);
    res.status(201).json({ mensaje: "Equipo creado con éxito" });
  } catch (error) {
    console.error("Error al insertar equipo:", error);
    res.status(500).json({ error: "Error del servidor al insertar equipo" });
  }
});
 
router.put('/api/equipos/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { nombre, pais, liga, escudo, estado } = req.body;
    await equiposModel.editarEquipo(id, nombre, pais, liga, escudo, estado);
    res.status(200).json({ mensaje: "Equipo actualizado con éxito" });
  } catch (error) {
    console.error("Error al actualizar equipo:", error);
    res.status(500).json({ error: "Error del servidor al actualizar equipo" });
  }
});

router.delete('/api/equipos/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await equiposModel.eliminarEquipo(id);
    res.status(200).json({ mensaje: "Equipo eliminado con éxito" });
  } catch (error) {
    console.error("Error al eliminar equipo:", error);
    res.status(500).json({ error: "Error del servidor al eliminar equipo" });
  }
});

module.exports = router;
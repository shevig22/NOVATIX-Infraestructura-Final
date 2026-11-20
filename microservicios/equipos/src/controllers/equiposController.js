const { Router } = require('express'); 
const router = Router(); 
const equiposModel = require('../models/equiposModel'); 
 
router.get('/api/equipos', async (req, res) => {
  try {
    const equipos = await equiposModel.obtenerEquipos();
    res.status(200).json(equipos);
  } catch (error) {
    console.error("Error al obtener equipos:", error);
    res.status(500).json({ error: "Error del servidor al obtener los equipos" });
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
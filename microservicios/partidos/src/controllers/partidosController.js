const { Router } = require('express'); 
const router = Router(); 
const axios = require('axios');
const partidosModel = require('../models/partidosModel'); 


async function verificarUsuarioAdmin(id_usuario) {
    try {
        const respuesta = await axios.get(`http://usuarios:3001/api/usuarios/${id_usuario}`);
        const usuario = respuesta.data;
        
        if (!usuario || usuario.rol !== 'admin') {
            return { esAdmin: false, error: "Acceso denegado: Se requieren permisos de administrador" };
        }
        return { esAdmin: true, error: null };
    } catch (error) {
        if (error.response && error.response.status === 404) {
            return { esAdmin: false, error: `El usuario con ID ${id_usuario} no existe` };
        }
        return { esAdmin: false, error: "No se pudo conectar con el microservicio de Usuarios" };
    }
}


async function obtenerEquipoEspecifico(id_equipo) {
    try {
        const respuesta = await axios.get(`http://equipos:3004/api/equipos/${id_equipo}`);
        return { existe: true, datos: respuesta.data, error: null };
    } catch (error) {
        if (error.response && error.response.status === 404) {
            return { existe: false, datos: null, error: `El equipo con ID ${id_equipo} no existe` };
        }
        return { existe: false, datos: null, error: `No se pudo verificar el equipo con ID ${id_equipo}` };
    }
}

router.get('/api/partidos', async (req, res) => {
  try {
    const partidos = await partidosModel.obtenerPartidos();
    res.status(200).json(partidos);
  } catch (error) {
    console.error("Error al obtener partidos:", error);
    res.status(500).json({ error: "Error del servidor al obtener los partidos" });
  }
});

router.get('/api/partidos/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const partido = await partidosModel.obtenerPartidoPorId(id);
    if (!partido) {
      return res.status(404).json({ error: "Partido no encontrado" });
    }
    res.status(200).json(partido);
  } catch (error) {
    console.error("Error al obtener partido por ID:", error);
    res.status(500).json({ error: "Error del servidor al obtener partido" });
  }
});

router.post('/api/partidos', async (req, res) => {
  try {
    const { 
      id_usuario, 
      id_equipo_local, 
      id_equipo_visitante, 
      fecha_partido, 
      cuota_local, 
      cuota_empate, 
      cuota_visitante, 
      goles_local, 
      goles_visitante, 
      estado 
    } = req.body;

    if (!id_usuario) {
        return res.status(400).json({ error: "El id_usuario es obligatorio" });
    }

    const checkUser = await verificarUsuarioAdmin(id_usuario);
    if (!checkUser.esAdmin) {
        return res.status(403).json({ error: checkUser.error });
    }

    const checkLocal = await obtenerEquipoEspecifico(id_equipo_local);
    if (!checkLocal.existe) {
        return res.status(404).json({ error: checkLocal.error });
    }

    const checkVisitante = await obtenerEquipoEspecifico(id_equipo_visitante);
    if (!checkVisitante.existe) {
        return res.status(404).json({ error: checkVisitante.error });
    }

    await partidosModel.crearPartido(
      id_equipo_local, 
      id_equipo_visitante, 
      checkLocal.datos.nombre, 
      checkVisitante.datos.nombre, 
      checkLocal.datos.escudo, 
      checkVisitante.datos.escudo, 
      fecha_partido, 
      cuota_local, 
      cuota_empate, 
      cuota_visitante, 
      goles_local || 0, 
      goles_visitante || 0, 
      estado || 'programado'
    );

    res.status(201).json({ mensaje: "Partido creado con éxito" });

  } catch (error) {
    console.error("Error al insertar partido:", error);
    res.status(500).json({ error: "Error del servidor al insertar partido" });
  }
});

router.put('/api/partidos/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { 
      id_usuario, 
      id_equipo_local, 
      id_equipo_visitante, 
      fecha_partido, 
      cuota_local, 
      cuota_empate, 
      cuota_visitante, 
      goles_local, 
      goles_visitante, 
      estado 
    } = req.body;

    if (!id_usuario) {
        return res.status(400).json({ error: "El id_usuario es obligatorio" });
    }

    const checkUser = await verificarUsuarioAdmin(id_usuario);
    if (!checkUser.esAdmin) {
        return res.status(403).json({ error: checkUser.error });
    }

    const checkLocal = await obtenerEquipoEspecifico(id_equipo_local);
    if (!checkLocal.existe) {
        return res.status(404).json({ error: checkLocal.error });
    }

    const checkVisitante = await obtenerEquipoEspecifico(id_equipo_visitante);
    if (!checkVisitante.existe) {
        return res.status(404).json({ error: checkVisitante.error });
    }

    await partidosModel.editarPartido(
      id, 
      id_equipo_local, 
      id_equipo_visitante, 
      checkLocal.datos.nombre, 
      checkVisitante.datos.nombre, 
      checkLocal.datos.escudo, 
      checkVisitante.datos.escudo, 
      fecha_partido, 
      cuota_local, 
      cuota_empate, 
      cuota_visitante, 
      goles_local, 
      goles_visitante, 
      estado
    );

    res.status(200).json({ mensaje: "Partido actualizado con éxito" });

  } catch (error) {
    console.error("Error al actualizar partido:", error);
    res.status(500).json({ error: "Error del servidor al actualizar partido" });
  }
});

router.delete('/api/partidos/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { id_usuario } = req.body;

    if (!id_usuario) {
        return res.status(400).json({ error: "El id_usuario es obligatorio para eliminar" });
    }

    const checkUser = await verificarUsuarioAdmin(id_usuario);
    if (!checkUser.esAdmin) {
        return res.status(403).json({ error: checkUser.error });
    }

    await partidosModel.eliminarPartido(id);
    res.status(200).json({ mensaje: "Partido eliminado con éxito" });
  } catch (error) {
    console.error("Error al eliminar partido:", error);
    res.status(500).json({ error: "Error del servidor al eliminar partido" });
  }
});

module.exports = router;

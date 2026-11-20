const { Router } = require('express');
const router = Router();
const usuariosModel = require('../Models/Usuariosmodels');


router.get('/api/usuarios', async (req, res) => {
    try {
        const usuarios = await usuariosModel.obtenerUsuarios();
        res.status(200).json(usuarios);
    } catch (error) {
        console.error("Error al obtener usuarios:", error);
        res.status(500).json({ error: error.message });
    }
});


router.get('/api/usuarios/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const usuario = await usuariosModel.obtenerUsuarioPorId(id);


        if (!usuario) {
            return res.status(404).json({ 
                valido: false, 
                error: `El usuario con ID ${id} no existe en el sistema` 
            });
        }


        if (usuario.estado !== 'activo') {
            return res.status(400).json({ 
                valido: false, 
                error: `El usuario ${usuario.usuario} está inactivo o bloqueado` 
            });
        }


        res.status(200).json({ 
            valido: true, 
            id: usuario.id,
            nombre: usuario.nombre,
            email: usuario.email,
            usuario: usuario.usuario,
            rol: usuario.rol || 'cliente',
            usuarioData: usuario 
        });

    } catch (error) {
        console.error("Error al verificar usuario:", error);
        res.status(500).json({ error: error.message });
    }
});


router.post('/api/usuarios', async (req, res) => {
    try {
        const { nombre, email, usuario, password, rol } = req.body;
        

        if (!nombre || !email || !usuario || !password) {
            return res.status(400).json({ error: "Faltan datos obligatorios (nombre, email, usuario, password)" });
        }

        const usuarioExistente = await usuariosModel.buscarUsuarioPorEmailOUsuario(email, usuario);
        if (usuarioExistente) {
            return res.status(400).json({ error: "El correo o el nombre de usuario ya se encuentran registrados" });
        }

        const nuevoUsuario = await usuariosModel.crearUsuario(nombre, email, usuario, password, rol || 'cliente');
        res.status(201).json({ mensaje: "Usuario registrado con éxito", usuario: nuevoUsuario });

    } catch (error) {
        console.error("Error al crear usuario:", error);
        res.status(500).json({ error: error.message });
    }
});

router.post('/api/login', async (req, res) => {
    try {
        const { usuario, password } = req.body;

        if (!usuario || !password) {
            return res.status(400).json({
                error: "Debes ingresar usuario y contraseña"
            });
        }

        const usuarioEncontrado = await usuariosModel.buscarUsuarioPorEmailOUsuario(
            usuario,
            usuario
        );

        if (!usuarioEncontrado) {
            return res.status(401).json({
                error: "Usuario o contraseña incorrectos"
            });
        }

        if (usuarioEncontrado.estado !== 'activo') {
            return res.status(400).json({
                error: "El usuario está inactivo o bloqueado"
            });
        }

        if (usuarioEncontrado.password !== password) {
            return res.status(401).json({
                error: "Usuario o contraseña incorrectos"
            });
        }

        res.status(200).json({
            mensaje: "Inicio de sesión exitoso",
            valido: true,
            usuario: {
                id: usuarioEncontrado.id,
                nombre: usuarioEncontrado.nombre,
                email: usuarioEncontrado.email,
                usuario: usuarioEncontrado.usuario,
                rol: usuarioEncontrado.rol || 'cliente'
            }
        });

    } catch (error) {
        console.error("Error en login:", error);

        res.status(500).json({
            error: error.message
        });
    }
});

module.exports = router;

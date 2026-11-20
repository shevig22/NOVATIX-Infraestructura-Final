const mysql = require('mysql2/promise');

const pool = mysql.createPool({ enableKeepAlive: true, keepAliveInitialDelay: 10000,
    host: process.env.DB_HOST || 'db-usuarios',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || 'mysql',
    database: process.env.DB_NAME || 'usuarios_casino'
});


async function obtenerUsuarios() {
    const [rows] = await pool.query('SELECT id, nombre, email, usuario, estado, fecha_registro FROM usuarios');
    return rows;
}


async function obtenerUsuarioPorId(id) {
    const [rows] = await pool.query('SELECT id, nombre, email, usuario, estado, rol FROM usuarios WHERE id = ?', [id]);
    return rows[0] || null;
}


async function buscarUsuarioPorEmailOUsuario(email, usuario) {
    const [rows] = await pool.query('SELECT * FROM usuarios WHERE email = ? OR usuario = ?', [email, usuario]);
    return rows[0] || null;
}


async function crearUsuario(nombre, email, usuario, password, rol) {
    const [result] = await pool.query(
        `INSERT INTO usuarios 
        (nombre, email, usuario, password, fecha_registro, estado, rol)
        VALUES (?, ?, ?, ?, NOW(), 'activo', ?)`,
        [nombre, email, usuario, password, rol]
    );

    return {
        id: result.insertId,
        nombre,
        email,
        usuario,
        rol,
        estado: 'activo'
    };
}

module.exports = { 
    obtenerUsuarios, 
    obtenerUsuarioPorId, 
    buscarUsuarioPorEmailOUsuario, 
    crearUsuario 
};

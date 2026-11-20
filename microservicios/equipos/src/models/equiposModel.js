const mysql = require('mysql2/promise'); 
 
const connection = mysql.createPool({ enableKeepAlive: true, keepAliveInitialDelay: 10000, 
    host: process.env.DB_HOST || 'db-equipos', 
    user: process.env.DB_USER || 'root', 
    password: process.env.DB_PASSWORD || 'mysql', 
    database: process.env.DB_NAME || 'equipos_db' 
}); 
 
async function obtenerEquipos() { 
    const result = await connection.query('SELECT * FROM equipos'); 
    return result[0]; 
} 

async function obtenerEquipoPorId(id) {
    const result = await connection.query(
        'SELECT * FROM equipos WHERE id = ?',
        [id]
    );
    return result[0][0];
}

async function crearEquipo(nombre, pais, liga, escudo, estado) { 
    const result = await connection.query('INSERT INTO equipos VALUES(null,?,?,?,?,?)', [nombre, pais, liga, escudo, estado]); 
    return result; 
} 

async function editarEquipo(id, nombre, pais, liga, escudo, estado) {
    const result = await connection.query(
        'UPDATE equipos SET nombre = ?, pais = ?, liga = ?, escudo = ? WHERE id = ?',
        [nombre, pais, liga, escudo, estado, id]
    );
    return result;
}

async function eliminarEquipo(id) {
    const result = await connection.query(
        'DELETE FROM equipos WHERE id = ?',
        [id]
    );
    return result;
}

module.exports = { 
    obtenerEquipos, 
    obtenerEquipoPorId,
    crearEquipo,
    editarEquipo,
    eliminarEquipo
};

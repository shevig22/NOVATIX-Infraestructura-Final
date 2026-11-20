const mysql = require('mysql2/promise'); 
 
const connection = mysql.createPool({ enableKeepAlive: true, keepAliveInitialDelay: 10000, 
    host: process.env.DB_HOST || 'db-apuestas', 
    user: process.env.DB_USER || 'root', 
    password: process.env.DB_PASSWORD || 'mysql', 
    database: process.env.DB_NAME || 'apuestas_db' 
}); 
 
async function obtenerApuestas() { 
    const result = await connection.query('SELECT * FROM apuestas'); 
    return result[0]; 
} 

async function obtenerApuestaPorId(id) {
    const result = await connection.query(
        'SELECT * FROM apuestas WHERE id = ?',
        [id]
    );
    return result[0][0]; // devuelve solo el primer producto
}

async function crearApuesta(user_id, part_id, equipo_id, dinero_apostado, cuota) { 
    const result = await connection.query(
        'INSERT INTO apuestas (user_id, part_id, equipo_id, dinero_apostado, cuota) VALUES (?, ?, ?, ?, ?)',
        [user_id, part_id, equipo_id, dinero_apostado, cuota]
    ); 
    
    return result; 
}

async function editarApuesta(id, user_id, part_id, equipo_id, dinero_apostado, cuota) {
    const result = await connection.query(
        'UPDATE apuestas SET user_id = ?, part_id = ?, equipo_id = ?, dinero_apostado = ?, cuota = ? WHERE id = ?',
        [user_id, part_id, equipo_id, dinero_apostado, cuota, id]
    );

    return result;
}

async function eliminarApuesta(id) {
    const result = await connection.query(
        'DELETE FROM apuestas WHERE id = ?',
        [id]
    );
    return result;
}

module.exports = { 
    obtenerApuestas, 
    obtenerApuestaPorId,
    crearApuesta,
    editarApuesta,
    eliminarApuesta
}; 
 

module.exports.obtenerApuestasPorUsuario = async function (user_id) {
    const [rows] = await connection.query(
        'SELECT * FROM apuestas WHERE user_id = ? ORDER BY id DESC',
        [user_id]
    );
    return rows;
};

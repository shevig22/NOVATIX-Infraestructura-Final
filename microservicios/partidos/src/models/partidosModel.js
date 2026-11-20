const mysql = require('mysql2/promise'); 
 
const connection = mysql.createPool({ enableKeepAlive: true, keepAliveInitialDelay: 10000, 
    host: process.env.DB_HOST || 'db-partidos', 
    user: process.env.DB_USER || 'root', 
    password: process.env.DB_PASSWORD || 'mysql', 
    database: process.env.DB_NAME || 'partidos_db' 
}); 
 
async function obtenerPartidos() { 
    const result = await connection.query('SELECT * FROM partidos'); 
    return result[0]; 
} 

async function obtenerPartidoPorId(id) {
    const result = await connection.query(
        'SELECT * FROM partidos WHERE id = ?',
        [id]
    );
    return result[0][0];
}

async function crearPartido(id_equipo_local, id_equipo_visitante, equipo_local_nombre, equipo_visitante_nombre, escudo_local, escudo_visitante, fecha_partido, cuota_local, cuota_empate, cuota_visitante, goles_local, goles_visitante, estado) { 
    const result = await connection.query(
        'INSERT INTO partidos VALUES(null,?,?,?,?,?,?,?,?,?,?,?,?,?)', 
        [id_equipo_local, id_equipo_visitante, equipo_local_nombre, equipo_visitante_nombre, escudo_local, escudo_visitante, fecha_partido, cuota_local, cuota_empate, cuota_visitante, goles_local, goles_visitante, estado]
    ); 
    return result; 
} 

async function editarPartido(id, id_equipo_local, id_equipo_visitante, equipo_local_nombre, equipo_visitante_nombre, escudo_local, escudo_visitante, fecha_partido, cuota_local, cuota_empate, cuota_visitante, goles_local, goles_visitante, estado) {
    const result = await connection.query(
        'UPDATE partidos SET id_equipo_local = ?, id_equipo_visitante = ?, equipo_local_nombre = ?, equipo_visitante_nombre = ?, escudo_local = ?, escudo_visitante = ?, fecha_partido = ?, cuota_local = ?, cuota_empate = ?, cuota_visitante = ?, goles_local = ?, goles_visitante = ?, estado = ? WHERE id = ?',
        [id_equipo_local, id_equipo_visitante, equipo_local_nombre, equipo_visitante_nombre, escudo_local, escudo_visitante, fecha_partido, cuota_local, cuota_empate, cuota_visitante, goles_local, goles_visitante, estado, id]
    );
    return result;
}

async function eliminarPartido(id) {
    const result = await connection.query(
        'DELETE FROM partidos WHERE id = ?',
        [id]
    );
    return result;
}

module.exports = { 
    obtenerPartidos, 
    obtenerPartidoPorId,
    crearPartido,
    editarPartido,
    eliminarPartido
};

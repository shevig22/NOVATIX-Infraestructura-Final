const mysql = require('mysql2/promise');

const pool = mysql.createPool({ enableKeepAlive: true, keepAliveInitialDelay: 10000,
    host: process.env.DB_HOST || 'db-dinero',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || 'mysql',
    database: process.env.DB_NAME || 'dinero_db'
});

async function obtenerSaldo(id) {
    const [rows] = await pool.query(
        'SELECT saldo_real, saldo_congelado, saldo_disponible FROM dinero WHERE id_usuario = ? ORDER BY id DESC LIMIT 1',
        [id]
    );
    
    if (rows.length === 0) {
        return { saldo_real: "0.00", saldo_congelado: "0.00", saldo_disponible: "0.00" };
    }
    return rows[0];
}

async function obtenerTransacciones(id) {
    const [rows] = await pool.query(
        'SELECT * FROM dinero WHERE id_usuario = ? ORDER BY id DESC',
        [id]
    );
    return rows;
}

async function registrarTransaccion(id_usuario, tipo, monto) {
    const conn = await pool.getConnection();
    try {
        await conn.beginTransaction();

        const [rows] = await conn.query(
            'SELECT saldo_real, saldo_congelado FROM dinero WHERE id_usuario = ? ORDER BY id DESC LIMIT 1 FOR UPDATE',
            [id_usuario]
        );

        let saldoAntes = 0;
        let saldoCongelado = 0;

        if (rows.length > 0) {
            saldoAntes = Number(rows[0].saldo_real);
            saldoCongelado = Number(rows[0].saldo_congelado);
        }

        const esIngreso = ['deposito', 'ganancia', 'reembolso', 'bono'].includes(tipo);
        const numMonto = Number(monto);
        const saldoDespues = esIngreso ? saldoAntes + numMonto : saldoAntes - numMonto;

        if (saldoDespues < 0) {
            throw new Error('Saldo insuficiente');
        }

        const saldoDisponible = saldoDespues - saldoCongelado;

        await conn.query(
            `INSERT INTO dinero 
            (id_usuario, saldo_real, saldo_congelado, saldo_disponible, tipo, monto, saldo_antes, saldo_despues, estado)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'completada')`,
            [id_usuario, saldoDespues, saldoCongelado, saldoDisponible, tipo, numMonto, saldoAntes, saldoDespues]
        );

        await conn.commit();
        return { saldoAntes, saldoDespues, saldo_disponible: saldoDisponible };
    } catch (error) {
        await conn.rollback();
        throw error;
    } finally {
        conn.release();
    }
}

async function cancelarTransaccion(id_transaccion) {
    const conn = await pool.getConnection();
    try {
        await conn.beginTransaction();

        const [trxRows] = await conn.query(
            'SELECT * FROM dinero WHERE id = ? FOR UPDATE',
            [id_transaccion]
        );
        
        if (trxRows.length === 0) {
            throw new Error('Transacción no encontrada');
        }
        
        const transaccion = trxRows[0];

        if (transaccion.estado === 'revertida') {
            throw new Error('Esta transacción ya fue cancelada');
        }

        const [saldoRows] = await conn.query(
            'SELECT saldo_real, saldo_congelado FROM dinero WHERE id_usuario = ? ORDER BY id DESC LIMIT 1 FOR UPDATE',
            [transaccion.id_usuario]
        );

        const saldoActual = Number(saldoRows[0].saldo_real);
        const saldoCongelado = Number(saldoRows[0].saldo_congelado);
        const montoAnular = Number(transaccion.monto);

        const eraIngreso = ['deposito', 'ganancia', 'reembolso', 'bono'].includes(transaccion.tipo);
        const nuevoSaldo = eraIngreso ? saldoActual - montoAnular : saldoActual + montoAnular;

        if (nuevoSaldo < 0) {
            throw new Error('No se puede cancelar: dejaría el saldo en negativo');
        }
        
        const saldoDisponible = nuevoSaldo - saldoCongelado;

        await conn.query(
            'UPDATE dinero SET estado = ? WHERE id = ?',
            ['revertida', id_transaccion]
        );

        await conn.query(
            `INSERT INTO dinero 
            (id_usuario, saldo_real, saldo_congelado, saldo_disponible, tipo, monto, saldo_antes, saldo_despues, estado)
            VALUES (?, ?, ?, ?, 'cancelacion', ?, ?, ?, 'completada')`,
            [transaccion.id_usuario, nuevoSaldo, saldoCongelado, saldoDisponible, montoAnular, saldoActual, nuevoSaldo]
        );

        await conn.commit();
        return { saldoAntes: saldoActual, saldoDespues: nuevoSaldo };
    } catch (error) {
        await conn.rollback();
        throw error;
    } finally {
        conn.release();
    }
}

module.exports = { obtenerSaldo, obtenerTransacciones, registrarTransaccion, cancelarTransaccion };

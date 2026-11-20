const express = require('express');
const app = express();
const morgan = require('morgan');
const usuariosControllers = require('./Controllers/Usuariocontrollers');

// Permitir peticiones desde el frontend
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header(
        'Access-Control-Allow-Methods',
        'GET, POST, PUT, DELETE, OPTIONS'
    );
    res.header(
        'Access-Control-Allow-Headers',
        'Content-Type'
    );

    if (req.method === 'OPTIONS') {
        return res.sendStatus(200);
    }

    next();
});

// Middleware para entender JSON
app.use(express.json());

// Rutas
app.use(usuariosControllers);
app.use(morgan('dev'));

const PORT = 3001;

app.listen(PORT, () => {
    console.log(`Microservicio de Usuarios corriendo en el puerto ${PORT}`);
});

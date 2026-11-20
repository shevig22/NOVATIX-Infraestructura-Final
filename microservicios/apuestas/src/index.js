const express = require('express');
const morgan = require('morgan');
const cors = require('cors');
const apuestasController = require('./controllers/apuestasController');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(morgan('dev'));
app.use(cors());
app.use(express.json());

app.use(apuestasController);

app.listen(PORT, () => {
  console.log(`Servidor de Apuestas ejecutándose en el puerto ${PORT}`);
});

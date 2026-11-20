const express = require('express');
const morgan = require('morgan');
const cors = require('cors');
const dineroControllers = require('./Controller/DineroControllers');

const app = express();
const PORT = process.env.PORT || 3003;

app.use(morgan('dev'));
app.use(cors());
app.use(express.json());

app.use(dineroControllers);

app.listen(PORT, () => {
  console.log(`Servidor de Dinero ejecutándose en el puerto ${PORT}`);
});

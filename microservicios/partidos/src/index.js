const express = require('express'); 
const partidosController = require('./controllers/partidosController'); 
const morgan = require('morgan'); 
const cors = require('cors'); 
const app = express(); 

app.use(morgan('dev')); 
app.use(cors());
app.use(express.json()); 

app.use(partidosController); 
 
app.listen(3002, () => { 
  console.log('ms-partidos-2 ejecutandose en el puerto 3002'); 
});
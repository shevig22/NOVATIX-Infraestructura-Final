const express = require('express'); 
const equiposController = require('./controllers/equiposController'); 
const morgan = require('morgan'); 
const cors = require('cors'); 
const app = express(); 

app.use(morgan('dev')); 
app.use(cors());
app.use(express.json()); 

app.use(equiposController); 
 
app.listen(3004, () => { 
  console.log('ms-equipos-2 ejecutandose en el puerto 3004'); 
});

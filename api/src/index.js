import express from 'express';

import dotenv from 'dotenv';

//Cargar las variables desde el .env
dotenv.config();

//Iniciar express
const app = express();

//Asignar puerto
const PORT = process.env.PORT || 3000;

//Middleware para JSON
app.use(express.json());


//Endpoint de prueba
app.get('/', (req, res) =>{
    res.json({message:'API funcionando'})
});

//Healthcheck (para kubernetes)
app.get('/healthz', (req,res)=>{res.sendStatus(200)});
app.get('/ready', (req,res)=>{res.sendStatus(200)});

app.listen(PORT, () =>{
    console.log(`API corriendo en http://localhost:${PORT}`)
});
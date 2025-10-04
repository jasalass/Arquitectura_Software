import dotenv from "dotenv";
import express from "express";

//Leer variables de .env
dotenv.config();

//Configurar express
const app = express();

//Asignar puerto
const PORT = process.env.PORT || 5000;

//Middleware para json
app.use(express.json());


//Endpoint prueba
app.get("/", (req, res)=>{res.json({message:"API Inscripción funcionando"})});


//Healthcheck (para kubernetes)
app.get('/healthz', (req,res)=>{res.sendStatus(200)});
app.get('/ready', (req,res)=>{res.sendStatus(200)});

app.listen(PORT, () =>{console.log(`API Inscripción corriendo en http://localhost:${PORT}`)});
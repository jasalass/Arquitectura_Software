import express from 'express';
import dotenv from "dotenv";

//Configuración de dotenv
dotenv.config();

//Iniciar express
const app = express();

//Asignar puerto
const PORT = process.env.PORT || 7000;

//Middleware para JSON
app.use(express.json());

// Middleware para datos tipo application/x-www-form-urlencoded
app.use(express.urlencoded({ extended: true }));

//Endpoint de prueba
app.get('/', (req, res) =>{
    res.json({message:'API Pago funcionando'})
});

// Nuevo endpoint para cambiar estado_inscripcion
app.post('/pago-matricula', (req, res) => {
    const { estado_inscripcion } = req.body;
    // aquí simulas guardar o actualizar el estado
    const nuevoEstado = !!estado_inscripcion;
    res.json({ success: true, estado_inscripcion: nuevoEstado });
});


//Healthcheck (para kubernetes)
app.get('/healthz', (req,res)=>{res.sendStatus(200)});
app.get('/ready', (req,res)=>{res.sendStatus(200)});

app.listen(PORT, () =>{
    console.log(`Pago corriendo en http://localhost:${PORT}`)
});

import dotenv from "dotenv";
import express from "express";
import prisma from "./db.js"


//Leer variables de .env
dotenv.config();

//Configurar express
const app = express();

//Asignar puerto
const PORT = process.env.PORT || 5000;

//Middleware para json
app.use(express.json());

console.log('DB URL presente:', !!process.env.DATABASE_URL);
//Endpoint prueba
app.get('/health', async (req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({ status: 'ok', db: 'connected' });
  } catch (e) {
    console.error(e);
    res.status(500).json({ status: 'error', db: 'disconnected' });
  }
});

// Ejemplo: listar profesores (ajusta al nombre real de tu tabla)
app.get('/profesores', async (req, res) => {
  const data = await prisma.profesor.findMany();
  res.json(data);
});


//Healthcheck (para kubernetes)
app.get('/healthz', (req,res)=>{res.sendStatus(200)});
app.get('/ready', (req,res)=>{res.sendStatus(200)});

app.listen(PORT, () =>{console.log(`API Inscripción corriendo en http://localhost:${PORT}`)});


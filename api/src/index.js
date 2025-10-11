import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import { createProxyMiddleware } from 'http-proxy-middleware';

// Cargar variables de entorno
dotenv.config();

// Inicializar Express
const app = express();
const PORT = process.env.PORT || 3000;

// URLs internas de los microservicios
const AUTH_BASE_URL = process.env.AUTH_BASE_URL || 'http://localhost:4000/auth';
const INSCRIPCION_BASE_URL = process.env.INSCRIPCION_BASE_URL || 'http://localhost:5000';

// --------------------------------------------------------
// 🟢 CONFIGURAR CORS
// --------------------------------------------------------
// Permite llamadas desde los orígenes donde corre tu frontend
// (localhost o 127.0.0.1 en desarrollo)
const allowedOrigins = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(',').map(s => s.trim())
  : ['http://127.0.0.1:5500', 'http://localhost:5500', 'http://localhost:5173'];

app.use(cors({
  origin: allowedOrigins,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type']
}));

// --------------------------------------------------------
// 🔹 INSCRIPCION
// --------------------------------------------------------
app.use('/inscripcion', createProxyMiddleware({
  target: INSCRIPCION_BASE_URL,      // http://localhost:5000
  changeOrigin: true,
  pathRewrite: { '^/inscripcion': '/inscripcion' }, // <— clave
  logLevel: 'debug'                  // útil para ver qué URL está llamando
}));

// --------------------------------------------------------
// Middlewares
// --------------------------------------------------------
app.use(express.json());

// --------------------------------------------------------
// Endpoint de prueba
// --------------------------------------------------------
app.get('/', (_req, res) => {
  res.json({ message: '🟢 API Gateway funcionando correctamente' });
});

// --------------------------------------------------------
// 🔹 AUTH
// --------------------------------------------------------
app.post('/auth', async (req, res) => {
  console.log(req.body)
  try {
    const response = await fetch(AUTH_BASE_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(req.body)
    });

    const data = await response.json();
    res.status(response.status).json(data);
  } catch (error) {
    console.error('Error al contactar Auth:', error);
    res.status(500).json({
      success: false,
      message: 'Error al contactar el servicio de autenticación'
    });
  }
});

app.post('/auth-id', async (req, res) => {
  try {
    let url_auth_id = AUTH_BASE_URL + "-id"
    const response = await fetch(url_auth_id, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(req.body)
    });

    const data = await response.json();
    res.status(response.status).json(data);
  } catch (error) {
    console.error('Error al contactar Auth:', error);
    res.status(500).json({
      success: false,
      message: 'Error al contactar el servicio de autenticación'
    });
  }
});



// --------------------------------------------------------
// 🔹 HEALTH CHECKS
// --------------------------------------------------------
app.get('/healthz', (_req, res) => res.sendStatus(200));
app.get('/ready', (_req, res) => res.sendStatus(200));

// --------------------------------------------------------
// Iniciar servidor
// --------------------------------------------------------
app.listen(PORT, () => {
  console.log(`✅ API corriendo en http://localhost:${PORT}`);
});

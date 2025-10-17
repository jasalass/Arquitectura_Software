import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import { createProxyMiddleware } from 'http-proxy-middleware';

// Cargar variables de entorno
dotenv.config();

// Inicializar Express
const app = express();
const PORT = process.env.PORT || 3000;


// En Docker usa nombres de servicio; en local puedes sobreescribir con .env
const AUTH_BASE_URL        = process.env.AUTH_BASE_URL        || 'http://auth:4000/auth';
const INSCRIPCION_BASE_URL = process.env.INSCRIPCION_BASE_URL || 'http://inscripcion:5000';
const PAGO_BASE_URL        = process.env.PAGO_BASE_URL        || 'http://pago:7000';


// --------------------------------------------------------
// 🟢 CONFIGURAR CORS'
// --------------------------------------------------------
// Permite llamadas desde los orígenes donde corre tu frontend
// (localhost o 127.0.0.1 en desarrollo)
// --- CORS DEV (colocar AL INICIO, antes de rutas/proxy) ---
const allowedOrigins = new Set([
  'http://localhost:4200',
  'http://127.0.0.1:5500',
  'http://localhost:5500',
  'http://localhost:5173',
  'http://localhost:8100',
  'http://localhost:8090'
]);

app.use((req, res, next) => {
  const origin = req.headers.origin;

  // Permite sin Origin (curl/postman) y valida los orígenes del front en dev
  if (!origin || allowedOrigins.has(origin)) {
    if (origin) {
      res.setHeader('Access-Control-Allow-Origin', origin);
      res.setHeader('Vary', 'Origin'); // evita caches mezclados por origen
    }

    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, Accept, X-Requested-With, Origin');


  }

  // Responder preflight y cortar
  if (req.method === 'OPTIONS') return res.sendStatus(204);

  next();
});
// --- fin CORS DEV ---



// --------------------------------------------------------
// 🔹 INSCRIPCION
// --------------------------------------------------------
// ⚠️ Express recorta el prefijo '/inscripcion' → req.url llega como '/health', '/asignaturas', etc.
// Le volvemos a anteponer '/inscripcion' para que el micro reciba '/inscripcion/...'
app.use('/inscripcion', createProxyMiddleware({
  target: INSCRIPCION_BASE_URL,         // ej: http://inscripcion:5000  (¡sin slash final!)
  changeOrigin: true,
  pathRewrite: (path) => `/inscripcion${path}`,  // <- clave
  logLevel: 'debug'
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
  try {
    const r = await fetch(AUTH_BASE_URL, {
      method: 'POST',
      headers: { 'Content-Type':'application/json' },
      body: JSON.stringify(req.body)
    });
    const data = await r.json();
    res.status(r.status).json(data);
  } catch (err) {
    console.error('Auth error:', err);
    res.status(500).json({ success:false, message:'Error al contactar Auth' });
  }
});

app.post('/auth-id', async (req, res) => {
  try {
    const url = AUTH_BASE_URL.replace(/\/$/, '') + '-id'; // concatena -id
    const r = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type':'application/json' },
      body: JSON.stringify(req.body)
    });
    const data = await r.json();
    res.status(r.status).json(data);
  } catch (err) {
    console.error('Auth-id error:', err);
    res.status(500).json({ success:false, message:'Error al contactar Auth' });
  }
});


// --------------------------------------------------------
// 🔹 Llamada directa al microservicio de PAGO (puerto 7000)
// --------------------------------------------------------
app.get('/hola', async (_req, res) => {
  try {
    const response = await fetch('http://localhost:7000/hola', {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    });

    // Parsear respuesta del microservicio
    const data = await response.json();

    // Reenviar la respuesta al cliente que llamó al gateway
    res.status(response.status).json(data);

  } catch (error) {
    console.error('Error al contactar el servicio de pago:', error);
    res.status(500).json({
      success: false,
      message: 'Error al contactar el microservicio de pago'
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

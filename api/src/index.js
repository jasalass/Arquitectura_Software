import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import helmet from 'helmet'; 
import { createProxyMiddleware } from 'http-proxy-middleware';

// Cargar variables de entorno
dotenv.config();

// Inicializar Express
const app = express();
const PORT = process.env.PORT || 3000;

// ==================================================
//  Seguridad HTTP básica
// ==================================================

// Quitar header "X-Powered-By: Express"
app.disable('x-powered-by');

//  Helmet: agrega X-Content-Type-Options, X-Frame-Options, etc.
//   y definimos una CSP sencilla pero suficiente para el examen.
app.use(
  helmet({
    // ya tienes la CSP definida, puedes dejarla como está
    contentSecurityPolicy: {
      useDefaults: false,
      directives: {
        defaultSrc: ["'none'"],
        connectSrc: ["'self'"],
        scriptSrc: ["'none'"],
        styleSrc: ["'none'"],
        imgSrc: ["'none'"],
        fontSrc: ["'none'"],
        objectSrc: ["'none'"],
        mediaSrc: ["'none'"],
        frameSrc: ["'none'"],
        childSrc: ["'none'"],
        frameAncestors: ["'none'"],
        workerSrc: ["'none'"],
        manifestSrc: ["'none'"],
        baseUri: ["'none'"],
        formAction: ["'none'"],
        upgradeInsecureRequests: [],
      },
    },
    noSniff: true,       // 👈 esto ya pide X-Content-Type-Options
    hidePoweredBy: true, // refuerzo por si acaso
  })
);




// ==================================================
//  URLs internas (Docker) de microservicios
// ==================================================
const AUTH_BASE_URL        = (process.env.AUTH_BASE_URL        || 'http://auth:4000/auth').replace(/\/$/, '');
const INSCRIPCION_BASE_URL = (process.env.INSCRIPCION_BASE_URL || 'http://inscripcion:5000').replace(/\/$/, '');
const PAGO_BASE_URL        = (process.env.PAGO_BASE_URL        || 'http://pago:7000').replace(/\/$/, '');

// Logs de arranque para verificar
console.log('🔧 AUTH_BASE_URL        =', AUTH_BASE_URL);
console.log('🔧 INSCRIPCION_BASE_URL =', INSCRIPCION_BASE_URL);
console.log('🔧 PAGO_BASE_URL        =', PAGO_BASE_URL);

// ==================================================
//  CORS
// ==================================================
const rawCorsOrigins = process.env.CORS_ORIGIN || '';
const allowedOrigins = rawCorsOrigins
  .split(',')
  .map(o => o.trim())
  .filter(o => o.length > 0);

console.log('🔧 CORS_ORIGIN =', allowedOrigins);

app.use(cors({
  origin: (origin, callback) => {
    // Permitir Postman, curl, etc. (sin Origin)
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) return callback(null, true);
    return callback(new Error('Origen no permitido por CORS: ' + origin), false);
  },
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'X-Requested-With', 'Origin'],
  credentials: true,
}));

app.use(express.json());

// ==================================================
//  Endpoint raíz
// ==================================================
app.get('/', (_req, res) => {
  res.json({ message: '🟢 API Gateway funcionando correctamente' });
});

// ==================================================
//  🔹 AUTH
// ==================================================
app.post('/auth', async (req, res) => {
  try {
    const r = await fetch(AUTH_BASE_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(req.body),
    });

    const data = await r.json().catch(() => ({}));
    res.status(r.status).json(data);
  } catch (err) {
    console.error('Auth error:', err);
    res.status(500).json({ success: false, message: 'Error al contactar Auth' });
  }
});

app.post('/auth-id', async (req, res) => {
  try {
    const url = `${AUTH_BASE_URL}-id`; // ej: http://auth:4000/auth-id
    const r = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(req.body),
    });

    const data = await r.json().catch(() => ({}));
    res.status(r.status).json(data);
  } catch (err) {
    console.error('Auth-id error:', err);
    res.status(500).json({ success: false, message: 'Error al contactar Auth' });
  }
});

// ==================================================
//  🔹 INSCRIPCION (proxy)
// ==================================================
app.use('/inscripcion', createProxyMiddleware({
  target: INSCRIPCION_BASE_URL,
  changeOrigin: true,
  pathRewrite: {
    '^/inscripcion': '',
  },
  logLevel: 'debug',
}));

// ==================================================
//  🔹 PAGO
// ==================================================
const basePago = PAGO_BASE_URL;  // ej: http://pago:7000

// GET /pago/estado/:uuid
app.get('/pago/estado/:uuid', async (req, res) => {
  try {
    const { uuid } = req.params || {};
    if (!uuid) {
      return res.status(400).json({ success: false, message: 'uuid es requerido' });
    }

    const url = `${basePago}/pago/estado/${uuid}`;
    console.log('➡️  Gateway → Pago (estado):', url);

    const r = await fetch(url);
    const text = await r.text();
    let data;
    try { data = JSON.parse(text); } catch { data = { raw: text }; }

    console.log('⬅️  Pago → Gateway status:', r.status, 'respuesta:', data);
    return res.status(r.status).json(data);
  } catch (err) {
    console.error('❌ Error en /pago/estado desde gateway:', err);
    return res.status(500).json({
      success: false,
      message: 'Error al contactar el servicio de pago desde el gateway',
    });
  }
});

// POST /pago/pagar-matricula
app.post('/pago/pagar-matricula', async (req, res) => {
  try {
    const url = `${basePago}/pago/pagar-matricula`;
    console.log('➡️  Gateway → Pago (pagar-matricula):', url, 'body:', req.body);

    const r = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(req.body),
    });

    const text = await r.text();
    let data;
    try { data = JSON.parse(text); } catch { data = { raw: text }; }

    console.log('⬅️  Pago → Gateway status:', r.status, 'respuesta:', data);
    return res.status(r.status).json(data);
  } catch (err) {
    console.error('❌ Error en /pago/pagar-matricula desde gateway:', err);
    return res.status(500).json({
      success: false,
      message: 'Error al contactar el servicio de pago desde el gateway',
    });
  }
});

// ==================================================
//  Health checks del gateway
// ==================================================
app.get('/healthz', (_req, res) => res.sendStatus(200));
app.get('/ready',   (_req, res) => res.sendStatus(200));

// ==================================================
//  Iniciar servidor
// ==================================================
app.listen(PORT, () => {
  console.log(`✅ API Gateway corriendo en http://localhost:${PORT}`);
});

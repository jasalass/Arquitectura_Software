import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import { createProxyMiddleware } from 'http-proxy-middleware';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;
const AUTH_BASE_URL = process.env.AUTH_BASE_URL;           // ej: http://auth:4000/auth  (endpoint real de tu AUTH)
const INSCRIPCION_BASE_URL = process.env.INSCRIPCION_BASE_URL || 'http://inscripcion:5000';

if (!AUTH_BASE_URL) {
  // Falla temprano si falta env crítica
  console.error('Falta AUTH_BASE_URL en .env');
  process.exit(1);
}

// CORS (ajusta orígenes con coma)
const allowed = process.env.CORS_ORIGIN?.split(',').map(s => s.trim()) ?? true;
app.use(cors({ origin: allowed }));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Ping
app.get('/', (_req, res) => res.json({ message: 'API funcionando' }));
app.get('/healthz', (_req, res) => res.sendStatus(200));
app.get('/ready',   (_req, res) => res.sendStatus(200));

// ---------- AUTH (fetch con timeout + propagación básica de headers) ----------
app.post(['/auth', '/auth/login'], async (req, res) => {
  try {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 8000); // 8s timeout

    // Propaga un correlador si viene del front
    const xreq = req.headers['x-request-id'] || cryptoRandom();

    const response = await fetch(AUTH_BASE_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-request-id': xreq,
      },
      body: JSON.stringify(req.body),
      signal: ctrl.signal
    });
    clearTimeout(t);

    // Si la respuesta no es JSON, intenta texto plano para no reventar
    const contentType = response.headers.get('content-type') || '';
    let payload;
    if (contentType.includes('application/json')) {
      payload = await response.json();
    } else {
      payload = { message: await response.text() };
    }

    // Reenvía status + cuerpo tal cual
    return res.status(response.status).json(payload);

  } catch (err) {
    const isAbort = err?.name === 'AbortError';
    console.error('Error en /auth:', err);
    return res.status(502).json({
      success: false,
      message: isAbort
        ? 'Auth no responde (timeout)'
        : 'Error al contactar al servicio de autenticación'
    });
  }
});

// ---------- INSCRIPCION (proxy transparente) ----------
app.use('/inscripcion', createProxyMiddleware({
  target: INSCRIPCION_BASE_URL,        // ej: http://inscripcion:5000
  changeOrigin: true,
  // quita el prefijo /inscripcion para que el servicio lo reciba "tal cual"
  pathRewrite: { '^/inscripcion': '' },
  onProxyReq(proxyReq, req) {
    // Propaga correlación si existe
    const xreq = req.headers['x-request-id'] || cryptoRandom();
    proxyReq.setHeader('x-request-id', xreq);
  }
}));

app.listen(PORT, () => {
  console.log(`API corriendo en http://localhost:${PORT}`);
});

// util simple
function cryptoRandom() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

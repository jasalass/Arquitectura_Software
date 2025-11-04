import express from 'express';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 7000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ─────────────────────────────────────────────────────────────
// Estado financiero "demo" por UUID (sin DB, en memoria)
// Alineado con tu micro de AUTH actual:
//  - UUID1 (Juana)  => PAGADA
//  - UUID2 (Carlos) => PENDIENTE
// ─────────────────────────────────────────────────────────────
const ESTADOS = new Map([
  ['7b7b5c3a-7f3a-4b1f-9d73-2f10f1b9a100', 'PAGADA'],
  ['11111111-1111-1111-1111-111111111111', 'PENDIENTE'],
]);

// Utilidad para respuesta estándar
const estadoDto = (uuid) => ({
  alumno_ref: uuid,
  estado_matricula: ESTADOS.get(uuid) ?? 'PENDIENTE'
});

// ─────────────────────────────────────────────────────────────
// Endpoint base
// ─────────────────────────────────────────────────────────────
app.get('/', (_req, res) => {
  res.json({ message: 'API Pago funcionando' });
});

// ─────────────────────────────────────────────────────────────
// GET /pago/estado/:uuid  → consulta estado actual
// ─────────────────────────────────────────────────────────────
app.get('/pago/estado/:uuid', (req, res) => {
  const { uuid } = req.params || {};
  if (!uuid) return res.status(400).json({ success:false, message:'uuid es requerido' });
  return res.json({ success:true, ...estadoDto(uuid) });
});

// ─────────────────────────────────────────────────────────────
// POST /pago/pagar-matricula { uuid } → marca PAGADA (idempotente)
// ─────────────────────────────────────────────────────────────
app.post('/pago/pagar-matricula', (req, res) => {
  const { uuid } = req.body || {};
  if (!uuid) return res.status(400).json({ success:false, message:'uuid es requerido' });

  const actual = ESTADOS.get(uuid) ?? 'PENDIENTE';
  if (actual === 'PAGADA') {
    return res.status(200).json({ success:true, message:'Matrícula ya estaba pagada', ...estadoDto(uuid) });
  }

  ESTADOS.set(uuid, 'PAGADA');
  return res.status(200).json({ success:true, message:'Matrícula pagada', ...estadoDto(uuid) });
});

// Healthchecks
app.get('/healthz', (_req,res)=>res.sendStatus(200));
app.get('/ready',   (_req,res)=>res.sendStatus(200));

app.listen(PORT, () => {
  console.log(`Pago corriendo en http://localhost:${PORT}`);
});

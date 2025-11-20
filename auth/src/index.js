// auth/src/index.js
import express from "express";
import dotenv from "dotenv";
// ─────────────────────────────────────────────────────────────────────────────
// Config
// ─────────────────────────────────────────────────────────────────────────────
dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;


app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ─────────────────────────────────────────────────────────────────────────────
// Demo store (en memoria): usuarios por email y por uuid
// ─────────────────────────────────────────────────────────────────────────────
const DEMO_USERS = [
  {
    uuid: "7b7b5c3a-7f3a-4b1f-9d73-2f10f1b9a100",        // <- usa el UUID CORREGIDO (12 hex al final)
    email: "user@email.com",
    password: "12345",                                   // solo en demo
    nombre: "Juana",
    apellido: "Pérez",
    rut: "12.345.678-9",
    roles: ["ALUMNO"],
    permisos: ["inscribir", "pagar", "ver-estado"],
    carrera: "Ingeniería Informática",
    plan: "Plan 2022",
    semestre_actual: 3,
    avatar_url: "https://i.pravatar.cc/150?img=5",
    ultimo_acceso: new Date().toISOString(),
    estado_matricula: "PAGADA",                          // "PAGADA" | "PENDIENTE" | "BLOQUEADA"
  },
  {
    uuid: "11111111-1111-1111-1111-111111111111",
    email: "alumno2@demo.cl",
    password: "abc123",
    nombre: "Carlos",
    apellido: "Gómez",
    rut: "9.876.543-2",
    roles: ["ALUMNO"],
    permisos: ["inscribir", "pagar", "ver-estado"],
    carrera: "Administración",
    plan: "Plan 2026",
    semestre_actual: 1,
    avatar_url: "https://i.pravatar.cc/150?img=12",
    ultimo_acceso: new Date().toISOString(),
    estado_matricula: "PENDIENTE",
  },
];

// indexadores rápidos
const byEmail = new Map(DEMO_USERS.map(u => [u.email.toLowerCase(), u]));
const byUUID  = new Map(DEMO_USERS.map(u => [u.uuid, u]));

// util: crea payload estándar para frontend
function demoTokenFor(user) {
  // En producción emitirías un JWT. Aquí es un token de demo.
  return `demo.${Buffer.from(user.uuid).toString("base64url")}.token`;
}
function toFrontendPayload(user) {
  return {
    success: true,
    message: "OK",
    token: demoTokenFor(user),
    expiresIn: 60 * 60, // 1h (demo)
    user: {
      uuid: user.uuid,
      email: user.email,
      nombre: user.nombre,
      apellido: user.apellido,
      rut: user.rut,
      roles: user.roles,
      permisos: user.permisos,
      carrera: user.carrera,
      plan: user.plan,
      semestre_actual: user.semestre_actual,
      avatar_url: user.avatar_url,
      ultimo_acceso: user.ultimo_acceso,
      estado_matricula: user.estado_matricula,
    },
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Endpoints
// ─────────────────────────────────────────────────────────────────────────────

// Ping
app.get("/", (_req, res) => {
  res.json({ message: "API AUTH funcionando" });
});

// Auth por email+password
app.post("/auth", (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) {
    return res.status(400).json({ success: false, message: "email y password son requeridos" });
  }

  const u = byEmail.get(String(email).toLowerCase());
  if (!u || u.password !== password) {
    return res.status(401).json({ success: false, message: "Credenciales inválidas" });
  }

  // actualizar último acceso (demo)
  u.ultimo_acceso = new Date().toISOString();
  return res.status(200).json(toFrontendPayload(u));
});

// Resolución por UUID (para flujos donde ya tienes el id)
app.post("/auth-id", (req, res) => {
  const { id, uuid } = req.body || {};
  const key = id || uuid;
  if (!key) {
    return res.status(400).json({ success: false, message: "id (uuid) es requerido" });
  }

  const u = byUUID.get(String(key));
  if (!u) {
    return res.status(404).json({ success: false, message: "Usuario no encontrado" });
  }

  u.ultimo_acceso = new Date().toISOString();
  return res.status(200).json(toFrontendPayload(u));
});



// Healthchecks
app.get("/healthz", (_req, res) => res.sendStatus(200));
app.get("/ready",   (_req, res) => res.sendStatus(200));

// ─────────────────────────────────────────────────────────────────────────────
// Start
// ─────────────────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`Auth corriendo en http://localhost:${PORT}`);
});

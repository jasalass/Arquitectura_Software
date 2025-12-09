// inscripcion/src/index.js
import dotenv from "dotenv";
import express from "express";
import prisma from "./db.js";
import Redis from "ioredis";

// Leer variables de .env
dotenv.config();

// Configurar express
const app = express();

// Asignar puerto
const PORT = process.env.PORT || 5000;

// =====================
//  Redis client
// =====================

const CACHE_KEY = "inscripcion:asignaturas:v1";
const CACHE_TTL_SECONDS = Number(process.env.CACHE_TTL_SECONDS || "60");

const redis = new Redis({
  host: process.env.REDIS_HOST || "redis",      // nombre del Service en K8s
  port: Number(process.env.REDIS_PORT) || 6379,
});

redis.on("connect", () => {
  console.log("Redis conectado correctamente");
});

redis.on("error", (err) => {
  console.error("Error en Redis:", err.message);
});

// Middleware para json
app.use(express.json());

console.log("DB URL presente:", !!process.env.DATABASE_URL);

// -----------------------------------------------------------------------------
// Healthcheck básico (DB)
// -----------------------------------------------------------------------------
app.get("/health", async (_req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({ status: "ok", db: "connected" });
  } catch (e) {
    console.error(e);
    res.status(500).json({ status: "error", db: "disconnected" });
  }
});

// -----------------------------------------------------------------------------
// GET /asignaturas
// (El gateway lo expone como /inscripcion/asignaturas)
// -----------------------------------------------------------------------------
app.get("/asignaturas", async (_req, res) => {
  try {
    // 1) Intentar leer desde Redis
    if (redis.status === "ready") {
      const cached = await redis.get(CACHE_KEY);
      if (cached) {
        console.log("Devolviendo asignaturas DESDE CACHÉ Redis");
        return res.json(JSON.parse(cached));
      }
    }

    // 2) No hay caché o Redis no está ready → ir a la BD
    const rows = await prisma.$queryRaw`
      WITH periodo_activo AS (
        SELECT id
        FROM periodo
        WHERE estado = 'ACTIVO'
        LIMIT 1
      ),
      secciones_disp AS (
        SELECT DISTINCT
          s.id,
          s.codigo,
          s.cupos_totales,
          s.cupos_tomados,
          (s.cupos_totales - s.cupos_tomados) AS cupos_disponibles,
          s.asignatura_id
        FROM seccion s
        JOIN periodo_activo pa ON pa.id = s.periodo_id
        WHERE (s.cupos_totales - s.cupos_tomados) > 0
      ),
      aggr AS (
        SELECT
          a.id,
          a.codigo,
          a.nombre,
          a.creditos,
          COALESCE(
            jsonb_agg(
              jsonb_build_object(
                'id', s.id,
                'codigo', s.codigo,
                'cupos_totales', s.cupos_totales,
                'cupos_tomados', s.cupos_tomados,
                'cupos_disponibles', s.cupos_disponibles
              )
            ) FILTER (WHERE s.id IS NOT NULL),
            '[]'::jsonb
          ) AS secciones
        FROM asignatura a
        LEFT JOIN secciones_disp s ON s.asignatura_id = a.id
        GROUP BY a.id, a.codigo, a.nombre, a.creditos
      )
      SELECT
        g.id, g.codigo, g.nombre, g.creditos, g.secciones,
        COALESCE(
          jsonb_agg(
            jsonb_build_object('id', ar.id, 'codigo', ar.codigo, 'nombre', ar.nombre)
          ) FILTER (WHERE pr.asignatura_id IS NOT NULL),
          '[]'::jsonb
        ) AS prerequisitos
      FROM aggr g
      LEFT JOIN prerrequisito pr ON pr.asignatura_id = g.id
      LEFT JOIN asignatura   ar ON ar.id = pr.asignatura_requerida_id
      GROUP BY g.id, g.codigo, g.nombre, g.creditos, g.secciones
      ORDER BY g.codigo;
    `;

    // 3) Guardar en caché para próximos requests
    if (redis.status === "ready") {
      redis
        .set(CACHE_KEY, JSON.stringify(rows), "EX", CACHE_TTL_SECONDS)
        .catch((err) => console.error("Error guardando cache Redis:", err.message));
    }

    res.json(rows);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "No se pudieron obtener las asignaturas" });
  }
});

// -----------------------------------------------------------------------------
// GET /alumnos/:alumnoRef/asignaturas
// (Gateway: /inscripcion/alumnos/:alumnoRef/asignaturas)
// -----------------------------------------------------------------------------
app.get("/alumnos/:alumnoRef/asignaturas", async (req, res) => {
  const { alumnoRef } = req.params;
  const { periodoId } = req.query;

  try {
    const where = {
      alumno_ref: alumnoRef,
      estado: { in: ["INSCRITA", "PREINSCRITA"] },
      ...(periodoId ? { seccion: { periodo_id: Number(periodoId) } } : {}),
    };

    const insc = await prisma.inscripcion.findMany({
      where,
      include: {
        seccion: {
          select: {
            id: true,
            asignatura: {
              select: { id: true, codigo: true, nombre: true, creditos: true },
            },
            periodo: { select: { id: true, anio: true, semestre: true } },
          },
        },
      },
      orderBy: [{ creada_en: "desc" }],
    });

    const out = insc.map((i) => ({
      id: i.seccion.asignatura.id,
      codigo: i.seccion.asignatura.codigo,
      nombre: i.seccion.asignatura.nombre,
      creditos: i.seccion.asignatura.creditos,
      seccion_id: i.seccion.id,
      periodo_id: i.seccion.periodo.id,
      anio: i.seccion.periodo.anio,
      semestre: i.seccion.periodo.semestre,
    }));

    res.json(out);
  } catch (e) {
    console.error(e);
    res
      .status(500)
      .json({ error: "No se pudieron obtener las asignaturas del alumno" });
  }
});

// -----------------------------------------------------------------------------
// POST /inscripciones
// (Gateway: /inscripcion/inscripciones)
// -----------------------------------------------------------------------------
app.post("/inscripciones", async (req, res) => {
  const { alumnoRef, seccionId } = req.body;
  if (!alumnoRef || !seccionId) {
    return res
      .status(400)
      .json({ error: "alumnoRef y seccionId son requeridos" });
  }

  try {
    const result = await prisma.$transaction(async (tx) => {
      const seccion = await tx.seccion.findUnique({
        where: { id: Number(seccionId) },
        select: {
          id: true,
          asignatura_id: true,
          periodo_id: true,
          cupos_totales: true,
          cupos_tomados: true,
        },
      });
      if (!seccion) throw new Error("Sección no existe");

      const dup = await tx.inscripcion.findFirst({
        where: { alumno_ref: alumnoRef, seccion_id: seccion.id },
        select: { id: true },
      });
      if (dup) throw new Error("Ya inscrito en esta sección");

      if (seccion.cupos_tomados >= seccion.cupos_totales) {
        throw new Error("Sin cupos disponibles");
      }

      const reqs = await tx.prerrequisito.findMany({
        where: { asignatura_id: seccion.asignatura_id },
        select: { asignatura_requerida_id: true },
      });
      const requiredIds = reqs.map((r) => r.asignatura_requerida_id);

      if (requiredIds.length > 0) {
        const ok = await tx.inscripcion.findMany({
          where: {
            alumno_ref: alumnoRef,
            estado: "INSCRITA",
            seccion: {
              asignatura_id: { in: requiredIds },
              periodo_id: { not: seccion.periodo_id },
            },
          },
          select: { seccion: { select: { asignatura_id: true } } },
        });

        const okIds = Array.from(new Set(ok.map((i) => i.seccion.asignatura_id)));
        const missingIds = requiredIds.filter((id) => !okIds.includes(id));

        if (missingIds.length > 0) {
          const faltantes = await tx.asignatura.findMany({
            where: { id: { in: missingIds } },
            select: { codigo: true, nombre: true },
          });
          const lista = faltantes
            .map((f) => `${f.codigo} - ${f.nombre}`)
            .join(", ");
          throw new Error(`Prerrequisitos no cumplidos: ${lista}`);
        }
      }

      const nueva = await tx.inscripcion.create({
        data: { alumno_ref: alumnoRef, seccion_id: seccion.id, estado: "INSCRITA" },
      });

      await tx.seccion.update({
        where: { id: seccion.id },
        data: { cupos_tomados: { increment: 1 } },
      });

      return nueva;
    });

    res.status(201).json(result);
  } catch (e) {
    console.error(e);
    res.status(400).json({ error: e.message || "No se pudo inscribir" });
  }
});

// -----------------------------------------------------------------------------
// GET /alumno-estado/:alumnoRef
// (Gateway: /inscripcion/alumno-estado/:alumnoRef)
// -----------------------------------------------------------------------------
app.get("/alumno-estado/:alumnoRef", async (req, res) => {
  const { alumnoRef } = req.params;
  try {
    const estado = await prisma.alumnoEstado.findUnique({
      where: { alumno_ref: alumnoRef },
      select: { alumno_ref: true, matricula_pagada: true, observacion: true },
    });

    if (!estado) {
      return res.status(404).json({ error: "Alumno no encontrado en el registro financiero" });
    }

    return res.json({
      alumno_ref: estado.alumno_ref,
      estado_matricula: estado.matricula_pagada ? "PAGADA" : "PENDIENTE",
      observacion: estado.observacion,
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Error al obtener el estado del alumno" });
  }
});

// -----------------------------------------------------------------------------
// PATCH /alumno-estado/:alumnoRef
// (Gateway: /inscripcion/alumno-estado/:alumnoRef)
// -----------------------------------------------------------------------------
app.patch("/alumno-estado/:alumnoRef", async (req, res) => {
  const { alumnoRef } = req.params;
  const { matricula_pagada, observacion } = req.body;

  try {
    const actualizado = await prisma.alumnoEstado.upsert({
      where: { alumno_ref: alumnoRef },
      update: { matricula_pagada, observacion },
      create: { alumno_ref: alumnoRef, matricula_pagada, observacion },
    });

    return res.json({
      alumno_ref: actualizado.alumno_ref,
      estado_matricula: actualizado.matricula_pagada ? "PAGADA" : "PENDIENTE",
      observacion: actualizado.observacion,
    });
  } catch (e) {
    console.error(e);
    res.status(400).json({ error: "No se pudo actualizar el estado del alumno" });
  }
});

// -----------------------------------------------------------------------------
// Healthchecks (para orquestadores)
// -----------------------------------------------------------------------------
app.get("/healthz", (_req, res) => res.sendStatus(200));
app.get("/ready", (_req, res) => res.sendStatus(200));

// -----------------------------------------------------------------------------
// Start
// -----------------------------------------------------------------------------
app.listen(PORT, "0.0.0.0", () => {
  console.log(`API Inscripción corriendo en http://localhost:${PORT}`);
});

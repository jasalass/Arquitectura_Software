// inscripcion/src/index.js
import dotenv from "dotenv";
import express from "express";
import prisma from "./db.js";

// Leer variables de .env
dotenv.config();

// Configurar express
const app = express();

// Asignar puerto
const PORT = process.env.PORT || 5000;

// Middleware para json
app.use(express.json());

console.log("DB URL presente:", !!process.env.DATABASE_URL);

// -----------------------------------------------------------------------------
// Healthcheck básico (DB)
// -----------------------------------------------------------------------------
app.get("/inscripcion/health", async (_req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({ status: "ok", db: "connected" });
  } catch (e) {
    console.error(e);
    res.status(500).json({ status: "error", db: "disconnected" });
  }
});

// -----------------------------------------------------------------------------
// GET /inscripcion/asignaturas  (con prerrequisitos)
// -----------------------------------------------------------------------------
app.get("/inscripcion/asignaturas", async (_req, res) => {
  try {
    const rows = await prisma.$queryRaw`
      SELECT
        a.id, a.codigo, a.nombre, a.creditos,
        COALESCE(
          json_agg(
            DISTINCT jsonb_build_object('id', ar.id, 'codigo', ar.codigo, 'nombre', ar.nombre)
          ) FILTER (WHERE ar.id IS NOT NULL),
          '[]'::json
        ) AS prerequisitos
      FROM asignatura a
      LEFT JOIN prerrequisito pr ON pr.asignatura_id = a.id
      LEFT JOIN asignatura   ar ON ar.id = pr.asignatura_requerida_id
      GROUP BY a.id
      ORDER BY a.codigo;
    `;
    res.json(rows);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "No se pudieron obtener las asignaturas" });
  }
});

// -----------------------------------------------------------------------------
// GET /inscripcion/alumnos/:alumnoRef/asignaturas?periodoId=#
// Devuelve las asignaturas (aplanadas) que el alumno tiene inscritas/preinscritas
// -----------------------------------------------------------------------------
app.get("/inscripcion/alumnos/:alumnoRef/asignaturas", async (req, res) => {
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
// POST /inscripcion/inscripciones
// Crea una inscripción si hay cupos y cumple prerrequisitos
// -----------------------------------------------------------------------------
app.post("/inscripcion/inscripciones", async (req, res) => {
  const { alumnoRef, seccionId } = req.body;
  if (!alumnoRef || !seccionId) {
    return res
      .status(400)
      .json({ error: "alumnoRef y seccionId son requeridos" });
  }

  try {
    const result = await prisma.$transaction(async (tx) => {
      // 1) Sección
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

      // 2) Duplicado
      const dup = await tx.inscripcion.findFirst({
        where: { alumno_ref: alumnoRef, seccion_id: seccion.id },
        select: { id: true },
      });
      if (dup) throw new Error("Ya inscrito en esta sección");

      // 3) Cupos
      if (seccion.cupos_tomados >= seccion.cupos_totales) {
        throw new Error("Sin cupos disponibles");
      }

      // 4) Prerrequisitos
      const reqs = await tx.prerrequisito.findMany({
        where: { asignatura_id: seccion.asignatura_id },
        select: { asignatura_requerida_id: true },
      });
      const requiredIds = reqs.map((r) => r.asignatura_requerida_id);

      if (requiredIds.length > 0) {
        // Asignaturas requeridas que el alumno ya tiene (en otro período) con estado INSCRITA
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

      // 5) Crear inscripción
      const nueva = await tx.inscripcion.create({
        data: { alumno_ref: alumnoRef, seccion_id: seccion.id, estado: "INSCRITA" },
      });

      // 6) Actualizar cupos
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
// GET /inscripcion/alumno-estado/:alumnoRef  (CONSULTA estado de matrícula)
// -----------------------------------------------------------------------------
app.get("/inscripcion/alumno-estado/:alumnoRef", async (req, res) => {
  const { alumnoRef } = req.params;
  try {
    const estado = await prisma.alumnoEstado.findUnique({
      where: { alumno_ref: alumnoRef },
      select: { alumno_ref: true, matricula_pagada: true, observacion: true },
    });

    if (!estado) {
      return res
        .status(404)
        .json({ error: "Alumno no encontrado en el registro financiero" });
    }
    res.json(estado);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Error al obtener el estado del alumno" });
  }
});

// -----------------------------------------------------------------------------
// PATCH /inscripcion/alumno-estado/:alumnoRef  (UPSERT estado de matrícula)
// -----------------------------------------------------------------------------
app.patch("/inscripcion/alumno-estado/:alumnoRef", async (req, res) => {
  const { alumnoRef } = req.params;
  const { matricula_pagada, observacion } = req.body;

  try {
    const actualizado = await prisma.alumnoEstado.upsert({
      where: { alumno_ref: alumnoRef },
      update: { matricula_pagada, observacion },
      create: { alumno_ref: alumnoRef, matricula_pagada, observacion },
    });
    res.json(actualizado);
  } catch (e) {
    console.error(e);
    res.status(400).json({ error: "No se pudo actualizar el estado del alumno" });
  }
});

// -----------------------------------------------------------------------------
// Healthchecks (para orquestadores)
// -----------------------------------------------------------------------------
app.get("/inscripcion/healthz", (_req, res) => res.sendStatus(200));
app.get("/inscripcion/ready", (_req, res) => res.sendStatus(200));

// -----------------------------------------------------------------------------
// Start
// -----------------------------------------------------------------------------
app.listen(PORT, () => {
  console.log(`API Inscripción corriendo en http://localhost:${PORT}/inscripcion`);
});

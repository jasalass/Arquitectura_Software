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
app.get('/inscripcion/health', async (req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({ status: 'ok', db: 'connected' });
  } catch (e) {
    console.error(e);
    res.status(500).json({ status: 'error', db: 'disconnected' });
  }
});

app.get('/inscripcion/asignaturas', async (_req, res) => {
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
    res.status(500).json({ error: 'No se pudieron obtener las asignaturas' });
  }
});

app.post('/inscripcion/inscripciones', async (req, res) => {
  const { alumnoRef, seccionId } = req.body;
  if (!alumnoRef || !seccionId) {
    return res.status(400).json({ error: 'alumnoRef y seccionId son requeridos' });
  }

  try {
    const result = await prisma.$transaction(async (tx) => {
      const seccion = await tx.seccion.findUnique({
        where: { id: Number(seccionId) },
        select: { id: true, cupos_totales: true, cupos_tomados: true }
      });
      if (!seccion) throw new Error('Sección no existe');

      const dup = await tx.inscripcion.findFirst({
        where: { alumno_ref: alumnoRef, seccion_id: seccion.id },
        select: { id: true }
      });
      if (dup) throw new Error('Ya inscrito en esta sección');

      if (seccion.cupos_tomados >= seccion.cupos_totales) {
        throw new Error('Sin cupos disponibles');
      }

      const nueva = await tx.inscripcion.create({
        data: { alumno_ref: alumnoRef, seccion_id: seccion.id, estado: 'INSCRITA' }
      });

      await tx.seccion.update({
        where: { id: seccion.id },
        data: { cupos_tomados: { increment: 1 } }
      });

      return nueva;
    });

    res.status(201).json(result);
  } catch (e) {
    console.error(e);
    res.status(400).json({ error: e.message || 'No se pudo inscribir' });
  }
});

// GET /alumnos/:alumnoRef/asignaturas?periodoId=#
app.get('/inscripcion/alumnos/:alumnoRef/asignaturas', async (req, res) => {
  const { alumnoRef } = req.params;
  const { periodoId } = req.query;

  try {
    const where = {
      alumno_ref: alumnoRef,
      estado: { in: ['INSCRITA', 'PREINSCRITA'] },
      ...(periodoId ? { seccion: { periodo_id: Number(periodoId) } } : {})
    };

    const insc = await prisma.inscripcion.findMany({
      where,
      include: {
        seccion: {
          select: {
            id: true,
            asignatura: { select: { id: true, codigo: true, nombre: true, creditos: true } },
            periodo:    { select: { id: true, anio: true, semestre: true } }
          }
        }
      },
      orderBy: [{ creada_en: 'desc' }]
    });

    // aplanamos a la forma pedida (asignaturas tomadas)
    const out = insc.map(i => ({
      id: i.seccion.asignatura.id,
      codigo: i.seccion.asignatura.codigo,
      nombre: i.seccion.asignatura.nombre,
      creditos: i.seccion.asignatura.creditos,
      seccion_id: i.seccion.id,
      periodo_id: i.seccion.periodo.id,
      anio: i.seccion.periodo.anio,
      semestre: i.seccion.periodo.semestre
    }));

    res.json(out);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'No se pudieron obtener las asignaturas del alumno' });
  }
});



//Healthcheck (para kubernetes)
app.get('/inscripcion/healthz', (req,res)=>{res.sendStatus(200)});
app.get('/inscripcion/ready', (req,res)=>{res.sendStatus(200)});

app.listen(PORT, () =>{console.log(`API Inscripción corriendo en http://localhost:${PORT}/inscripcion`)});


🎓 Microservicio Inscripción

API para gestionar asignaturas, prerrequisitos, inscripciones y el estado financiero del alumno.
Usa PostgreSQL + Prisma. Todas las rutas están namescapeadas con el prefijo /inscripcion.

Puerto por defecto: 5000

Base path: /inscripcion

Health: /inscripcion/health, /inscripcion/healthz, /inscripcion/ready

🚀 Inicio rápido (local)
# 1) Dependencias
npm install

# 2) Variables de entorno
cp .env.example .env

# 3) Generar Prisma Client (si cambiaste el schema)
npx prisma generate

# 4) Ejecutar
npm run dev  # o: node src/index.js


Asegúrate de tener la DB levantada (por ejemplo, con infra/local/db_inscripcion).

⚙️ Variables de entorno

.env.example

# Base de datos (host local por tu stack: infra mapea 5433->5432)
DB_HOST=127.0.0.1
DB_PORT=5433
DB_NAME=inscripciones
DB_USER=appuser
DB_PASSWORD=appsecret

# Prisma - URL efectiva usada por el datasource
DATABASE_URL="postgresql://appuser:appsecret@127.0.0.1:${DB_PORT}/inscripciones?schema=public"

# Puerto del servicio
PORT=5000


En Docker en la red utf_net, típicamente:
DATABASE_URL="postgresql://appuser:appsecret@postgres:5432/inscripciones?schema=public"

🧩 Esquema (Prisma / Postgres)

Enums: periodo_estado, rol_docente, estado_inscripcion

Tablas: periodo, asignatura, profesor, sala, seccion, seccion_docente, horario, inscripcion, prerrequisito, alumno_estado

Modelo Prisma principal adicional: AlumnoEstado (mapeado a tabla alumno_estado)

Si usas los seeds de infra/local/db_inscripcion/initdb/001_schema.sql, ya tienes datos de ejemplo y relaciones mínimas para probar.

🌐 Endpoints
🩺 Health
GET /inscripcion/health

Verifica conexión con la base de datos (hace SELECT 1).

200

{ "status": "ok", "db": "connected" }


500

{ "status": "error", "db": "disconnected" }

GET /inscripcion/healthz · GET /inscripcion/ready

Probes simples para orquestadores (liveness/readiness). Responden 200 OK.

📚 Asignaturas
GET /inscripcion/asignaturas

Lista asignaturas con sus prerrequisitos (como arreglo de objetos {id,codigo,nombre}).

200

[
  {
    "id": 1,
    "codigo": "MAT101",
    "nombre": "Cálculo I",
    "creditos": 8,
    "prerrequisitos": []
  },
  {
    "id": 2,
    "codigo": "MAT201",
    "nombre": "Cálculo II",
    "creditos": 8,
    "prerrequisitos": [
      { "id": 1, "codigo": "MAT101", "nombre": "Cálculo I" }
    ]
  }
]


500

{ "error": "No se pudieron obtener las asignaturas" }


cURL

curl http://localhost:5000/inscripcion/asignaturas

🧑‍🎓 Asignaturas del alumno (según inscripciones)
GET /inscripcion/alumnos/:alumnoRef/asignaturas?periodoId=#

Devuelve las asignaturas aplanadas que el alumno tiene con estado INSCRITA o PREINSCRITA.
Opcional: filtra por periodoId.

Params

alumnoRef (UUID del alumno)

periodoId (opcional, numérico)

200

[
  {
    "id": 3,
    "codigo": "PROG201",
    "nombre": "Programación II",
    "creditos": 6,
    "seccion_id": 12,
    "periodo_id": 5,
    "anio": 2025,
    "semestre": 1
  }
]


500

{ "error": "No se pudieron obtener las asignaturas del alumno" }


cURL

curl "http://localhost:5000/inscripcion/alumnos/7b7b5c3a-7f3a-4b1f-9d73-2f10f1b9a100/asignaturas?periodoId=5"

📝 Crear inscripción
POST /inscripcion/inscripciones

Crea una inscripción si:

La sección existe

No hay duplicado para ese alumno

Hay cupos (cupos_tomados < cupos_totales)

Cumple prerrequisitos (según inscripciones previas con INSCRITA en períodos distintos)

Body (JSON)

{
  "alumnoRef": "7b7b5c3a-7f3a-4b1f-9d73-2f10f1b9a100",
  "seccionId": 42
}


201 (éxito)

{
  "id": 99,
  "seccion_id": 42,
  "alumno_ref": "7b7b5c3a-7f3a-4b1f-9d73-2f10f1b9a100",
  "estado": "INSCRITA",
  "creada_en": "2025-10-16T00:35:00.123Z",
  "actualizada_en": "2025-10-16T00:35:00.123Z"
}


400 (errores de negocio)

{ "error": "alumnoRef y seccionId son requeridos" }

{ "error": "Sección no existe" }

{ "error": "Ya inscrito en esta sección" }

{ "error": "Sin cupos disponibles" }

{ "error": "Prerrequisitos no cumplidos: MAT201 - Cálculo II, PROG201 - Programación II" }


cURL

curl -X POST http://localhost:5000/inscripcion/inscripciones \
  -H "Content-Type: application/json" \
  -d '{"alumnoRef":"7b7b5c3a-7f3a-4b1f-9d73-2f10f1b9a100","seccionId":42}'

💵 Estado financiero del alumno
GET /inscripcion/alumno-estado/:alumnoRef

Consulta el registro en alumno_estado.

200

{
  "alumno_ref": "7b7b5c3a-7f3a-4b1f-9d73-2f10f1b9a100",
  "matricula_pagada": true,
  "observacion": "Pago ok (seed)"
}


404

{ "error": "Alumno no encontrado en el registro financiero" }


500

{ "error": "Error al obtener el estado del alumno" }


cURL

curl http://localhost:5000/inscripcion/alumno-estado/7b7b5c3a-7f3a-4b1f-9d73-2f10f1b9a100

PATCH /inscripcion/alumno-estado/:alumnoRef

Crea o actualiza el estado financiero (UPSERT).

Body

{ "matricula_pagada": true, "observacion": "Pago actualizado" }


200

{
  "alumno_ref": "7b7b5c3a-7f3a-4b1f-9d73-2f10f1b9a100",
  "matricula_pagada": true,
  "observacion": "Pago actualizado"
}


400

{ "error": "No se pudo actualizar el estado del alumno" }


cURL

curl -X PATCH http://localhost:5000/inscripcion/alumno-estado/7b7b5c3a-7f3a-4b1f-9d73-2f10f1b9a100 \
  -H "Content-Type: application/json" \
  -d '{"matricula_pagada": true, "observacion": "Pago actualizado"}'

🧠 Notas de uso con API Gateway

Tu Gateway reescribe rutas manteniendo el prefijo /inscripcion, por lo tanto desde el Gateway el consumo es igual:

GET  http://localhost:3000/inscripcion/asignaturas
POST http://localhost:3000/inscripcion/inscripciones
...


En el Gateway, asegúrate de que INSCRIPCION_BASE_URL no termine con /inscripcion para evitar duplicar el prefijo:
INSCRIPCION_BASE_URL=http://inscripcion:5000 ✅

🐳 Docker
Dockerfile (ya incluido)

Multi-stage: instala deps, genera Prisma Client y empaqueta imagen final slim.

Expone puerto 5000.

Construir y correr

# build (desde inscripcion/)
docker build -t inscripcion:local .

# ejecutar en red utf_net con la DB ya levantada
docker run --rm -p 5000:5000 --name inscripcion \
  --network utf_net \
  -e DATABASE_URL="postgresql://appuser:appsecret@postgres:5432/inscripciones?schema=public" \
  inscripcion:local

🧰 Comandos Prisma útiles
# genera cliente (tras cambios en prisma/schema.prisma)
npx prisma generate

# introspección (si cambiaste la DB desde SQL y quieres actualizar el schema)
npx prisma db pull

# migraciones (si gestionas cambios desde Prisma Migrate)
npx prisma migrate dev --name init


Tu esquema usa checks y enums ya creados por SQL; si gestionas DDL desde SQL, usa db pull para reflejar cambios en Prisma.

🛡️ Errores comunes & Tips

DATABASE_URL incorrecta: si corres desde host, usa 127.0.0.1:5433; si corres en Docker dentro de utf_net, usa postgres:5432.

Seeds no visibles: si usas infra/local/db_inscripcion, recuerda que los seeds corren solo al crear el volumen por primera vez. Haz docker compose down -v para reconstruir datos.

CORS: no se configura en este micro (lo maneja tu Gateway).

UUIDs: asegúrate de pasar alumnoRef como UUID válido.
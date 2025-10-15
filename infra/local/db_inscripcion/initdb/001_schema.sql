-- ====== Enums (idempotentes) ======
DO $$ BEGIN
  CREATE TYPE periodo_estado AS ENUM ('ACTIVO', 'CERRADO', 'PLANIFICACION');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE rol_docente AS ENUM ('TITULAR', 'AYUDANTE', 'INVITADO');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE estado_inscripcion AS ENUM ('PREINSCRITA', 'INSCRITA', 'LISTA_ESPERA', 'RETIRADA', 'RECHAZADA');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ====== Tablas base ======
CREATE TABLE IF NOT EXISTS periodo (
  id            SERIAL PRIMARY KEY,
  anio          INT NOT NULL,
  semestre      INT NOT NULL CHECK (semestre IN (1,2)),
  fecha_inicio  DATE NOT NULL,
  fecha_fin     DATE NOT NULL,
  estado        periodo_estado DEFAULT 'ACTIVO',
  UNIQUE (anio, semestre)
);

CREATE TABLE IF NOT EXISTS asignatura (
  id        SERIAL PRIMARY KEY,
  codigo    VARCHAR(10) UNIQUE NOT NULL,
  nombre    VARCHAR(120) NOT NULL,
  creditos  INT NOT NULL CHECK (creditos > 0)
);

CREATE TABLE IF NOT EXISTS profesor (
  id     SERIAL PRIMARY KEY,
  rut    VARCHAR(15) UNIQUE NOT NULL,
  nombre VARCHAR(120) NOT NULL,
  email  VARCHAR(120)
);

CREATE TABLE IF NOT EXISTS sala (
  id         SERIAL PRIMARY KEY,
  codigo     VARCHAR(20) UNIQUE NOT NULL,
  capacidad  INT NOT NULL CHECK (capacidad > 0)
);

-- ====== Oferta académica ======
CREATE TABLE IF NOT EXISTS seccion (
  id                 SERIAL PRIMARY KEY,
  asignatura_id      INT NOT NULL REFERENCES asignatura(id) ON DELETE CASCADE,
  periodo_id         INT NOT NULL REFERENCES periodo(id)    ON DELETE CASCADE,
  codigo             VARCHAR(10) NOT NULL,
  cupos_totales      INT NOT NULL DEFAULT 0 CHECK (cupos_totales >= 0),
  cupos_tomados      INT NOT NULL DEFAULT 0 CHECK (cupos_tomados >= 0),
  cupos_lista_espera INT NOT NULL DEFAULT 0 CHECK (cupos_lista_espera >= 0),
  UNIQUE (asignatura_id, periodo_id, codigo)
);
CREATE INDEX IF NOT EXISTS idx_seccion_periodo ON seccion(periodo_id);

CREATE TABLE IF NOT EXISTS seccion_docente (
  id          SERIAL PRIMARY KEY,
  seccion_id  INT NOT NULL REFERENCES seccion(id)   ON DELETE CASCADE,
  profesor_id INT NOT NULL REFERENCES profesor(id),
  rol         rol_docente DEFAULT 'TITULAR',
  UNIQUE (seccion_id, profesor_id, rol)
);

CREATE TABLE IF NOT EXISTS horario (
  id          SERIAL PRIMARY KEY,
  seccion_id  INT  NOT NULL REFERENCES seccion(id)  ON DELETE CASCADE,
  dia_semana  INT  NOT NULL CHECK (dia_semana BETWEEN 1 AND 7),
  hora_inicio TIME NOT NULL,
  hora_fin    TIME NOT NULL,
  sala_id     INT  NOT NULL REFERENCES sala(id),
  CHECK (hora_inicio < hora_fin)
);
CREATE INDEX IF NOT EXISTS idx_horario_seccion ON horario(seccion_id, dia_semana, hora_inicio);

-- ====== Inscripciones ======
CREATE TABLE IF NOT EXISTS inscripcion (
  id             SERIAL PRIMARY KEY,
  seccion_id     INT   NOT NULL REFERENCES seccion(id) ON DELETE CASCADE,
  alumno_ref     UUID  NOT NULL,
  estado         estado_inscripcion DEFAULT 'PREINSCRITA',
  creada_en      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  actualizada_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (alumno_ref, seccion_id)
);
CREATE INDEX IF NOT EXISTS idx_inscripcion_alumno_estado ON inscripcion(alumno_ref, estado);

-- ====== Prerrequisitos ======
CREATE TABLE IF NOT EXISTS prerrequisito (
  id                      SERIAL PRIMARY KEY,
  asignatura_id           INT NOT NULL REFERENCES asignatura(id) ON DELETE CASCADE,
  asignatura_requerida_id INT NOT NULL REFERENCES asignatura(id) ON DELETE CASCADE,
  UNIQUE (asignatura_id, asignatura_requerida_id),
  CHECK (asignatura_id <> asignatura_requerida_id)
);

-- ====== Estado financiero ======
CREATE TABLE IF NOT EXISTS alumno_estado (
  alumno_ref        UUID PRIMARY KEY,
  matricula_pagada  BOOLEAN NOT NULL DEFAULT FALSE,
  observacion       TEXT
);

-- ====== Seeds ======

-- Periodos
INSERT INTO periodo (anio, semestre, fecha_inicio, fecha_fin, estado)
VALUES
  (2024, 2, '2024-08-01', '2024-12-20', 'CERRADO'),
  (2025, 1, '2025-03-01', '2025-07-15', 'ACTIVO')
ON CONFLICT (anio, semestre) DO NOTHING;

-- Asignaturas
INSERT INTO asignatura (codigo, nombre, creditos) VALUES
  ('MAT101','Cálculo I',8),
  ('MAT201','Cálculo II',8),
  ('PROG101','Programación I',6),
  ('PROG201','Programación II',6),
  ('FIS101','Física I',6)
ON CONFLICT (codigo) DO NOTHING;

-- Prerrequisitos
INSERT INTO prerrequisito (asignatura_id, asignatura_requerida_id)
SELECT a2.id, a1.id
FROM asignatura a1, asignatura a2
WHERE a1.codigo = 'MAT101' AND a2.codigo = 'MAT201'
ON CONFLICT (asignatura_id, asignatura_requerida_id) DO NOTHING;

INSERT INTO prerrequisito (asignatura_id, asignatura_requerida_id)
SELECT a2.id, a1.id
FROM asignatura a1, asignatura a2
WHERE a1.codigo = 'PROG101' AND a2.codigo = 'PROG201'
ON CONFLICT (asignatura_id, asignatura_requerida_id) DO NOTHING;

-- Secciones 2024-2
INSERT INTO seccion (asignatura_id, periodo_id, codigo, cupos_totales, cupos_tomados, cupos_lista_espera)
SELECT a.id, p.id, '01', 40, 0, 0
FROM asignatura a
JOIN periodo p ON p.anio=2024 AND p.semestre=2
WHERE a.codigo IN ('MAT101','PROG101')
ON CONFLICT (asignatura_id, periodo_id, codigo) DO NOTHING;

-- Secciones 2025-1 (MAT201 con 1 cupo para forzar "Sin cupos")
INSERT INTO seccion (asignatura_id, periodo_id, codigo, cupos_totales, cupos_tomados, cupos_lista_espera)
SELECT a.id, p.id, '01',
       CASE WHEN a.codigo='MAT201' THEN 1 ELSE 30 END, 0, 0
FROM asignatura a
JOIN periodo p ON p.anio=2025 AND p.semestre=1
WHERE a.codigo IN ('MAT201','PROG201','FIS101')
ON CONFLICT (asignatura_id, periodo_id, codigo) DO NOTHING;

-- ========= Estado financiero (alumno_estado) =========
-- Sanitizamos por si el editor metió un BOM/espacios invisibles
WITH v(alumno_ref, matricula_pagada, observacion) AS (
  VALUES
    ('7b7b5c3a-7f3a-4b1f-9d73-2f10f1b9a100', TRUE,  'Pago ok (seed)'),
    ('11111111-1111-1111-1111-111111111111', FALSE, 'Pago pendiente'),
    ('22222222-2222-2222-2222-222222222222', TRUE,  'Pago ok (seed)')
),
clean AS (
  SELECT
    (regexp_replace(alumno_ref, '[^0-9a-f-]', '', 'gi'))::uuid AS alumno_ref,
    matricula_pagada,
    observacion
  FROM v
)
INSERT INTO alumno_estado (alumno_ref, matricula_pagada, observacion)
SELECT alumno_ref, matricula_pagada, observacion
FROM clean
ON CONFLICT (alumno_ref) DO NOTHING;

-- Inscripciones históricas 2024-2 (para prerrequisitos)
INSERT INTO inscripcion (seccion_id, alumno_ref, estado, creada_en, actualizada_en)
SELECT s.id, '7b7b5c3a-7f3a-4b1f-9d73-2f10f1b9a100', 'INSCRITA', NOW(), NOW()
FROM seccion s
JOIN asignatura a ON a.id = s.asignatura_id
JOIN periodo p ON p.id = s.periodo_id
WHERE p.anio=2024 AND p.semestre=2 AND a.codigo IN ('MAT101','PROG101')
ON CONFLICT (alumno_ref, seccion_id) DO NOTHING;

-- Ocupa el único cupo de MAT201 2025-1 con un tercero
INSERT INTO inscripcion (seccion_id, alumno_ref, estado, creada_en, actualizada_en)
SELECT s.id, '33333333-3333-3333-3333-333333333333', 'INSCRITA', NOW(), NOW()
FROM seccion s
JOIN asignatura a ON a.id = s.asignatura_id
JOIN periodo p ON p.id = s.periodo_id
WHERE p.anio=2025 AND p.semestre=1 AND a.codigo = 'MAT201'
ON CONFLICT (alumno_ref, seccion_id) DO NOTHING;

-- Recalcular cupos tomados según inscripciones reales
UPDATE seccion s
SET cupos_tomados = sub.cnt
FROM (
  SELECT seccion_id, COUNT(*)::int AS cnt
  FROM inscripcion
  WHERE estado = 'INSCRITA'
  GROUP BY seccion_id
) sub
WHERE s.id = sub.seccion_id;

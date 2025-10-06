-- ====== Enums (requeridos por tablas) ======
CREATE TYPE periodo_estado AS ENUM ('ACTIVO', 'CERRADO', 'PLANIFICACION');
CREATE TYPE rol_docente AS ENUM ('TITULAR', 'AYUDANTE', 'INVITADO');
CREATE TYPE estado_inscripcion AS ENUM ('PREINSCRITA', 'INSCRITA', 'LISTA_ESPERA', 'RETIRADA', 'RECHAZADA');

-- ====== Tablas base ======
CREATE TABLE periodo (
  id            SERIAL PRIMARY KEY,
  anio          INT NOT NULL,
  semestre      INT NOT NULL CHECK (semestre IN (1,2)),
  fecha_inicio  DATE NOT NULL,
  fecha_fin     DATE NOT NULL,
  estado        periodo_estado DEFAULT 'ACTIVO',
  UNIQUE (anio, semestre)
);

CREATE TABLE asignatura (
  id        SERIAL PRIMARY KEY,
  codigo    VARCHAR(10) UNIQUE NOT NULL,
  nombre    VARCHAR(120) NOT NULL,
  creditos  INT NOT NULL CHECK (creditos > 0)
);

CREATE TABLE profesor (
  id     SERIAL PRIMARY KEY,
  rut    VARCHAR(15) UNIQUE NOT NULL,
  nombre VARCHAR(120) NOT NULL,
  email  VARCHAR(120)
);

CREATE TABLE sala (
  id         SERIAL PRIMARY KEY,
  codigo     VARCHAR(20) UNIQUE NOT NULL,
  capacidad  INT NOT NULL CHECK (capacidad > 0)
);

-- ====== Oferta académica ======
CREATE TABLE seccion (
  id                 SERIAL PRIMARY KEY,
  asignatura_id      INT NOT NULL REFERENCES asignatura(id) ON DELETE CASCADE,
  periodo_id         INT NOT NULL REFERENCES periodo(id)    ON DELETE CASCADE,
  codigo             VARCHAR(10) NOT NULL,                     -- ej: "01"
  cupos_totales      INT NOT NULL DEFAULT 0 CHECK (cupos_totales >= 0),
  cupos_tomados      INT NOT NULL DEFAULT 0 CHECK (cupos_tomados >= 0),
  cupos_lista_espera INT NOT NULL DEFAULT 0 CHECK (cupos_lista_espera >= 0),
  UNIQUE (asignatura_id, periodo_id, codigo)
);
CREATE INDEX idx_seccion_periodo ON seccion(periodo_id);

CREATE TABLE seccion_docente (
  id          SERIAL PRIMARY KEY,
  seccion_id  INT NOT NULL REFERENCES seccion(id)   ON DELETE CASCADE,
  profesor_id INT NOT NULL REFERENCES profesor(id),
  rol         rol_docente DEFAULT 'TITULAR',
  UNIQUE (seccion_id, profesor_id, rol)
);

CREATE TABLE horario (
  id          SERIAL PRIMARY KEY,
  seccion_id  INT  NOT NULL REFERENCES seccion(id)  ON DELETE CASCADE,
  dia_semana  INT  NOT NULL CHECK (dia_semana BETWEEN 1 AND 7),
  hora_inicio TIME NOT NULL,
  hora_fin    TIME NOT NULL,
  sala_id     INT  NOT NULL REFERENCES sala(id),
  CHECK (hora_inicio < hora_fin)
);
CREATE INDEX idx_horario_seccion ON horario(seccion_id, dia_semana, hora_inicio);

-- ====== Inscripciones ======
CREATE TABLE inscripcion (
  id            SERIAL PRIMARY KEY,
  seccion_id    INT   NOT NULL REFERENCES seccion(id) ON DELETE CASCADE,
  alumno_ref    UUID  NOT NULL,   -- ID del alumno proveniente de Auth
  estado        estado_inscripcion DEFAULT 'PREINSCRITA',
  creada_en     TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  actualizada_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (alumno_ref, seccion_id)
);
CREATE INDEX idx_inscripcion_alumno_estado ON inscripcion(alumno_ref, estado);

-- ====== Prerrequisitos (auto-relación N:M de asignaturas) ======
CREATE TABLE prerrequisito (
  id                          SERIAL PRIMARY KEY,
  asignatura_id               INT NOT NULL REFERENCES asignatura(id) ON DELETE CASCADE,
  asignatura_requerida_id     INT NOT NULL REFERENCES asignatura(id) ON DELETE CASCADE,
  UNIQUE (asignatura_id, asignatura_requerida_id),
  CHECK (asignatura_id <> asignatura_requerida_id)
);

Infra – DB Inscripción (Postgres + Adminer)

Entorno local para la base de datos de Inscripción. Levanta Postgres 16 y Adminer con seeds y esquema inicial desde initdb/001_schema.sql.

🧱 Requisitos

Docker / Docker Compose

Red Docker externa utf_net (si no existe, créala):

docker network create utf_net

📦 Estructura
infra/
└─ local/
   └─ db_inscripcion/
      ├─ docker-compose.yml
      └─ initdb/
         └─ 001_schema.sql   # enums, tablas, índices y datos seed

⚙️ Servicios
Postgres

Imagen: postgres:16

Container: pg-inscripcion-dev

DB: inscripciones

Usuario: appuser

Password: appsecret

Puerto host: 5433 → contenedor 5432

Volumen datos: pgdata_insc

Seeds: ./initdb/*.sql (solo en primer arranque del volumen)

Healthcheck: pg_isready -U appuser -d inscripciones

Adminer

Imagen: adminer:latest

Container: adminer-inscripcion

Puerto host: 8080

Ambos servicios están en la red externa utf_net.

🚀 Levantar / detener

Desde infra/local/db_inscripcion:

# levantar en segundo plano
docker compose up -d

# ver logs (Postgres)
docker logs -f pg-inscripcion-dev

# detener
docker compose down

# detener y borrar volumen de datos (⚠️ elimina la DB)
docker compose down -v


Si cambiaste algo en initdb/*.sql y ya existe el volumen, debes recrear con down -v para que se apliquen de nuevo los seeds (comportamiento estándar de Postgres + docker-entrypoint-initdb.d).

🔌 Conexiones
Credenciales

Host (desde tu máquina): localhost

Puerto: 5433

DB: inscripciones

Usuario: appuser

Password: appsecret

Adminer (UI web)

Abre: http://localhost:8080

Sistema: PostgreSQL
Servidor: postgres (o host.docker.internal:5433 si conectas desde host fuera de la red Docker)
Usuario: appuser
Contraseña: appsecret
Base de datos: inscripciones

Desde otro contenedor en la misma red utf_net, usa postgres:5432 como servidor.

psql

Desde tu host (requiere psql instalado y puerto 5433 libre):

psql "postgres://appuser:appsecret@localhost:5433/inscripciones"


Dentro del contenedor:

docker exec -it pg-inscripcion-dev psql -U appuser -d inscripciones

Prisma / Node (ejemplo .env)
# desde host
DATABASE_URL="postgresql://appuser:appsecret@localhost:5433/inscripciones?schema=public"

# desde otro contenedor en utf_net
DATABASE_URL="postgresql://appuser:appsecret@postgres:5432/inscripciones?schema=public"

🧪 Semilla y esquema

El archivo initdb/001_schema.sql contiene:

ENUMS idempotentes:

periodo_estado: ACTIVO, CERRADO, PLANIFICACION

rol_docente: TITULAR, AYUDANTE, INVITADO

estado_inscripcion: PREINSCRITA, INSCRITA, LISTA_ESPERA, RETIRADA, RECHAZADA

Tablas base: periodo, asignatura, profesor, sala

Oferta académica: seccion, seccion_docente, horario

Inscripciones: inscripcion

Prerrequisitos: prerrequisito

Estado financiero: alumno_estado

Índices, constraints y ON CONFLICT DO NOTHING para seeds

Seeds de periodos 2024-2 y 2025-1, asignaturas, prerrequisitos, secciones, inscripciones históricas y estado financiero.

Recalculo de cupos_tomados según inscripciones.

El script es idempotente (usa IF NOT EXISTS y ON CONFLICT) y limpia posibles caracteres invisibles en los UUID (sanitiza con regexp_replace).

🧰 Troubleshooting

“Connection refused” en 5433
Asegúrate de que no haya otra DB usando 5433. Cambia el mapeo en docker-compose.yml si es necesario:

ports:
  - "5434:5432"


y actualiza tus DATABASE_URL.

Adminer no conecta usando localhost
Desde Adminer (dentro de Docker) usa postgres como servidor (nombre del servicio).
Si quieres usar localhost:5433, prueba desde tu navegador/host con un cliente externo, no desde Adminer.

Seeds no se aplican
El directorio docker-entrypoint-initdb.d solo se ejecuta cuando el directorio de datos está vacío (primer arranque del volumen).
Elimina el volumen:

docker compose down -v
docker compose up -d


UTF-8 / BOM en Windows
Si editas 001_schema.sql en Windows, guarda como UTF-8 sin BOM para evitar caracteres invisibles. El seed hace una limpieza de UUID, pero evita BOM.

✅ Healthcheck manual
# espera a healthy
docker inspect --format='{{json .State.Health.Status}}' pg-inscripcion-dev
# o prueba:
pg_isready -h localhost -p 5433 -U appuser -d inscripciones

🔒 Notas de seguridad (dev)

Claves y usuarios son de desarrollo. No reutilizar en producción.

Expón puertos solo en entornos controlados.

Para producción, usar secretos/volúmenes gestionados y backups.
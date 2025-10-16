⚙️ Scripts de entorno local (PowerShell)

Automatizan el arranque y apagado del stack completo en desarrollo:

Infra de base de datos (Postgres + Adminer)

Microservicios: api, auth, inscripcion, pago

Prisma (generate, baseline opcional, migrate deploy)

Red Docker utf_net (creada si no existe)

Están pensados para usarse en Windows con PowerShell y Docker Desktop.

✅ Requisitos

Windows + PowerShell

Docker Desktop (o Docker Engine + Docker Compose)

Repositorio en la estructura original (rutas relativas):

/ (raíz del repo)
├─ docker-compose.yml
├─ inscripcion/
│   └─ prisma/
└─ infra/local/db_inscripcion/
    └─ docker-compose.yml


Archivos .env configurados (al menos en inscripcion/ para DATABASE_URL)

▶️ Subir todo: dev-up.ps1

Arranca infra y servicios en orden correcto, aplica Prisma y deja todo listo.

Uso
# Desde la carpeta scripts/
.\dev-up.ps1

¿Qué hace paso a paso?

Define rutas internas a:

infra\local\db_inscripcion\docker-compose.yml

docker-compose.yml de la raíz

Crea la red externa utf_net si no existe (no falla si ya está creada).

Levanta la DB + Adminer en segundo plano (infra/local/db_inscripcion).

Espera a que Postgres esté healthy (hasta ~80s).

Build de imágenes de api, auth, inscripcion, pago (compose raíz).

Genera Prisma Client dentro del contenedor de inscripcion.

Baseline automático (opcional):

Si no hay migraciones locales, crea una 000_init con prisma migrate diff y la marca como aplicada.

Si ya hay migraciones, no crea baseline.

Aplica migraciones (prisma migrate deploy).

Levanta los servicios (up -d en el compose raíz).

Muestra endpoints útiles:

Adminer: http://localhost:8080

Postgres host: 127.0.0.1:5433 (appuser / appsecret / inscripciones)

Inscripción (health): http://localhost:5000/inscripcion/health

API Gateway: http://localhost:3000

Auth: http://localhost:4000

Pago (demo): http://localhost:7000

Personalización rápida

Cambia el nombre de red (utf_net) si choca con otra:

Edita el script y los docker-compose.yml.

Si tu Postgres usa otro puerto host:

Ajusta ports en infra/.../docker-compose.yml y la DATABASE_URL.

⏹️ Bajar todo: dev-down.ps1

Apaga servicios y base de datos. Incluye un comando comentado para reset total de la DB.

Uso
# Desde la carpeta scripts/
.\dev-down.ps1

¿Qué hace?

Down del compose raíz: apaga api, auth, inscripcion, pago.

Down del compose de infra: apaga Postgres y Adminer.

(Opcional) Reset total de la DB:

Descomenta la línea:

docker compose -f "$InfraCompose" down -v


⚠️ Elimina el volumen pgdata_insc → perderás todos los datos locales.

🧪 Comprobaciones útiles

Ver health de Inscripción

curl http://localhost:5000/inscripcion/health


Ver servicios

docker ps


Ver logs

docker logs -f pg-inscripcion-dev           # DB
docker compose -f ..\docker-compose.yml logs -f inscripcion  # servicio

🛠️ Troubleshooting

❌ Postgres no llegó a healthy a tiempo.

Repite .\dev-up.ps1 (a veces tarda la primera vez).

Revisa logs: docker logs -f pg-inscripcion-dev

Verifica que el puerto 5433 no esté ocupado.

❌ Prisma falla en migrate deploy

Asegura DATABASE_URL correcto:

En host: postgresql://appuser:appsecret@127.0.0.1:5433/inscripciones?schema=public

En contenedores (misma red): postgresql://appuser:appsecret@postgres:5432/inscripciones?schema=public

Si tu esquema DB lo creas con SQL (seeds), usa db pull para alinear Prisma.

❌ Seeds no visibles

Los scripts en docker-entrypoint-initdb.d corren solo cuando el volumen se crea por primera vez.

Haz reset total: .\dev-down.ps1 y descomenta el down -v, luego .\dev-up.ps1.

❌ utf_net ya existe / conflictos de red

El script verifica antes de crear; si necesitas cambiar el nombre, ajusta en:

infra/.../docker-compose.yml

docker-compose.yml raíz

Ambos scripts.

📝 Notas

Los scripts usan -f para ejecutar compose por archivo, evitando ambigüedades.

El baseline automático evita errores cuando no tienes migraciones locales pero sí un esquema ya creado por SQL.

Puedes ejecutar los pasos individuales manualmente si prefieres (build, generate, migrate, up).
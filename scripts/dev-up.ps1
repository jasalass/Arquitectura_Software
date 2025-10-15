# scripts/dev-up.ps1
$ErrorActionPreference = "Stop"

# Rutas
$Root         = Split-Path $PSScriptRoot -Parent
$InfraCompose = Join-Path $Root "infra\local\db_inscripcion\docker-compose.yml"
$RootCompose  = Join-Path $Root "docker-compose.yml"

Write-Host "Creando red externa (si no existe): utf_net"
# Método robusto: chequear sin lanzar error
$networks = docker network ls --format "{{.Name}}"
if (-not ($networks -contains "utf_net")) {
  docker network create utf_net | Out-Null
  Write-Host "Red 'utf_net' creada."
} else {
  Write-Host "Red 'utf_net' ya existe."
}

Write-Host "Levantando DB + Adminer (infra/local/db_inscripcion)…"
docker compose -f "$InfraCompose" up -d

Write-Host "Esperando a que Postgres esté healthy..."
$ok = $false
for ($i = 0; $i -lt 40; $i++) {
  try {
    $status = docker inspect -f '{{.State.Health.Status}}' pg-inscripcion-dev
  } catch { $status = "starting" }
  if ($status -eq "healthy") { $ok = $true; break }
  Start-Sleep -Seconds 2
}
if (-not $ok) { throw "Postgres no llegó a healthy a tiempo." }
Write-Host "Postgres healthy."

Write-Host "Build de servicios (api, auth, inscripcion, pago)…"
docker compose -f "$RootCompose" build

Write-Host "Generando Prisma Client en 'inscripcion'…"
docker compose -f "$RootCompose" run --rm inscripcion npx prisma generate

# --- Baseline automático si NO hay migraciones locales ---
$migrationsPath = Join-Path $Root "inscripcion\prisma\migrations"
$hasMigrations  = (Test-Path $migrationsPath -PathType Container) -and ((Get-ChildItem $migrationsPath -Force | Measure-Object).Count -gt 0)

if (-not $hasMigrations) {
  Write-Host "No hay migraciones locales. Creando baseline '000_init'…"
  docker compose -f "$RootCompose" run --rm inscripcion sh -lc `
    "mkdir -p prisma/migrations/000_init && \
     npx prisma migrate diff --from-empty --to-schema-datamodel prisma/schema.prisma --script > prisma/migrations/000_init/migration.sql && \
     npx prisma migrate resolve --applied 000_init"
} else {
  Write-Host "Se encontraron migraciones locales. No se crea baseline."
}

Write-Host "Aplicando migraciones Prisma (deploy)…"
docker compose -f "$RootCompose" run --rm inscripcion npx prisma migrate deploy

Write-Host "Levantando servicios (api, auth, inscripcion, pago)…"
docker compose -f "$RootCompose" up -d

Write-Host ""
Write-Host "Todo arriba:"
Write-Host " - Adminer:                 http://localhost:8080"
Write-Host " - Postgres (host):         127.0.0.1:5433  (user=appuser pass=appsecret db=inscripciones)"
Write-Host " - Inscripcion (health):    http://localhost:5000/inscripcion/health"
Write-Host " - API Gateway:             http://localhost:3000"
Write-Host " - Auth:                    http://localhost:4000"
Write-Host " - Pago:                    http://localhost:7000"

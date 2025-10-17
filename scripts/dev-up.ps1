# scripts/dev-up.ps1
$ErrorActionPreference = "Stop"

# === Rutas base ===
$Root         = Split-Path $PSScriptRoot -Parent
$InfraCompose = Join-Path $Root "infra\local\db_inscripcion\docker-compose.yml"
$RootCompose  = Join-Path $Root "docker-compose.yml"

# Carpeta fija del front (lo que me indicaste)
$FrontDir = Join-Path $Root "Front_Inscripciones"
$FrontDockerfile = Join-Path $FrontDir "Dockerfile"
$FrontImage = "front:dev"
$FrontContainer = "front-dev"
$FrontPort = 8100

Write-Host "Creando red externa (si no existe): utf_net"
$networks = docker network ls --format "{{.Name}}"
if (-not ($networks -contains "utf_net")) { docker network create utf_net | Out-Null }

Write-Host "`nLevantando DB + Adminer"
docker compose -f "$InfraCompose" up -d

# Espera simple a Postgres healthy
$maxWait=60; $elapsed=0; $status=$null
while ($elapsed -lt $maxWait) {
  $status = docker inspect --format='{{.State.Health.Status}}' pg-inscripcion-dev 2>$null
  if ($status -eq "healthy") { break }
  Start-Sleep -Seconds 2; $elapsed += 2
}

Write-Host "Aplicando migraciones Prisma (deploy)…"
try { docker compose -f "$RootCompose" run --rm inscripcion npx prisma migrate deploy } catch { }

Write-Host "`nLevantando servicios de aplicación…"
try { docker compose -f "$RootCompose" up -d } catch { }

Write-Host "`n=== FRONTEND ANGULAR/IONIC ==="
# Opción A: si existe servicio front/frontend en compose, úsalo
$services = (docker compose -f "$RootCompose" config --services) 2>$null
if ($services -and ($services -contains "front" -or $services -contains "frontend")) {
  $frontServiceName = ( @("front","frontend") | Where-Object { $services -contains $_ } | Select-Object -First 1 )
  docker compose -f "$RootCompose" up -d $frontServiceName
}
# Opción B: construir desde ./Front_Inscripciones
elseif (Test-Path $FrontDockerfile) {
  Write-Host "Construyendo imagen '$FrontImage' desde $FrontDir…"
  docker build -t $FrontImage "$FrontDir"

  $existing = docker ps -a --filter "name=$FrontContainer" --format "{{.Names}}"
  if ($existing -eq $FrontContainer) { docker rm -f $FrontContainer | Out-Null }

  Write-Host "Levantando '$FrontContainer' en http://localhost:$FrontPort …"
  docker run -d --name $FrontContainer --network utf_net -p "$FrontPort:80" $FrontImage | Out-Null
}
else {
  Write-Warning "No existe servicio 'front' en compose ni Dockerfile en $FrontDir"
}

Write-Host "`n=== TODO ARRIBA ==="
Write-Host " - Adminer:              http://localhost:8080"
Write-Host " - Postgres:             127.0.0.1:5433  (user=appuser pass=appsecret db=inscripciones)"
Write-Host " - API Gateway:          http://localhost:3000"
Write-Host " - Auth:                 http://localhost:4000"
Write-Host " - Inscripción:          http://localhost:5000"
Write-Host " - Pago:                 http://localhost:7000"
Write-Host " - Front Angular/Ionic:  http://localhost:$FrontPort"

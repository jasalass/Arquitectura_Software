# scripts/dev-down.ps1
$ErrorActionPreference = "Stop"

$Root = Split-Path $PSScriptRoot -Parent
$InfraCompose = Join-Path $Root "infra\local\db_inscripcion\docker-compose.yml"
$RootCompose  = Join-Path $Root "docker-compose.yml"

Write-Host "Apagando servicios de aplicación…"
try {
  $services = (docker compose -f "$RootCompose" config --services) 2>$null
  if ($services -and ($services -contains "front" -or $services -contains "frontend")) {
    $frontServiceName = ( @("front","frontend") | Where-Object { $services -contains $_ } | Select-Object -First 1 )
    docker compose -f "$RootCompose" down $frontServiceName
  }
} catch { }

docker compose -f "$RootCompose" down

# Si el front se corrió fuera de compose:
$FrontContainer = "front-dev"
$running = docker ps -a --filter "name=$FrontContainer" --format "{{.Names}}"
if ($running -eq $FrontContainer) {
  Write-Host "Removiendo contenedor '$FrontContainer'…"
  docker rm -f $FrontContainer | Out-Null
}

Write-Host "Apagando DB + Adminer…"
docker compose -f "$InfraCompose" down -v
# Para borrar datos: usar 'down -v'

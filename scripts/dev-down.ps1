# scripts\dev-down.ps1
$ErrorActionPreference = "Stop"

$Root = Split-Path $PSScriptRoot -Parent
$InfraCompose = Join-Path $Root "infra\local\db_inscripcion\docker-compose.yml"
$RootCompose  = Join-Path $Root "docker-compose.yml"

Write-Host " Apagando servicios (api/auth/inscripcion/pago)…"
docker compose -f "$RootCompose" down

Write-Host " Apagando DB + Adminer…"
docker compose -f "$InfraCompose" down

# Para reset total de la DB (⚠️ borra datos del volumen):
docker compose -f "$InfraCompose" down -v

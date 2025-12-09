$ErrorActionPreference = "Stop"

Write-Host "========================================================="
Write-Host "      🚀 UTF - Sistema Completo en Kubernetes (Windows)"
Write-Host "========================================================="

# ------------------------------
# 1. Iniciar Minikube si no está corriendo
# ------------------------------
$status = minikube status 2>$null
if ($status -notmatch "host: Running") {
    Write-Host "[1/12] 🔧 Iniciando Minikube (4 CPU, 8GB RAM)..."
    minikube start --driver=docker --cpus=4 --memory=8192
} else {
    Write-Host "[1/12] ✔ Minikube ya está activo."
}

# ------------------------------
# 2. Habilitar Ingress
# ------------------------------
Write-Host "[2/12] 🌐 Habilitando Ingress..."
minikube addons enable ingress | Out-Null

# ------------------------------
# 3. Habilitar Metrics Server
# ------------------------------
Write-Host "[3/12] 📊 Habilitando metrics-server..."
minikube addons enable metrics-server | Out-Null

# ------------------------------
# 4. Configurar Docker interno de Minikube
# ------------------------------
Write-Host "[4/12] 🔧 Configurando docker-env..."
minikube -p minikube docker-env --shell powershell | Invoke-Expression

# ------------------------------
# 5. Construir imágenes
# ------------------------------
Write-Host "[5/12] 🛠 Construyendo imágenes..."

docker build -t api-gateway:1.0 ./api
docker build -t auth:1.0        ./auth
docker build -t inscripcion:1.0 ./inscripcion
docker build -t pago:1.0        ./pago
docker build -t front:1.0       ./Front_Inscripciones

Write-Host "✔ Imágenes construidas."

# ------------------------------
# 6. Namespace
# ------------------------------
Write-Host "[6/12] 🏷 Creando namespace (si no existe)..."

kubectl get ns sgal 2>$null
if ($LASTEXITCODE -ne 0) {
    kubectl create namespace sgal
}

# Si tienes labels en namespace.yaml, se aplican igual
kubectl apply -f k8s/namespace.yaml 2>$null

# ------------------------------
# 7. Postgres
# ------------------------------
Write-Host "[7/12] 🗄 Desplegando Postgres..."
kubectl apply -n sgal -f k8s/postgres.yaml
Write-Host "⏳ Esperando a que Postgres esté disponible..."
kubectl rollout status deploy/postgres -n sgal --timeout=180s

Write-Host "✔ Postgres arriba."

# ------------------------------
# 8. Cargar SQL inicial
# ------------------------------
Write-Host "[8/12] 🗃 Cargando 001_schema.sql en Postgres del cluster..."

$POSTGRES_POD = kubectl get pod -n sgal -l app=postgres -o jsonpath='{.items[0].metadata.name}'

kubectl cp infra/local/db_inscripcion/initdb/001_schema.sql `
    "sgal/${POSTGRES_POD}:/tmp/001_schema.sql"


kubectl exec -n sgal $POSTGRES_POD -- `
    psql -U appuser -d inscripciones -f /tmp/001_schema.sql `
    || Write-Host "⚠ No se pudo ejecutar 001_schema.sql (puede que ya esté aplicado)."

# ------------------------------
# 9. PgBouncer
# ------------------------------
Write-Host "[9/12] 🧩 Desplegando PgBouncer..."
kubectl apply -n sgal -f k8s/pgbouncer.yaml
Write-Host "⏳ Esperando a que PgBouncer esté disponible..."
kubectl rollout status deploy/pgbouncer -n sgal --timeout=180s

Write-Host "✔ PgBouncer arriba."

# ------------------------------
# 10. Migraciones Prisma
# ------------------------------
Write-Host "[10/12] 📜 Aplicando migraciones Prisma (inscripcion)..."

kubectl delete pod prisma-migrate -n sgal --ignore-not-found=true

kubectl run prisma-migrate `
  -n sgal `
  --image=inscripcion:1.0 `
  --restart=Never `
  --env="DATABASE_URL=postgresql://appuser:appsecret@postgres:5432/inscripciones?schema=public" `
  -- npx prisma migrate deploy

Write-Host "⏳ Esperando a que finalicen las migraciones..."
kubectl wait --for=condition=Succeeded pod/prisma-migrate -n sgal --timeout=180s `
  || Write-Host "⚠ prisma-migrate no llegó a Succeeded. Revisa logs con: kubectl logs pod/prisma-migrate -n sgal"

kubectl delete pod prisma-migrate -n sgal --ignore-not-found=true

Write-Host "✔ Migraciones Prisma ejecutadas."

# ------------------------------
# 11. Redis
# ------------------------------
Write-Host "[11/12] 🧠 Desplegando Redis..."
kubectl apply -n sgal -f k8s/redis.yaml
Write-Host "⏳ Esperando a que Redis esté disponible..."
kubectl rollout status deploy/redis -n sgal --timeout=180s

Write-Host "✔ Redis arriba."

# ------------------------------
# 12. Microservicios de negocio + HPA
# ------------------------------
Write-Host "[12/12] 🚀 Desplegando microservicios y HPAs..."

# Inscripción primero (usa PgBouncer + Redis)
kubectl apply -n sgal -f k8s/inscripcion.yaml

# Ingress (si aplica a tu diseño)
kubectl apply -n sgal -f k8s/ingress-gateway.yaml 2>$null

# Otros microservicios
kubectl apply -n sgal -f k8s/auth.yaml
kubectl apply -n sgal -f k8s/pago.yaml
kubectl apply -n sgal -f k8s/api-gateway.yaml
kubectl apply -n sgal -f k8s/front.yaml

# HPAs
kubectl apply -n sgal -f k8s/inscripcion-hpa.yaml
kubectl apply -n sgal -f k8s/auth-hpa.yaml
kubectl apply -n sgal -f k8s/pago-hpa.yaml
kubectl apply -n sgal -f k8s/api-gateway-hpa.yaml

Write-Host "⏳ Esperando deployments críticos..."

$critical_deploys = @("postgres", "pgbouncer", "redis", "inscripcion", "auth", "pago", "api-gateway")

foreach ($dep in $critical_deploys) {
    Write-Host "   - $dep"
    kubectl rollout status deploy/$dep -n sgal --timeout=180s `
      || Write-Host "⚠ $dep no llegó a Available. Revisa: kubectl describe deploy/$dep -n sgal"
}

# ------------------------------
# Información final
# ------------------------------
Write-Host ""
Write-Host "[INFO] 🔍 Listado de servicios en el namespace sgal:"
kubectl get svc -n sgal

$IP = minikube ip
$GATEWAY_PORT = kubectl get svc api-gateway -n sgal -o jsonpath='{.spec.ports[0].nodePort}'
$FRONT_PORT   = kubectl get svc front       -n sgal -o jsonpath='{.spec.ports[0].nodePort}'

Write-Host ""
Write-Host "========================================================="
Write-Host "             🎉 SISTEMA LISTO PARA USAR (K8s) 🎉"
Write-Host "========================================================="
Write-Host ("🌐 API Gateway:    http://{0}:{1}/" -f $IP, $GATEWAY_PORT)
Write-Host ("🟢 Health:         http://{0}:{1}/healthz" -f $IP, $GATEWAY_PORT)
Write-Host ("📘 Inscripción:    http://{0}:{1}/inscripcion/health" -f $IP, $GATEWAY_PORT)
Write-Host ("🖥 Front-end:      http://{0}:{1}/" -f $IP, $FRONT_PORT)
Write-Host ""
Write-Host "========================================================="
Write-Host "   Ver pods en vivo:"
Write-Host "   kubectl get pods -n sgal -w"
Write-Host "========================================================="

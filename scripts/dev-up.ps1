Write-Host "========================================================="
Write-Host "      UTF - Sistema Completo en Kubernetes (Windows)"
Write-Host "========================================================="

# 1. Iniciar Minikube
Write-Host "[1/12] Iniciando Minikube (4 CPU, 8GB RAM)..."
minikube start --driver=docker --cpus=4 --memory=8192

# 2. Habilitar addons
Write-Host "[2/12] Habilitando Ingress y metrics-server..."
minikube addons enable ingress
minikube addons enable metrics-server

# 3. Configurar Docker-env
Write-Host "[3/12] Configurando Docker interno de Minikube..."
& minikube -p minikube docker-env --shell powershell | Invoke-Expression

# 4. Construir imágenes
Write-Host "[4/12] Construyendo imágenes..."
docker build -t api-gateway:1.0 ./api
docker build -t auth:1.0 ./auth
docker build -t inscripcion:1.0 ./inscripcion
docker build -t pago:1.0 ./pago
docker build -t front:1.0 ./Front_Inscripciones

# 5. Namespace
Write-Host "[5/12] Creando namespace sgal..."
minikube kubectl -- create namespace sgal 2>$null
minikube kubectl -- apply -f k8s/namespace.yaml

# 6. Postgres
Write-Host "[6/12] Desplegando Postgres..."
minikube kubectl -- apply -n sgal -f k8s/postgres.yaml
minikube kubectl -- rollout status deploy/postgres -n sgal

# 7. PgBouncer
Write-Host "[7/12] Desplegando PgBouncer..."
minikube kubectl -- apply -n sgal -f k8s/pgbouncer.yaml
minikube kubectl -- rollout status deploy/pgbouncer -n sgal

# 8. Redis
Write-Host "[8/12] Desplegando Redis..."
minikube kubectl -- apply -n sgal -f k8s/redis.yaml
minikube kubectl -- rollout status deploy/redis -n sgal

# 9. Microservicios
Write-Host "[9/12] Desplegando microservicios..."
minikube kubectl -- apply -n sgal -f k8s/auth.yaml
minikube kubectl -- apply -n sgal -f k8s/inscripcion.yaml
minikube kubectl -- apply -n sgal -f k8s/pago.yaml
minikube kubectl -- apply -n sgal -f k8s/api-gateway.yaml
minikube kubectl -- apply -n sgal -f k8s/front.yaml

# 10. Mostrar servicios
Write-Host "[10/12] Servicios activos:"
minikube kubectl -- get svc -n sgal

Write-Host "========================================================="
Write-Host "Sistema levantado correctamente"
Write-Host "========================================================="

#!/usr/bin/env bash
set -e

echo "========================================================="
echo "      🚀 UTF - Sistema Completo en Kubernetes"
echo "========================================================="

# ------------------------------
# 1. Iniciar Minikube si no está corriendo
# ------------------------------
if ! minikube status | grep -q "host: Running"; then
  echo "[1/9] 🔧 Iniciando Minikube..."
  minikube start --driver=docker
else
  echo "[1/9] ✔ Minikube ya está activo."
fi

# ------------------------------
# 2. Usar docker interno del cluster
# ------------------------------
echo "[2/9] 🔧 Configurando docker-env de Minikube..."
eval $(minikube -p minikube docker-env)

# ------------------------------
# 3. Construir imágenes locales
# ------------------------------
echo "[3/9] 🛠 Construyendo imágenes de microservicios..."

docker build -t api-gateway:1.0      ./api
docker build -t auth:1.0             ./auth
docker build -t inscripcion:1.0      ./inscripcion
docker build -t pago:1.0             ./pago
docker build -t front:1.0            ./Front_Inscripciones

echo "✔ Imágenes construidas y cargadas dentro de Minikube."

# ------------------------------
# 4. Crear namespace si no existe
# ------------------------------
echo "[4/9] 🏷 Creando namespace 'sgal' (si no existe)..."

minikube kubectl -- get ns sgal >/dev/null 2>&1 || \
  minikube kubectl -- create namespace sgal

# ------------------------------
# 5. Infraestructura: Postgres primero
# ------------------------------
echo "[5/9] 🗄 Aplicando Postgres (infra de base de datos)..."

# (si tienes namespace.yaml con labels, lo aplicamos igual)
minikube kubectl -- apply -f k8s/namespace.yaml || true

minikube kubectl -- apply -n sgal -f k8s/postgres.yaml

echo "⏳ Esperando a que Postgres esté disponible..."
minikube kubectl -- rollout status deploy/postgres -n sgal --timeout=120s

echo "✔ Postgres arriba."

# ------------------------------
# 6. Infraestructura: PgBouncer (pool de conexiones)
# ------------------------------
echo "[6/9] 🧩 Aplicando PgBouncer (pool de conexiones)..."

minikube kubectl -- apply -n sgal -f k8s/pgbouncer.yaml

echo "⏳ Esperando a que PgBouncer esté disponible..."
minikube kubectl -- rollout status deploy/pgbouncer -n sgal --timeout=120s

echo "✔ PgBouncer arriba."

# ------------------------------
# 7. Servicios de negocio (Inscripción primero)
# ------------------------------
echo "[7/9] 🧮 Aplicando servicio de Inscripción (usa PgBouncer)..."

minikube kubectl -- apply -n sgal -f k8s/inscripcion.yaml

echo "⏳ Esperando a que Inscripción esté disponible..."
minikube kubectl -- rollout status deploy/inscripcion -n sgal --timeout=180s

echo "✔ Inscripción arriba."

echo "📦 Aplicando otros microservicios (Auth, Pago, API Gateway, Front, HPA)..."

minikube kubectl -- apply -n sgal -f k8s/auth.yaml
minikube kubectl -- apply -n sgal -f k8s/pago.yaml
minikube kubectl -- apply -n sgal -f k8s/api-gateway.yaml
minikube kubectl -- apply -n sgal -f k8s/front.yaml
minikube kubectl -- apply -n sgal -f k8s/inscripcion-hpa.yaml

echo "⏳ Esperando a que todos los deployments estén disponibles..."
minikube kubectl -- wait --for=condition=available --timeout=180s deployment --all -n sgal

# ------------------------------
# 8. Mostrar servicios
# ------------------------------
echo "[8/9] 🔍 Listado de servicios en el namespace sgal:"
minikube kubectl -- get svc -n sgal

# ------------------------------
# 9. Mostrar URLs finales
# ------------------------------
IP=$(minikube ip)
GATEWAY_PORT=$(minikube kubectl -- get svc api-gateway -n sgal -o=jsonpath='{.spec.ports[0].nodePort}')
FRONT_PORT=$(minikube kubectl -- get svc front -n sgal -o=jsonpath='{.spec.ports[0].nodePort}')

echo ""
echo "========================================================="
echo "             🎉 SISTEMA LISTO PARA USAR 🎉"
echo "========================================================="
echo "🌐 API Gateway:      http://$IP:$GATEWAY_PORT/"
echo "🟢 Health Gateway:   http://$IP:$GATEWAY_PORT/healthz"
echo "📘 Inscripcion:      http://$IP:$GATEWAY_PORT/inscripcion/health"
echo "🖥 Front-end:        http://$IP:$FRONT_PORT/"
echo ""
echo "========================================================="
echo "         Ver pods en vivo:"
echo "   minikube kubectl -- get pods -n sgal -w"
echo "========================================================="

#!/usr/bin/env bash
set -e

echo "========================================================="
echo "      🚀 UTF - Sistema Completo en Kubernetes"
echo "========================================================="

# ------------------------------
# 1. Iniciar Minikube si no está corriendo (con más CPU/RAM)
# ------------------------------
if ! minikube status | grep -q "host: Running"; then
  echo "[1/12] 🔧 Iniciando Minikube (4 CPU, 8GB RAM)..."
  minikube start \
    --driver=docker \
    --cpus=4 \
    --memory=8192
else
  echo "[1/12] ✔ Minikube ya está activo."
fi

# ------------------------------
# 2. Habilitar metrics-server (requisito para HPA)
# ------------------------------
echo "[2/12] 📊 Habilitando metrics-server..."
minikube addons enable metrics-server >/dev/null 2>&1 || true

# ------------------------------
# 3. Usar docker interno del cluster
# ------------------------------
echo "[3/12] 🔧 Configurando docker-env de Minikube..."
eval "$(minikube -p minikube docker-env)"

# ------------------------------
# 4. Construir imágenes locales
# ------------------------------
echo "[4/12] 🛠 Construyendo imágenes de microservicios..."

docker build -t api-gateway:1.0      ./api
docker build -t auth:1.0             ./auth
docker build -t inscripcion:1.0      ./inscripcion
docker build -t pago:1.0             ./pago
docker build -t front:1.0            ./Front_Inscripciones

echo "✔ Imágenes construidas y cargadas dentro de Minikube."

# ------------------------------
# 5. Crear namespace si no existe
# ------------------------------
echo "[5/12] 🏷 Creando namespace 'sgal' (si no existe)..."

minikube kubectl -- get ns sgal >/dev/null 2>&1 || \
  minikube kubectl -- create namespace sgal

# (si tienes namespace.yaml con labels, lo aplicamos igual)
minikube kubectl -- apply -f k8s/namespace.yaml || true

# ------------------------------
# 6. Infraestructura: Postgres primero
# ------------------------------
echo "[6/12] 🗄 Aplicando Postgres (infra de base de datos)..."

minikube kubectl -- apply -n sgal -f k8s/postgres.yaml

echo "⏳ Esperando a que Postgres esté disponible..."
minikube kubectl -- rollout status deploy/postgres -n sgal --timeout=180s

echo "✔ Postgres arriba."

echo "[6.1/12] 🗃 Cargando esquema inicial (001_schema.sql) en Postgres del cluster..."

POSTGRES_POD=$(minikube kubectl -- get pod -n sgal -l app=postgres -o jsonpath='{.items[0].metadata.name}')

# Copiar el SQL al pod
minikube kubectl -- cp infra/local/db_inscripcion/initdb/001_schema.sql \
  sgal/$POSTGRES_POD:/tmp/001_schema.sql

# Ejecutar el SQL
minikube kubectl -- exec -n sgal $POSTGRES_POD -- \
  psql -U appuser -d inscripciones -f /tmp/001_schema.sql || {
  echo "⚠ No se pudo ejecutar 001_schema.sql (puede que ya esté aplicado)."
}

# ------------------------------
# 7. Infraestructura: PgBouncer (pool de conexiones)
# ------------------------------
echo "[7/12] 🧩 Aplicando PgBouncer (pool de conexiones)..."

minikube kubectl -- apply -n sgal -f k8s/pgbouncer.yaml

echo "⏳ Esperando a que PgBouncer esté disponible..."
minikube kubectl -- rollout status deploy/pgbouncer -n sgal --timeout=180s

echo "✔ PgBouncer arriba."

# ------------------------------
# 8. Migraciones Prisma (inscripción)
# ------------------------------
echo "[8/12] 📜 Aplicando migraciones Prisma (inscripcion)..."

# Limpia un pod previo de migraciones si existiera
minikube kubectl -- delete pod prisma-migrate -n sgal --ignore-not-found=true

# Ejecuta npx prisma migrate deploy dentro del cluster
minikube kubectl -- run prisma-migrate \
  -n sgal \
  --image=inscripcion:1.0 \
  --restart=Never \
  --env="DATABASE_URL=postgresql://appuser:appsecret@postgres:5432/inscripciones?schema=public" \
  -- npx prisma migrate deploy

echo "⏳ Esperando a que finalicen las migraciones..."
minikube kubectl -- wait --for=condition=Succeeded pod/prisma-migrate -n sgal --timeout=180s || \
  echo "⚠️ prisma-migrate no llegó a Succeeded. Revisa logs con: minikube kubectl -- logs pod/prisma-migrate -n sgal"

minikube kubectl -- delete pod prisma-migrate -n sgal --ignore-not-found=true

echo "✔ Migraciones Prisma ejecutadas."

# ------------------------------
# 9. Infraestructura: Redis (cache)
# ------------------------------
echo "[9/12] 🧠 Aplicando Redis (cache)..."

minikube kubectl -- apply -n sgal -f k8s/redis.yaml

echo "⏳ Esperando a que Redis esté disponible..."
minikube kubectl -- rollout status deploy/redis -n sgal --timeout=180s

echo "✔ Redis arriba."

# ------------------------------
# 10. Servicios de negocio (Inscripción primero)
# ------------------------------
echo "[10/12] 🧮 Aplicando servicio de Inscripción (usa PgBouncer + Redis)..."

minikube kubectl -- apply -n sgal -f k8s/inscripcion.yaml

echo "⏳ Esperando a que Inscripción esté disponible..."
minikube kubectl -- rollout status deploy/inscripcion -n sgal --timeout=180s

echo "✔ Inscripción arriba."

# ------------------------------
# 11. Otros microservicios + HPA
# ------------------------------
echo "[11/12] 📦 Aplicando otros microservicios (Auth, Pago, API Gateway, Front, HPAs)..."

minikube kubectl -- apply -n sgal -f k8s/auth.yaml
minikube kubectl -- apply -n sgal -f k8s/pago.yaml
minikube kubectl -- apply -n sgal -f k8s/api-gateway.yaml
minikube kubectl -- apply -n sgal -f k8s/front.yaml

# HPAs para todos los servicios críticos
minikube kubectl -- apply -n sgal -f k8s/inscripcion-hpa.yaml
minikube kubectl -- apply -n sgal -f k8s/auth-hpa.yaml
minikube kubectl -- apply -n sgal -f k8s/pago-hpa.yaml
minikube kubectl -- apply -n sgal -f k8s/api-gateway-hpa.yaml

echo "⏳ Esperando a que los deployments CRÍTICOS estén disponibles..."

critical_deploys=("postgres" "pgbouncer" "redis" "inscripcion" "auth" "pago" "api-gateway")

for dep in "${critical_deploys[@]}"; do
  echo "   - $dep"
  minikube kubectl -- rollout status deploy/$dep -n sgal --timeout=180s || \
    echo "⚠️ $dep no llegó a Available. Revisa: minikube kubectl -- describe deploy/$dep -n sgal"
done

# ------------------------------
# 12. Mostrar servicios
# ------------------------------
echo "[12/12] 🔍 Listado de servicios en el namespace sgal:"
minikube kubectl -- get svc -n sgal

IP=$(minikube ip)
GATEWAY_PORT=$(minikube kubectl -- get svc api-gateway -n sgal -o=jsonpath='{.spec.ports[0].nodePort}')
FRONT_PORT=$(minikube kubectl -- get svc front -n sgal -o=jsonpath='{.spec.ports[0].nodePort}')

echo ""
echo "========================================================="
echo "             🎉 SISTEMA LISTO PARA USAR (K8s) 🎉"
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

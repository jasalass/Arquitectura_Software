#!/usr/bin/env bash
set -e

echo "========================================================="
echo "   🧨 RESET COMPLETO DE MINIKUBE + NAMESPACE SGAL"
echo "========================================================="

# 0. Confirmación opcional
echo "Este script eliminará:"
echo " - Namespace 'sgal'"
echo " - TODOS los deployments, pods, services, PV, PVC"
echo " - Imágenes locales cargadas en Minikube"
echo " - Volúmenes persistentes"
echo " - ConfigMaps, Secrets, HPAs"
echo ""

# ------------------------------
# 1. Borrar namespace SGAL
# ------------------------------
echo "🗑 Eliminando namespace 'sgal'..."
minikube kubectl -- delete namespace sgal --ignore-not-found=true

# Esperar un poco para evitar conflictos
sleep 5

# ------------------------------
# 2. Borrar PersistentVolumes
# ------------------------------
echo "🗑 Eliminando PV asociados..."
minikube kubectl -- delete pv --all --ignore-not-found=true

# ------------------------------
# 3. Borrar imágenes locales dentro de Minikube
# ------------------------------
echo "🗑 Eliminando imágenes locales de Minikube..."
eval "$(minikube -p minikube docker-env)"

docker rmi -f api-gateway:1.0 || true
docker rmi -f auth:1.0 || true
docker rmi -f inscripcion:1.0 || true
docker rmi -f pago:1.0 || true
docker rmi -f front:1.0 || true

echo "✔ Imágenes eliminadas."

# ------------------------------
# 4. Eliminar pods huérfanos (si quedaron)
# ------------------------------
echo "🧹 Limpiando pods huérfanos..."
minikube kubectl -- delete pod --all --force --grace-period=0 --ignore-not-found=true

# ------------------------------
# 5. Reiniciamos Minikube (opcional pero recomendado)
# ------------------------------
echo "♻ Reiniciando Minikube..."
minikube stop
minikube delete --all --purge

echo "========================================================="
echo "   🎉 RESET COMPLETO TERMINADO"
echo "========================================================="
echo "Ahora puedes ejecutar tu script principal:"
echo ""
echo "   ./dev-up.sh"
echo ""
echo "para desplegar TODO desde cero."
echo "========================================================="

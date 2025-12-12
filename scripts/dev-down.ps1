Write-Host "========================================================="
Write-Host "   🧹 UTF - Detención y Limpieza del Entorno Kubernetes"
Write-Host "========================================================="

# ------------------------------
# 1. Verificar Minikube
# ------------------------------
Write-Host "[1/6] Verificando estado de Minikube..."

$minikubeStatus = minikube status 2>$null
if (-not $minikubeStatus) {
    Write-Host "⚠ Minikube no está instalado o no está accesible."
    exit 1
}

# ------------------------------
# 2. Eliminar namespace del sistema
# ------------------------------
Write-Host "[2/6] 🗑 Eliminando namespace 'sgal'..."

minikube kubectl -- delete namespace sgal --ignore-not-found=true

Write-Host "⏳ Esperando eliminación del namespace..."
Start-Sleep -Seconds 5

# ------------------------------
# 3. Eliminar recursos huérfanos (por seguridad)
# ------------------------------
Write-Host "[3/6] 🧽 Limpiando recursos huérfanos..."

minikube kubectl -- delete pod --all -n default --ignore-not-found=true
minikube kubectl -- delete svc --all -n default --ignore-not-found=true
minikube kubectl -- delete deploy --all -n default --ignore-not-found=true

# ------------------------------
# 4. Detener Minikube
# ------------------------------
Write-Host "[4/6] ⏹ Deteniendo Minikube..."

minikube stop

# ------------------------------
# 5. Eliminar cluster completamente
# ------------------------------
Write-Host "[5/6] ❌ Eliminando cluster Minikube..."

minikube delete --all

# ------------------------------
# 6. Limpieza final de Docker (opcional pero recomendada)
# ------------------------------
Write-Host "[6/6] 🐳 Limpieza de imágenes Docker no usadas..."

docker system prune -f

Write-Host ""
Write-Host "========================================================="
Write-Host "   ✅ ENTORNO COMPLETAMENTE ELIMINADO"
Write-Host "========================================================="
Write-Host "Minikube, Kubernetes, pods, servicios e imágenes eliminados."
Write-Host ""

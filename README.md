# 🎓 Sistema de Inscripciones UTF
Arquitectura de Microservicios desplegada en Kubernetes (Minikube)

----------------------------------------------------------------

## 📌 Descripción General

Este proyecto implementa un Sistema de Inscripciones Académicas basado en una arquitectura de microservicios, desplegada sobre Kubernetes, utilizando Minikube como entorno local de ejecución.

El objetivo del sistema es demostrar:
- Separación de responsabilidades
- Escalabilidad horizontal
- Resiliencia
- Automatización de despliegue
- Evaluación bajo carga

Proyecto desarrollado en el contexto del Examen Final de Arquitectura de Software.

----------------------------------------------------------------

## 🧱 Arquitectura del Sistema

El sistema está compuesto por los siguientes componentes:

Front-end  
SPA Angular/Ionic servida por Nginx.

API Gateway  
Punto único de entrada al backend.

Microservicios  
- Auth  
- Inscripción  
- Pago  

Infraestructura  
- PostgreSQL  
- PgBouncer (pool de conexiones)  
- Redis (cache)  

Plataforma  
- Kubernetes (Minikube)  
- Ingress Controller  
- Horizontal Pod Autoscaler (HPA)  

Todo el sistema se despliega dentro del namespace `sgal`.

----------------------------------------------------------------

## ⚙️ Requisitos del Entorno

Requisitos obligatorios:
- Docker (en ejecución)
- Minikube
- Git

Recomendado:
- 4 CPU
- 8 GB de RAM

Sistemas compatibles:
- Linux
- macOS
- Windows (PowerShell)

----------------------------------------------------------------

## 🚀 Ejecución del Sistema

El despliegue completo está 100% automatizado mediante scripts.

----------------------------------------------------------------

## 🐧 Linux / macOS / WSL

Ejecutar todos los comandos en orden:

git clone <URL_DEL_REPOSITORIO>
cd Arquitectura_Software

chmod +x scripts/dev-up.sh
chmod +x scripts/reset-k8s.sh

./scripts/dev-up.sh

----------------------------------------------------------------

## 🪟 Windows (PowerShell)

Ejecutar todos los comandos en orden desde PowerShell:

git clone <URL_DEL_REPOSITORIO>
cd Arquitectura_Software

Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass

.\scripts\dev-up.ps1

----------------------------------------------------------------

## 🧪 Ejecución de Tests (Pruebas de Carga)

Las pruebas de carga están definidas como archivos YAML dentro de la carpeta `tests/`.
Estos archivos describen escenarios de prueba escalonados (usuarios concurrentes, ramp-up, duración y endpoints).

Los tests se ejecutan contra el sistema ya desplegado en Kubernetes.

----------------------------------------------------------------

### 📂 Ubicación de los tests

tests/

Cada archivo YAML representa un escenario distinto (por ejemplo: 50, 300, 600, 1000, 5000 o 10000 usuarios concurrentes).

----------------------------------------------------------------

### ▶️ Ejecutar tests desde Linux / macOS / WSL

Ubicarse en la raíz del proyecto y ejecutar:

kubectl config use-context minikube

kubectl apply -f tests/

O bien ejecutar un test específico:

kubectl apply -f tests/test-1000-users.yaml

----------------------------------------------------------------

### ▶️ Ejecutar tests desde Windows (PowerShell)

Ubicarse en la raíz del proyecto y ejecutar:

kubectl config use-context minikube

kubectl apply -f tests\

O bien ejecutar un test específico:

kubectl apply -f tests\test-1000-users.yaml

----------------------------------------------------------------

### 📊 Visualización de resultados

Durante la ejecución de los tests se puede observar el comportamiento del sistema con:

kubectl get pods -n sgal -w

minikube dashboard

Los resultados (latencias, errores, throughput) se analizan a partir de:
- logs de los pods
- métricas de CPU y memoria
- comportamiento del HPA

----------------------------------------------------------------

## 🌐 Acceso a la Aplicación

Al finalizar el script, se mostrarán automáticamente las URLs de acceso, por ejemplo:

Front-end:   http://IP_MINIKUBE:PUERTO  
API Gateway: http://IP_MINIKUBE:PUERTO  

----------------------------------------------------------------

## 📊 Visualización Gráfica (Kubernetes)

Para visualizar pods, servicios, HPAs y estado del clúster:

minikube dashboard

----------------------------------------------------------------

## 🧹 Eliminación del Entorno (Reset)

Linux / macOS / WSL:

./scripts/reset-k8s.sh

Windows (PowerShell):

.\scripts\dev-down.ps1

Estos scripts realizan lo siguiente:
- Eliminan el namespace `sgal`
- Detienen Minikube
- Borran el clúster completo
- Limpian recursos de Kubernetes y Docker

----------------------------------------------------------------

## 📈 Escalabilidad y Rendimiento

- HPAs configurados en servicios críticos
- Metrics Server habilitado
- Escalamiento automático según CPU
- Pruebas de carga realizadas hasta 10.000 usuarios concurrentes
- Saturación atribuida al entorno single-node de Minikube

----------------------------------------------------------------

## 🔐 Seguridad

- Headers HTTP de seguridad
- CORS controlado
- Política CSP configurada
- Eliminación de headers sensibles
- Análisis OWASP ZAP aplicado

----------------------------------------------------------------

## 📎 Notas Finales

Este proyecto demuestra una arquitectura realista, reproducible y automatizada, alineada con buenas prácticas modernas de Kubernetes y microservicios.

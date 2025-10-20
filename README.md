# 🏗️ Sistema de Inscripción Académica
**Proyecto Integrado – Arquitectura de Software (Microservicios + Frontend Angular/Ionic)**

Este proyecto implementa una arquitectura basada en microservicios, desplegada con Docker Compose, un API Gateway, una base de datos PostgreSQL y un frontend Angular/Ionic como capa de presentación.

🎓 **Proyecto académico desarrollado para la asignatura Arquitectura de Software**, enfocado en comprender cómo se integran los componentes de una arquitectura moderna distribuida.

---

## 🧠 Objetivo general

Desarrollar un sistema modular que permita:

- ✅ Autenticación de usuarios  
- 📚 Gestión de asignaturas e inscripciones  
- 💰 Consulta del estado financiero del alumno  
- 🌐 Comunicación mediante un API Gateway central  
- 💻 Visualización en un frontend Angular/Ionic  

---

## 🧩 Componentes principales

| Componente | Descripción | Puerto | Tecnología |
|-------------|--------------|--------|-------------|
| 🟩 **API Gateway** | Entrada única para los microservicios. Maneja rutas, CORS y proxy. | 3000 | Node.js / Express |
| 🔐 **Auth** | Servicio de autenticación demo (usuarios en memoria). | 4000 | Node.js / Express |
| 🎓 **Inscripción** | Gestión académica, inscripciones, prerrequisitos y estado financiero. | 5000 | Node.js / Prisma / PostgreSQL |
| 💳 **Pago (Demo)** | Servicio simulado de comunicación. | 7000 | Node.js |
| 🗄️ **PostgreSQL** | Base de datos principal. | 5433 → 5432 | PostgreSQL 16 |
| 🌐 **Adminer** | Panel web para administrar la base de datos. | 8080 | PHP / Adminer |
| 💻 **Frontend (Angular/Ionic)** | Capa visual del sistema; consume el Gateway y microservicios. | **8100** | Angular 20 / Ionic 8 / **Nginx** |

---

## 🌍 Arquitectura general

**Estructura funcional:**  
Frontend Angular/Ionic (8100) → API Gateway (3000) → Microservicios (4000–7000) → Base de Datos PostgreSQL (5433)

**Flujo general:**  
Frontend → API Gateway → Microservicios → Base de Datos

---

## 🔌 Tabla de puertos y accesos

| Servicio | Tipo | URL / Acceso | Descripción |
|-----------|------|--------------|--------------|
| 💻 Frontend Angular/Ionic | UI | **http://localhost:8100** | Interfaz de usuario integrada (**Docker/Nginx**) |
| 🟩 API Gateway | Backend | http://localhost:3000 | Entrada a los microservicios |
| 🔐 Auth | Backend | http://localhost:4000 | Servicio de autenticación |
| 🎓 Inscripción | Backend | http://localhost:5000/inscripcion | Servicio académico |
| 💳 Pago (demo) | Backend | http://localhost:7000/hola | Endpoint de prueba |
| 🗄️ PostgreSQL | Base de datos | 127.0.0.1:5433 | Base de datos académica |
| 🌐 Adminer | Herramienta DB | http://localhost:8080 | Panel visual de administración |

---

## ⚙️ Estructura del repositorio

```
Arquitectura_Software/
├── api/                     # API Gateway
├── auth/                    # Servicio de autenticación
├── inscripcion/             # Servicio académico (Prisma + PostgreSQL)
├── pago/                    # Servicio demo
├── Front_Inscripciones/     # Frontend Angular/Ionic
│   ├── Dockerfile           # Build multi-stage + Nginx
│   └── nginx.conf           # Reverse proxy/SPA routing
├── infra/
│   └── local/db_inscripcion # Postgres + Adminer + seeds SQL
├── scripts/
│   ├── dev-up.ps1           # Levanta todo el entorno
│   └── dev-down.ps1         # Apaga o resetea el entorno
└── docker-compose.yml       # Orquestación raíz
```

---

## 🧱 Arquitectura por capas

| Capa | Componentes | Descripción |
|------|--------------|-------------|
| Presentación | Frontend Angular/Ionic | Interfaz gráfica que consume los endpoints del Gateway. |
| Negocio | Auth / Inscripción / Pago | Lógica de aplicación segmentada por dominio. |
| Infraestructura | Postgres + Adminer | Persistencia y gestión de datos. |
| Orquestación | API Gateway + Scripts | Comunicación, despliegue y automatización. |

---

## 🚀 Ejecución rápida

1. Modificar los archivos `.env.example` por `.env` (API/Auth deben permitir `CORS_ORIGIN=http://localhost:8100`).
2. Desde la carpeta raíz del proyecto:

```bash
cd scripts
.\dev-up.ps1
```

El script:
- Crea la red `utf_net`
- Levanta Postgres y Adminer
- Espera que la DB esté “healthy”
- Aplica migraciones Prisma
- **Construye y levanta todos los servicios, incluyendo el Frontend Angular/Ionic (8100)**

**Servicios disponibles:**
- 💻 Frontend → **http://localhost:8100**  
- 🟩 API Gateway → http://localhost:3000  
- 🔐 Auth → http://localhost:4000  
- 🎓 Inscripción → http://localhost:5000/inscripcion/health  
- 💳 Pago → http://localhost:7000  
- 🌐 Adminer → http://localhost:8080  
- 🗄️ Postgres → 127.0.0.1:5433  

### Apagar entorno

```bash
cd scripts
.\dev-down.ps1
```

> Para borrar completamente la base de datos local, descomenta:
> `docker compose -f "$InfraCompose" down -v`

---

## 🧪 Pruebas rápidas de endpoints

### Verificar salud general
```bash
curl http://localhost:3000/healthz
```

### Autenticación
```bash
curl -X POST http://localhost:4000/auth   -H "Content-Type: application/json"   -d '{"email":"user@email.com","password":"12345"}'
```

### Listar asignaturas
```bash
curl http://localhost:5000/inscripcion/asignaturas
```

### Estado financiero del alumno
```bash
curl http://localhost:5000/inscripcion/alumno-estado/<uuid>
```

---

## 📡 Endpoints principales (vía Gateway)

Base del Gateway: `http://localhost:3000`  
Cabeceras:  
`Content-Type: application/json`  
`Authorization: Bearer <token>` (opcional)

| # | Endpoint | Método | Descripción |
|---|-----------|---------|-------------|
| 1 | `/auth` | POST | Autenticación de usuario |
| 2 | `/auth-id` | POST | Resolver sesión por UUID |
| 3 | `/inscripcion/asignaturas` | GET | Listar asignaturas |
| 4 | `/inscripcion/alumnos/:alumnoRef/asignaturas` | GET | Asignaturas del alumno |
| 5 | `/inscripcion/inscripciones` | POST | Crear inscripción |
| 6 | `/inscripcion/alumno-estado/:alumnoRef` | GET | Consultar estado financiero |
| 7 | `/inscripcion/alumno-estado/:alumnoRef` | PATCH | Actualizar estado financiero |
| 8 | `/healthz` | GET | Salud del sistema |

---

## 💻 Frontend Angular/Ionic (detalles)

### 1) Servicio `front` en `docker-compose.yml`
```yaml
front:
  build:
    context: ./Front_Inscripciones
    dockerfile: Dockerfile
  container_name: front
  ports:
    - "8100:80"
  depends_on:
    - api
  networks:
    - utf_net
```

### 2) `Dockerfile` (multi-stage: build + Nginx)
```Dockerfile
# Etapa de build
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build  # genera /www (Ionic) o /dist/<app> (Angular)

# Etapa de runtime con Nginx
FROM nginx:1.27-alpine
# elimina default y copia conf SPA
RUN rm -f /etc/nginx/conf.d/default.conf
COPY nginx.conf /etc/nginx/conf.d/app.conf

# copia el artefacto (ajusta si tu build queda en /dist/APP)
COPY --from=builder /app/www /usr/share/nginx/html

# no root
RUN adduser -D -H -u 1001 appuser  && chown -R appuser:appuser /usr/share/nginx/html /var/cache/nginx /var/run /var/log/nginx
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

### 3) `nginx.conf` (SPA + fallback a `index.html`)
```nginx
server {
  listen 80;
  server_name _;
  root /usr/share/nginx/html;

  # archivos estáticos
  location / {
    try_files $uri $uri/ /index.html;
  }

  # ejemplo de proxy opcional (si necesitas pasar directo al gateway)
  # location /api/ {
  #   proxy_pass http://api-gateway:3000/;
  #   proxy_set_header Host $host;
  #   proxy_set_header X-Real-IP $remote_addr;
  #   proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
  # }
}
```

### 4) Variables de entorno del Front
`Front_Inscripciones/src/environments/environment.ts`
```ts
export const environment = {
  production: false,
  apiUrl: 'http://localhost:3000', // API Gateway
  authUrl: 'http://localhost:4000' // Auth (si lo consumes directo)
};
```

### 5) Requisitos de CORS (API/Auth)
Configura los servicios para permitir:
```
CORS_ORIGIN=http://localhost:8100
```

### 6) Ejecución local (desarrollo)
```bash
cd Front_Inscripciones
npm install
npm start    # o: ionic serve
```
> Para producción/stack completo usa `.\scripts\dev-up.ps1` (sirve el front con Nginx).

### 7) Rutas del Front
- El front debe consumir SIEMPRE el **Gateway** (`apiUrl`) para mantener el acoplamiento correcto.
- Si necesitas WebSockets, expónlos también vía Gateway.

---

## 🧰 Administración de la base de datos

Accede a Adminer → http://localhost:8080

| Campo | Valor |
|--------|-------|
| Sistema | PostgreSQL |
| Servidor | postgres |
| Usuario | appuser |
| Contraseña | appsecret |
| Base de datos | inscripciones |

---

## 🩺 Troubleshooting Front

- **Pantalla en blanco tras refrescar ruta**: asegúrate del `try_files ... /index.html;` en `nginx.conf` y del `baseHref` correcto en `angular.json` (generalmente `/`).  
- **CORS bloqueado**: revisa `CORS_ORIGIN=http://localhost:8100` en API/Auth.  
- **No encuentra `www`/`dist`**: valida el comando de build (`npm run build`) y la carpeta de salida que copia el Dockerfile.  
- **Iconos/Ionic no cargan**: confirma que los assets estén en `src/assets` y que `angular.json` los incluya.

---

## 📚 Conceptos aplicados

| Concepto | Implementación |
|-----------|----------------|
| Microservicios | Servicios independientes (auth, inscripcion, pago) |
| API Gateway | Ruteo y centralización de llamadas HTTP |
| Infraestructura como código | Docker Compose + scripts PowerShell |
| Desacoplamiento | Servicios separados con responsabilidades únicas |
| Persistencia independiente | Inscripción usa Postgres, Auth es in-memory |
| Health Checks | /healthz y /ready en todos los servicios |
| Automatización | Scripts dev-up.ps1 y dev-down.ps1 |
| Frontend integrado | Angular/Ionic servido por Nginx en 8100 |

---

## 🧭 Flujo general de comunicación

```text
[ Usuario (Frontend Angular/Ionic) ]
        │
        ▼
[ API Gateway (3000) ]
   ├── /auth/* → Auth (4000)
   ├── /inscripcion/* → Inscripción (5000)
   └── /hola → Pago (7000)
        │
        ▼
[ PostgreSQL + Adminer ]
```

---

## ✅ Estado actual del proyecto

- [x] Orquestación completa con Docker Compose  
- [x] Scripts PowerShell funcionales (`dev-up` / `dev-down`)  
- [x] Integración del Front Angular/Ionic (**puerto 8100**)  
- [x] Conexión funcional entre Gateway y microservicios  
- [x] Prisma conectado a PostgreSQL   

---
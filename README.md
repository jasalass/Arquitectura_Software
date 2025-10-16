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
| 💻 **Frontend (Angular/Ionic)** | Capa visual del sistema; consume el Gateway. | 4200 | Angular 20 / Ionic 8 |

---

## 🌍 Arquitectura general

**Estructura funcional:**  
Frontend Angular/Ionic (4200) → API Gateway (3000) → Microservicios (4000–7000) → Base de Datos PostgreSQL (5433)

**Flujo general:**  
Frontend → API Gateway → Microservicios → Base de Datos

---

## 🔌 Tabla de puertos y accesos

| Servicio | Tipo | URL / Acceso | Descripción |
|-----------|------|--------------|--------------|
| 💻 Frontend Angular/Ionic | UI | [http://localhost:4200](http://localhost:4200) | Interfaz del usuario |
| 🟩 API Gateway | Backend | [http://localhost:3000](http://localhost:3000) | Entrada a los microservicios |
| 🔐 Auth | Backend | [http://localhost:4000](http://localhost:4000) | Servicio de autenticación |
| 🎓 Inscripción | Backend | [http://localhost:5000/inscripcion](http://localhost:5000/inscripcion) | Servicio académico |
| 💳 Pago (demo) | Backend | [http://localhost:7000/hola](http://localhost:7000/hola) | Endpoint de prueba |
| 🗄️ PostgreSQL | Base de datos | 127.0.0.1:5433 | Base de datos académica |
| 🌐 Adminer | Herramienta DB | [http://localhost:8080](http://localhost:8080) | Panel visual de administración |

---

## ⚙️ Estructura del repositorio

```
Arquitectura_Software/
├── api/                     # API Gateway
├── auth/                    # Servicio de autenticación
├── inscripcion/             # Servicio académico (Prisma + PostgreSQL)
├── pago/                    # Servicio demo
├── Front_Inscripciones/     # Frontend Angular/Ionic
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

1. Modificar los archivos `.env.example` por `.env`
2. Desde la carpeta raíz del proyecto:

```bash
cd scripts
.\dev-up.ps1
```

El script:
- Crea red `utf_net`
- Levanta Postgres y Adminer
- Espera que la DB esté “healthy”
- Construye imágenes y aplica migraciones Prisma
- Levanta todos los servicios

**Servicios disponibles:**
- Adminer → http://localhost:8080
- Postgres → 127.0.0.1:5433
- Inscripción → http://localhost:5000/inscripcion/health
- API Gateway → http://localhost:3000
- Auth → http://localhost:4000
- Pago → http://localhost:7000

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

## 💻 Frontend Angular/Ionic

**Ejecución local:**
```bash
cd Front_Inscripciones
npm install
npm start
```

**Variables de entorno:**
```ts
export const environment = {
  production: false,
  apiUrl: 'http://localhost:3000',
  apiUrl2: 'http://localhost:4000'
};
```

**Interfaces recomendadas:**
```ts
export interface UserPayload {
  uuid: string; email: string; nombre: string; apellido: string;
  rut: string; roles: string[]; permisos: string[];
  carrera: string; plan: string; semestre_actual: number;
  avatar_url: string; ultimo_acceso: string; estado_matricula: 'PAGADA'|'PENDIENTE'|'BLOQUEADA';
}
```

---

## 🧰 Administración de la base de datos

Accede a Adminer → [http://localhost:8080](http://localhost:8080)

| Campo | Valor |
|--------|-------|
| Sistema | PostgreSQL |
| Servidor | postgres |
| Usuario | appuser |
| Contraseña | appsecret |
| Base de datos | inscripciones |

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
| Frontend integrado | Angular/Ionic comunica todo mediante el Gateway |

---

## 🧭 Flujo general de comunicación

```text
[ Usuario (Frontend) ]
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

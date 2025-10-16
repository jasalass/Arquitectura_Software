# 🏗️ Sistema de Inscripción Académica  
### Proyecto Integrado – Arquitectura de Software (Microservicios + Frontend Angular/Ionic)

Este proyecto demuestra una **arquitectura de software distribuida**, compuesta por microservicios desplegados con **Docker Compose**, un **API Gateway** central, una **base de datos PostgreSQL**, y un **frontend Angular/Ionic** como capa de presentación.

> 💡 Proyecto académico orientado a estudiantes de **Arquitectura de Software**, diseñado para comprender cómo interactúan los componentes de una arquitectura moderna basada en microservicios.

---

## 🧠 Objetivo general

Desarrollar y desplegar un sistema modular que permita:
- Gestionar **autenticación de usuarios**.  
- Administrar **asignaturas e inscripciones**.  
- Consultar el **estado financiero del alumno**.  
- Exponer todos los servicios a través de un **API Gateway** común.  
- Visualizar los datos desde un **frontend Angular/Ionic**.

---

## 🧩 Componentes principales

| Componente | Descripción | Puerto | Tecnología |
|-------------|-------------|--------|-------------|
| 🟩 **API Gateway** | Entrada única para todos los microservicios. Maneja CORS, rutas y proxy. | `3000` | Node.js / Express |
| 🔐 **Auth** | Autenticación demo (usuarios en memoria). | `4000` | Node.js / Express |
| 🎓 **Inscripción** | Maneja asignaturas, inscripciones, prerrequisitos y estado financiero. | `5000` | Node.js / Prisma / PostgreSQL |
| 💳 **Pago (Demo)** | Servicio simulado para pruebas de comunicación. | `7000` | Node.js |
| 🗄️ **PostgreSQL** | Base de datos principal del microservicio Inscripción. | `5433 → 5432` | Postgres 16 |
| 🌐 **Adminer** | Panel web para administrar la base de datos. | `8080` | PHP / Adminer |
| 💻 **Frontend (Angular/Ionic)** | Capa visual del sistema; consume el Gateway. | `4200` | Angular 20 / Ionic 8 |

---

## 🌍 Arquitectura general del sistema

```mermaid
flowchart LR
    subgraph CLIENTE["💻 Frontend Angular/Ionic (4200)"]
      A[Login / Home / Inscripción]
    end

    subgraph GATEWAY["🟩 API Gateway (3000)"]
      G1[/Proxy Routes/]
    end

    subgraph MICROSERVICIOS["⚙️ Microservicios"]
      A1[🔐 Auth (4000)]
      A2[🎓 Inscripción (5000)]
      A3[💳 Pago (7000)]
    end

    subgraph DB["🗄️ Base de Datos"]
      D1[(PostgreSQL 16)]
      D2[Adminer (8080)]
    end

    A --> G1
    G1 --> A1
    G1 --> A2
    G1 --> A3
    A2 --> D1
    D1 --> D2

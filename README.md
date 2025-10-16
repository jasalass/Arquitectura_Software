# 🏗️ Sistema de Inscripción Académica  
### Proyecto Integrado – Arquitectura de Software (Microservicios + Frontend Angular/Ionic)

Este proyecto implementa una **arquitectura basada en microservicios**, desplegada con **Docker Compose**, un **API Gateway**, una **base de datos PostgreSQL** y un **frontend Angular/Ionic** como capa de presentación.  

> 🎓 Proyecto académico desarrollado para la asignatura **Arquitectura de Software**, enfocado en comprender cómo se integran los componentes de una arquitectura moderna distribuida.

---

## 🧠 Objetivo general

Desarrollar un sistema modular que permita:
- ✅ Autenticación de usuarios.  
- 📚 Gestión de asignaturas e inscripciones.  
- 💰 Consulta del estado financiero del alumno.  
- 🌐 Comunicación mediante un **API Gateway** central.  
- 💻 Visualización en un **frontend Angular/Ionic**.

---

## 🧩 Componentes principales

| Componente | Descripción | Puerto | Tecnología |
|-------------|-------------|--------|-------------|
| 🟩 **API Gateway** | Entrada única para los microservicios. Maneja rutas, CORS y proxy. | `3000` | Node.js / Express |
| 🔐 **Auth** | Servicio de autenticación demo (usuarios en memoria). | `4000` | Node.js / Express |
| 🎓 **Inscripción** | Gestión académica, inscripciones, prerrequisitos y estado financiero. | `5000` | Node.js / Prisma / PostgreSQL |
| 💳 **Pago (Demo)** | Servicio simulado de comunicación. | `7000` | Node.js |
| 🗄️ **PostgreSQL** | Base de datos principal. | `5433 → 5432` | PostgreSQL 16 |
| 🌐 **Adminer** | Panel web para administrar la base de datos. | `8080` | PHP / Adminer |
| 💻 **Frontend (Angular/Ionic)** | Capa visual del sistema; consume el Gateway. | `4200` | Angular 20 / Ionic 8 |

---

## 🌍 Arquitectura general

El sistema está compuesto por los siguientes bloques:

- **Frontend Angular/Ionic (4200):** capa de presentación.  
- **API Gateway (3000):** punto central de entrada, proxy hacia los microservicios.  
- **Microservicios (4000–7000):** Auth, Inscripción y Pago.  
- **Base de datos PostgreSQL (5433):** persistencia académica.  
- **Adminer (8080):** interfaz de administración de datos.  

Flujo general:
> Frontend → API Gateway → Microservicios → Base de Datos

---

## 🔌 Tabla de puertos y accesos

| Servicio | Tipo | URL / Acceso | Descripción |
|-----------|------|--------------|--------------|
| 💻 Frontend Angular/Ionic | UI | [http://localhost:4200](http://localhost:4200) | Interfaz del usuario |
| 🟩 API Gateway | Backend | [http://localhost:3000](http://localhost:3000) | Entrada a los microservicios |
| 🔐 Auth | Backend | [http://localhost:4000](http://localhost:4000) | Servicio de autenticación |
| 🎓 Inscripción | Backend | [http://localhost:5000/inscripcion](http://localhost:5000/inscripcion) | Servicio académico |
| 💳 Pago (demo) | Backend | [http://localhost:7000/hola](http://localhost:7000/hola) | Endpoint de prueba |
| 🗄️ PostgreSQL | Base de datos | `127.0.0.1:5433` | Base de datos académica |
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
| **Presentación** | Frontend Angular/Ionic | Interfaz gráfica que consume los endpoints del Gateway. |
| **Negocio** | Auth / Inscripción / Pago | Lógica de aplicación segmentada por dominio. |
| **Infraestructura** | Postgres + Adminer | Persistencia y gestión de datos. |
| **Orquestación** | API Gateway + Scripts | Comunicación, despliegue y automatización. |

---

## 🚀 Ejecución rápida

Desde la carpeta raíz del proyecto:

```powershell
cd scripts
.\dev-up.ps1
```

🟢 Este comando realiza automáticamente:
1. Crea la red `utf_net` si no existe.  
2. Levanta Postgres y Adminer.  
3. Espera a que la DB esté “healthy”.  
4. Construye las imágenes de los microservicios.  
5. Genera Prisma Client y aplica migraciones.  
6. Levanta todos los servicios (api, auth, inscripcion, pago).  

Al finalizar verás algo como:

```
Todo arriba:
 - Adminer:                 http://localhost:8080
 - Postgres (host):         127.0.0.1:5433
 - Inscripcion (health):    http://localhost:5000/inscripcion/health
 - API Gateway:             http://localhost:3000
 - Auth:                    http://localhost:4000
 - Pago:                    http://localhost:7000
```

---

## ⏹️ Apagar el entorno

```powershell
cd scripts
.\dev-down.ps1
```

> ⚠️ Para **borrar completamente la base de datos local**, descomenta la línea:
> ```powershell
> docker compose -f "$InfraCompose" down -v
> ```

---

## 🧪 Pruebas rápidas de endpoints

### 🔹 Verificar salud general
```bash
curl http://localhost:3000/healthz
```

### 🔹 Autenticación
```bash
curl -X POST http://localhost:4000/auth   -H "Content-Type: application/json"   -d '{"email":"user@email.com","password":"12345"}'
```

### 🔹 Listar asignaturas
```bash
curl http://localhost:5000/inscripcion/asignaturas
```

### 🔹 Estado financiero del alumno
```bash
curl http://localhost:5000/inscripcion/alumno-estado/7b7b5c3a-7f3a-4b1f-9d73-2f10f1b9a100
```

### 🔹 Petición a través del Gateway
```bash
curl http://localhost:3000/inscripcion/asignaturas
```

---

## 💻 Frontend Angular/Ionic

El cliente web se encuentra en `/Front_Inscripciones/` y se comunica con el Gateway (`http://localhost:3000`).

### Ejecución local
```bash
cd Front_Inscripciones
npm install
npm start
```

Abre en el navegador:  
👉 [http://localhost:4200](http://localhost:4200)

### Variables de entorno
Archivo `src/environments/environment.ts`:
```ts
export const environment = {
  production: false,
  apiUrl: 'http://localhost:3000',
  apiUrl2: 'http://localhost:4000'
};
```

---

## 🧰 Administración de la base de datos

Accede a **Adminer** en [http://localhost:8080](http://localhost:8080)

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
| **Microservicios** | Servicios independientes (`auth`, `inscripcion`, `pago`). |
| **API Gateway** | Ruteo y centralización de llamadas HTTP. |
| **Infraestructura como código** | Docker Compose + scripts PowerShell. |
| **Desacoplamiento** | Servicios separados con responsabilidades únicas. |
| **Persistencia independiente** | Inscripción usa Postgres, Auth es in-memory. |
| **Health Checks** | `/healthz` y `/ready` en todos los servicios. |
| **Automatización** | Scripts `dev-up.ps1` y `dev-down.ps1` orquestan el entorno completo. |
| **Frontend integrado** | Angular/Ionic comunica todo el flujo mediante el Gateway. |

---

## 🧭 Flujo general de comunicación

```
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

---

## 🧩 Extensiones sugeridas (para práctica académica)

- Implementar **JWT real** en el microservicio Auth.  
- Proteger rutas del frontend con el token.  
- Agregar **logging centralizado** (Winston / Pino).  
- Crear un **módulo docente o administrativo** adicional.  
- Desplegar en **AWS, Render o Railway** como entorno cloud.  

---

## 🏁 Conclusión

Este sistema permite comprender **cómo se construye, despliega y orquesta** una arquitectura completa de microservicios con comunicación HTTP, base de datos relacional, automatización con scripts y un frontend moderno.

> 💡 Ideal para estudiantes de **Arquitectura de Software**, **Desarrollo Fullstack** y **DevOps**, ya que replica un entorno real de trabajo con separación de responsabilidades, modularidad y escalabilidad.

Microservicio Auth

Servicio de autenticación demo que permite iniciar sesión con email y password, o recuperar la sesión a partir de un uuid.
Guarda los usuarios en memoria y retorna un token de demostración con un payload completo para el frontend.

🚀 Inicio rápido
# 1️⃣ Instalar dependencias
npm install

# 2️⃣ Crear archivo de entorno
cp .env.example .env

# 3️⃣ Ejecutar el servicio
npm run dev     # o node src/index.js


Por defecto el servicio se ejecuta en:
👉 http://localhost:4000

⚙️ Variables de entorno

Archivo .env:

# Puerto de escucha
PORT=4000

🧩 Endpoints disponibles
🟢 GET /

Descripción: Ping del servicio.
Uso: Verifica que el microservicio está en ejecución.
Respuesta:

{ "message": "API AUTH funcionando" }

🔐 POST /auth

Descripción: Autenticación mediante email y password.

Body:

{
  "email": "user@email.com",
  "password": "12345"
}


200 OK (éxito):

{
  "success": true,
  "message": "OK",
  "token": "demo.N2I3YjVjM2EtN2YzYS00YjFmLTlkNzMtMmYxMGYxYjlhMTAw.token",
  "expiresIn": 3600,
  "user": {
    "uuid": "7b7b5c3a-7f3a-4b1f-9d73-2f10f1b9a100",
    "email": "user@email.com",
    "nombre": "Juana",
    "apellido": "Pérez",
    "rut": "12.345.678-9",
    "roles": ["ALUMNO"],
    "permisos": ["inscribir", "pagar", "ver-estado"],
    "carrera": "Ingeniería Informática",
    "plan": "Plan 2022",
    "semestre_actual": 3,
    "avatar_url": "https://i.pravatar.cc/150?img=5",
    "ultimo_acceso": "2025-10-15T23:00:00.000Z",
    "estado_matricula": "PAGADA"
  }
}


Posibles errores:

Código	Descripción
400	email y password son requeridos
401	Credenciales inválidas

Ejemplo cURL:

curl -X POST http://localhost:4000/auth \
  -H "Content-Type: application/json" \
  -d '{"email":"user@email.com","password":"12345"}'

🆔 POST /auth-id

Descripción: Retorna el payload del usuario mediante su uuid o id.
Útil cuando el frontend ya posee un identificador.

Body (uno de los dos campos):

{ "uuid": "7b7b5c3a-7f3a-4b1f-9d73-2f10f1b9a100" }


o

{ "id": "7b7b5c3a-7f3a-4b1f-9d73-2f10f1b9a100" }


200 OK (éxito): → Mismo payload que /auth.

Errores posibles:

Código	Descripción
400	id (uuid) es requerido
404	Usuario no encontrado

Ejemplo cURL:

curl -X POST http://localhost:4000/auth-id \
  -H "Content-Type: application/json" \
  -d '{"uuid":"7b7b5c3a-7f3a-4b1f-9d73-2f10f1b9a100"}'

🩺 Healthchecks
Método	Ruta	Descripción
GET	/healthz	Liveness (verifica que el servicio esté activo)
GET	/ready	Readiness (indica que el servicio está listo para recibir tráfico)

Ejemplo:

curl -i http://localhost:4000/healthz

👥 Usuarios de demostración

Los usuarios están cargados en memoria (ver constante DEMO_USERS en el código).
Ejemplos disponibles:

Email	Password	UUID	Estado
user@email.com	12345	7b7b5c3a-7f3a-4b1f-9d73-2f10f1b9a100	PAGADA
alumno2@demo.cl	abc123	11111111-1111-1111-1111-111111111111	PENDIENTE
🔑 Token de demostración

El método demoTokenFor(user) genera un token de formato:

demo.<uuid_base64>.token


En producción se reemplazaría por un JWT real, firmado con una secret y tiempo de expiración.

🧠 Estructura del payload de usuario
{
  "uuid": "string",
  "email": "string",
  "nombre": "string",
  "apellido": "string",
  "rut": "string",
  "roles": ["ALUMNO"],
  "permisos": ["inscribir","pagar","ver-estado"],
  "carrera": "string",
  "plan": "string",
  "semestre_actual": 0,
  "avatar_url": "string",
  "ultimo_acceso": "ISODate",
  "estado_matricula": "PAGADA | PENDIENTE | BLOQUEADA"
}

📦 Integración con el API Gateway

El Gateway reenvía:

Ruta del Gateway	Método	Redirección a este servicio
/auth	POST	→ http://localhost:4000/auth
/auth-id	POST	→ http://localhost:4000/auth-id
🧪 Pruebas rápidas
# Login exitoso
curl -X POST http://localhost:4000/auth \
  -H "Content-Type: application/json" \
  -d '{"email":"user@email.com","password":"12345"}'

# Login fallido
curl -X POST http://localhost:4000/auth \
  -H "Content-Type: application/json" \
  -d '{"email":"user@email.com","password":"123"}'

# Resolver sesión por UUID
curl -X POST http://localhost:4000/auth-id \
  -H "Content-Type: application/json" \
  -d '{"uuid":"7b7b5c3a-7f3a-4b1f-9d73-2f10f1b9a100"}'
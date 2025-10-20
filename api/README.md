API Gateway

Gateway HTTP para enrutar solicitudes a los microservicios de Auth, Inscripción y Pago. Maneja CORS y expone endpoints de salud para liveness/readiness.

🚀 Arranque rápido
# en /api
npm i
cp .env.example .env
npm run dev   # o node src/index.js

⚙️ Variables de entorno

Crea .env dentro de api/:

# Puerto del Gateway
PORT=3000

# En Docker se usan nombres de servicio; en local puedes sobreescribir con http://localhost
AUTH_BASE_URL=http://localhost:4000/auth
# ⚠️ Si cambias tu auth a /auth/login, ajusta arriba:
# AUTH_BASE_URL=http://localhost:4000/auth/login

# Para Inscripción: el código del gateway antepone "/inscripcion" vía pathRewrite
# Por eso, el target NO debe terminar en "/inscripcion" para no duplicar.
INSCRIPCION_BASE_URL=http://localhost:5000

# Orígenes permitidos (CORS), separados por coma
CORS_ORIGIN=http://127.0.0.1:5500,http://localhost:5500,http://localhost:5173

# Pago: el código actual en /hola usa localhost:7000 directo.
# Sugerencia: usa esta variable y consúmela también en /hola.
PAGO_BASE_URL=http://localhost:7000


Importante: En tu snippet había INSCRIPCION_BASE_URL=http://localhost:5000/inscripcion y PAGO_BASE_URL = http://localhost:6000 (con espacio y puerto distinto). Eso causaría rutas duplicadas y confusión. Arriba va la versión coherente con tu código actual (proxy a 5000 y pago en 7000).

🌐 Endpoints públicos del Gateway

El Gateway no transforma payloads ni respuestas (salvo cabeceras CORS/proxy).
Los endpoints de cada microservicio pueden variar; el Gateway aquí describe lo que expone y a dónde enruta.

1) Salud y raíz (servidos por el Gateway)
Método	Ruta	Descripción	Respuesta esperada
GET	/	Prueba rápida del Gateway	{ message: "🟢 API Gateway funcionando correctamente" }
GET	/healthz	Liveness probe (K8s/Compose)	200 OK
GET	/ready	Readiness probe (K8s/Compose)	200 OK
Ejemplos
curl http://localhost:3000/
curl -i http://localhost:3000/healthz
curl -i http://localhost:3000/ready

2) Inscripción (proxy)

Prefijo público: /inscripcion/*

Destino: INSCRIPCION_BASE_URL (p. ej. http://localhost:5000)

Reescritura de ruta: el Gateway antepone "/inscripcion" antes de reenviar (pathRewrite: (path) => "/inscripcion" + path).

Método	Ruta Gateway	Llega al micro como…
*	/inscripcion/health	http://localhost:5000/inscripcion/health
*	/inscripcion/asignaturas	http://localhost:5000/inscripcion/asignaturas
*	/inscripcion/:id	http://localhost:5000/inscripcion/:id
*	/inscripcion	http://localhost:5000/inscripcion

El Gateway no define los endpoints internos exactos; solo pasa el path que venga después de /inscripcion.

Ejemplos
# listar (ejemplo)
curl http://localhost:3000/inscripcion

# detalle
curl http://localhost:3000/inscripcion/123

# crear
curl -X POST http://localhost:3000/inscripcion \
  -H "Content-Type: application/json" \
  -d '{"rut":"12.345.678-9","cursoId":2}'

3) Auth (fetch directo, NO proxy middleware)

Endpoints del Gateway:

POST /auth → reenvía a AUTH_BASE_URL (por ejemplo http://localhost:4000/auth)

POST /auth-id → reenvía a AUTH_BASE_URL añadiendo sufijo -id (p. ej. http://localhost:4000/auth-id)

Método	Ruta Gateway	Destino exacto
POST	/auth	AUTH_BASE_URL (body JSON reenviado tal cual)
POST	/auth-id	AUTH_BASE_URL + -id
Ejemplos
# auth (ej. login o registro, según lo que exponga el micro)
curl -X POST http://localhost:3000/auth \
  -H "Content-Type: application/json" \
  -d '{"email":"user@mail.com","password":"123456"}'

# auth-id
curl -X POST http://localhost:3000/auth-id \
  -H "Content-Type: application/json" \
  -d '{"id":"abc-123"}'


Nota: el Gateway hace fetch y reenvía código de estado y JSON de la respuesta. Si cambia tu endpoint real (p. ej. /auth/login), actualiza AUTH_BASE_URL.

4) Pago (hola de prueba)

Endpoint del Gateway: GET /hola

Destino actual en código: http://localhost:7000/hola (hardcodeado)

Método	Ruta Gateway	Destino exacto	Nota
GET	/hola	http://localhost:7000/hola	Sugerido: usar PAGO_BASE_URL
Ejemplo
curl http://localhost:3000/hola


Sugerencia rápida: para ser consistente con tus variables, cambia el handler a:

const r = await fetch(`${PAGO_BASE_URL.replace(/\/$/, '')}/hola`);


…y define PAGO_BASE_URL=http://localhost:7000 en .env.

🛡️ CORS

Configurado a partir de CORS_ORIGIN (coma-separado). Métodos permitidos: GET, POST, PUT, DELETE, OPTIONS.
Cabeceras permitidas: Content-Type.

Sugerencia: añade Authorization si vas a pasar tokens:

allowedHeaders: ['Content-Type','Authorization']

🧩 Resumen técnico (cómo enruta)

Inscripción usa http-proxy-middleware con:

target = INSCRIPCION_BASE_URL (sin /inscripcion al final)

pathRewrite: (path) => "/inscripcion" + path

Auth usa fetch en dos rutas:

/auth → AUTH_BASE_URL

/auth-id → AUTH_BASE_URL + "-id"

Pago (/hola) hace fetch directo a http://localhost:7000/hola (recomendado migrarlo a PAGO_BASE_URL).
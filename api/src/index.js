import express from 'express';
import dotenv from 'dotenv';
import cors from "cors";

//Cargar variables .env
dotenv.config();

//Iniciar express
const app = express();

// Habilita CORS para todas las rutas y orígenes
app.use(cors());

//Puerto de la API Gateway
const PORT = process.env.PORT || 3000;

//Middleware para JSON
app.use(express.json());

//Endpoint de prueba
app.get('/', (req, res) => {
    res.json({ message: 'API funcionando' });
});

//Endpoint autenticación (llama al servicio AUTH)
app.post('/auth', async (req, res) => {
    try {
        let auth_api = process.env.AUTH_BASE_URL; // ej: http://localhost:4000/auth

        const response = await fetch(auth_api, {
            method: "POST",
            headers: { "Content-Type": "application/json" }, 
            body: JSON.stringify(req.body)
        });
        // Obtener la respuesta del servicio AUTH
        const data = await response.json();
        console.log(data)
        // Reenviar la respuesta al cliente
        res.status(response.status).json(data);

    } catch (error) {
        console.error("Error en auth", error);
        res.status(500).json({
            success: false,
            message: "Error al contactar al servicio de autenticación",
            error: error
        });
    }
});

//Healthcheck (para kubernetes)
app.get('/healthz', (req, res) => res.sendStatus(200));
app.get('/ready', (req, res) => res.sendStatus(200));

app.listen(PORT, () => {
    console.log(`API corriendo en http://localhost:${PORT}`);
});

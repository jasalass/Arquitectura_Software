import express from 'express';
import dotenv from "dotenv";

//Configuración de dotenv
dotenv.config();

//Iniciar express
const app = express();

//Asignar puerto
const PORT = process.env.PORT || 4000;

//Middleware para JSON
app.use(express.json());

// Middleware para datos tipo application/x-www-form-urlencoded
app.use(express.urlencoded({ extended: true }));

//Endpoint de prueba
app.get('/', (req, res) =>{
    res.json({message:'API AUTH funcionando'})
});

//Endpoint de autenticación
app.post('/auth', (req, res) =>{
    let email = req.body.email;
    let password = req.body.password;
    
    if (email === "user@email.com" && password === "12345"){
        
        // Éxito 200 OK
        res.status(200).json({ success: true, message: "Login correcto" });
        
    } else {
        //Error 401 sin autorización
        res.status(401).json({success: false, message: "Credenciales Inválidas"});
    }
});

//Healthcheck (para kubernetes)
app.get('/healthz', (req,res)=>{res.sendStatus(200)});
app.get('/ready', (req,res)=>{res.sendStatus(200)});

app.listen(PORT, () =>{
    console.log(`Auth corriendo en http://localhost:${PORT}`)
});
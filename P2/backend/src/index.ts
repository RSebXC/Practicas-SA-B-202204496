/**
 * Archivo principal del servidor
 * 
 * Configura Express, middlewares, rutas y la conexión a la base de datos
 */

import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import database from './config/database';
import { AuthService } from './services/authService';
import { AuthController } from './controllers/authController';
import { createAuthRoutes } from './routes/authRoutes';
import { createProtectedRoutes } from './routes/protectedRoutes';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;

// Configurar CORS para permitir cookies
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true // IMPORTANTE: Permite enviar cookies
}));

// Middlewares
app.use(express.json());
app.use(cookieParser()); // Necesario para leer cookies

// Inyección de dependencias
const pool = database.getPool();
const authService = new AuthService(pool);
const authController = new AuthController(authService);

// Rutas
app.get('/health', (req, res) => {
  res.json({ 
    success: true, 
    message: 'API de autenticacion funcionando',
    timestamp: new Date().toISOString()
  });
});

app.use('/api/auth', createAuthRoutes(authController));
app.use('/api/protected', createProtectedRoutes());

// Manejo de rutas no encontradas - Compatible con Express 5
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Ruta no encontrada',
    path: req.path
  });
});

// Iniciar servidor
async function start() {
  try {
    // Inicializar base de datos
    await database.inicializarTablas();
    
    app.listen(PORT, () => {
      console.log(`
========================================
  Servidor Backend Iniciado              
  Puerto: ${PORT}                            
  http://localhost:${PORT}                   
  http://localhost:${PORT}/health            
  API Auth: http://localhost:${PORT}/api/auth 
========================================
      `);
    });

  } catch (error) {
    console.error('Error al iniciar servidor:', error);
    process.exit(1);
  }
}

start();
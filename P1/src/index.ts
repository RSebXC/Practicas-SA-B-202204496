/**
 * Archivo principal de la aplicación
 * 202204496 Rodrigo Sebastian Castro Aguilar
 * SOLID APLICADO:
 * DIP - Inyección de Dependencias centralizada
 */

import express from 'express';
import cors from 'cors';
import database from './config/database';
import { SolicitudService } from './services/SolicitudService';
import { SolicitudController } from './controllers/SolicitudController';
import { crearRutas } from './routes/solicitudRoutes';

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// INYECCIÓN DE DEPENDENCIAS
const pool = database.getPool();
const solicitudService = new SolicitudService(pool);
const solicitudController = new SolicitudController(solicitudService);
const solicitudRoutes = crearRutas(solicitudController);

app.get('/health', (req, res) => {
  res.json({ success: true, message: 'API funcionando' });
});

app.use('/api/solicitudes', solicitudRoutes);

async function iniciar() {
  try {
    await database.inicializarTabla();
    
    app.listen(PORT, () => {
      console.log(`Servidor en http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

iniciar();

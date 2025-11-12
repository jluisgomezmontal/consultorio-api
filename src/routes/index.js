import { Router } from 'express';
import authRoutes from './auth.routes.js';
import userRoutes from './user.routes.js';
import consultorioRoutes from './consultorio.routes.js';
import pacienteRoutes from './paciente.routes.js';
import citaRoutes from './cita.routes.js';
import pagoRoutes from './pago.routes.js';
import reporteRoutes from './reporte.routes.js';

const router = Router();

// Health check
router.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'API is running',
    timestamp: new Date().toISOString(),
  });
});

// API routes
router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/consultorios', consultorioRoutes);
router.use('/pacientes', pacienteRoutes);
router.use('/citas', citaRoutes);
router.use('/pagos', pagoRoutes);
router.use('/reportes', reporteRoutes);

export default router;

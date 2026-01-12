import { Router } from 'express';
import express from 'express';
import authRoutes from './auth.routes.js';
import consultorioRoutes from './consultorio.routes.js';
import citaRoutes from './cita.routes.js';
import pacienteRoutes from './paciente.routes.js';
import pagoRoutes from './pago.routes.js';
import reporteRoutes from './reporte.routes.js';
import userRoutes from './user.routes.js';
import documentoRoutes from './documento.routes.js';
import pacientePhotoRoutes from './paciente-photo.routes.js';
import paqueteRoutes from './paquete.routes.js';
import recetaRoutes from './receta.routes.js';
import stripeRoutes from './stripe.routes.js';
import medicationAllergyRoutes from './medicationAllergy.routes.js';

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
router.use('/paciente-photos', pacientePhotoRoutes);
router.use('/citas', citaRoutes);
router.use('/documentos', documentoRoutes);
router.use('/paquetes', paqueteRoutes);
router.use('/stripe', stripeRoutes);
router.use('/recetas', recetaRoutes);
router.use('/reportes', reporteRoutes);
router.use('/pagos', pagoRoutes);
router.use('/medication-allergies', medicationAllergyRoutes);

export default router;

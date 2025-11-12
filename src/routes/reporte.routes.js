import { Router } from 'express';
import reporteController from '../controllers/reporte.controller.js';
import { authenticate } from '../middlewares/auth.js';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Get dashboard summary
router.get('/dashboard', reporteController.getDashboardSummary);

// Get citas report
router.get('/citas', reporteController.getCitasReport);

// Get ingresos report
router.get('/ingresos', reporteController.getIngresosReport);

// Get pacientes report
router.get('/pacientes', reporteController.getPacientesReport);

export default router;

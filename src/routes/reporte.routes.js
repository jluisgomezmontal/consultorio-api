import { Router } from 'express';
import reporteController from '../controllers/reporte.controller.js';
import { authenticate, authorize } from '../middlewares/auth.js';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Get dashboard summary (admin and doctor only)
router.get('/dashboard', authorize('admin', 'doctor','recepcionista'), reporteController.getDashboardSummary);

// Get citas report (admin and doctor only)
router.get('/citas', authorize('admin', 'doctor'), reporteController.getCitasReport);

// Get ingresos report (admin and doctor only)
router.get('/ingresos', authorize('admin', 'doctor'), reporteController.getIngresosReport);

// Get pacientes report (admin and doctor only)
router.get('/pacientes', authorize('admin', 'doctor'), reporteController.getPacientesReport);

export default router;

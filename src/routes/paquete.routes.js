import express from 'express';
import paqueteController from '../controllers/paquete.controller.js';
import { authenticate, authorize } from '../middlewares/auth.js';

const router = express.Router();

// Todas las rutas requieren autenticación
router.use(authenticate);

// Obtener todos los paquetes disponibles
router.get('/', paqueteController.getAllPaquetes);

// Obtener información del paquete actual del consultorio
router.get('/mi-paquete', paqueteController.getConsultorioPaquete);

// Verificar límite específico
router.get('/verificar-limite/:tipo', paqueteController.verificarLimite);

// Verificar acceso a feature
router.get('/verificar-feature/:feature', paqueteController.verificarFeature);

// Actualizar paquete (requiere ser admin o owner del consultorio)
router.put('/actualizar', paqueteController.actualizarPaquete);

// Inicializar paquetes (admin only)
router.post('/inicializar', authorize('admin'), paqueteController.inicializarPaquetes);

// Admin: Obtener todos los consultorios con su paquete
router.get('/admin/consultorios', authorize('admin'), paqueteController.getAllConsultoriosConPaquete);

// Admin: Actualizar paquete de un consultorio
router.put('/admin/consultorios/:consultorioId', authorize('admin'), paqueteController.actualizarPaqueteConsultorio);

// Admin: CRUD de paquetes
router.get('/admin/paquetes/:id', authorize('admin'), paqueteController.getPaqueteById);
router.post('/admin/paquetes', authorize('admin'), paqueteController.crearPaquete);
router.put('/admin/paquetes/:id', authorize('admin'), paqueteController.actualizarPaqueteById);
router.delete('/admin/paquetes/:id', authorize('admin'), paqueteController.eliminarPaquete);

export default router;

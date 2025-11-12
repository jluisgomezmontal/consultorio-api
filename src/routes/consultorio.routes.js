import { Router } from 'express';
import consultorioController from '../controllers/consultorio.controller.js';
import { authenticate, authorize } from '../middlewares/auth.js';
import { validate } from '../middlewares/validation.js';
import {
  createConsultorioSchema,
  updateConsultorioSchema,
  getConsultorioSchema,
} from '../validators/consultorio.validator.js';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Get all consultorios
router.get('/', consultorioController.getAllConsultorios);

// Get consultorio by ID
router.get('/:id', validate(getConsultorioSchema), consultorioController.getConsultorioById);

// Get consultorio summary
router.get('/:id/resumen', validate(getConsultorioSchema), consultorioController.getConsultorioSummary);

// Create consultorio (admin only)
router.post('/', authorize('admin'), validate(createConsultorioSchema), consultorioController.createConsultorio);

// Update consultorio (admin only)
router.put('/:id', authorize('admin'), validate(updateConsultorioSchema), consultorioController.updateConsultorio);

// Delete consultorio (admin only)
router.delete('/:id', authorize('admin'), validate(getConsultorioSchema), consultorioController.deleteConsultorio);

export default router;

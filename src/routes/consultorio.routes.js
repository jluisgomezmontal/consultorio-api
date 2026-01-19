import { Router } from 'express';
import consultorioController from '../controllers/consultorio.controller.js';
import { authenticate, authorize } from '../middlewares/auth.js';
import { validate } from '../middlewares/validation.js';
import {
  createConsultorioSchema,
  updateConsultorioSchema,
  getConsultorioSchema,
  updateClinicalHistoryConfigSchema,
  updateConsultorioBasicInfoSchema,
  updateRecetaTemplateSchema,
} from '../validators/consultorio.validator.js';
import { upload, handleMulterError } from '../middlewares/upload.js';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Get all consultorios
router.get('/', consultorioController.getAllConsultorios);

// Get consultorio by ID
router.get('/:id', validate(getConsultorioSchema), consultorioController.getConsultorioById);

// Get consultorio summary
router.get('/:id/resumen', validate(getConsultorioSchema), consultorioController.getConsultorioSummary);

// Get clinical history configuration
router.get('/:id/clinical-history-config', validate(getConsultorioSchema), consultorioController.getClinicalHistoryConfig);

// Update clinical history configuration (doctor only)
router.put('/:id/clinical-history-config', authorize('doctor', 'admin'), validate(updateClinicalHistoryConfigSchema), consultorioController.updateClinicalHistoryConfig);

// Update consultorio basic info (doctor only)
router.put('/:id/basic-info', authorize('doctor'), upload.single('image'), handleMulterError, validate(updateConsultorioBasicInfoSchema), consultorioController.updateConsultorioBasicInfo);

// Update receta template (doctor only)
router.put('/:id/receta-template', authorize('doctor'), validate(updateRecetaTemplateSchema), consultorioController.updateRecetaTemplate);

// Update permissions (doctor only)
router.put('/:id/permissions', authorize('doctor'), consultorioController.updatePermissions);

// Get appointment sections configuration
router.get('/:id/appointment-sections-config', validate(getConsultorioSchema), consultorioController.getAppointmentSectionsConfig);

// Update appointment sections configuration (doctor only)
router.put('/:id/appointment-sections-config', authorize('doctor'), consultorioController.updateAppointmentSectionsConfig);

// Create consultorio (admin only)
router.post('/', authorize('admin'), validate(createConsultorioSchema), consultorioController.createConsultorio);

// Update consultorio (admin only)
router.put('/:id', authorize('admin'), validate(updateConsultorioSchema), consultorioController.updateConsultorio);

// Delete consultorio (admin only)
router.delete('/:id', authorize('admin'), validate(getConsultorioSchema), consultorioController.deleteConsultorio);

export default router;

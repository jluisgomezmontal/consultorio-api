import { Router } from 'express';
import citaController from '../controllers/cita.controller.js';
import { authenticate, authorizeStaff, authorize, applyConsultorioFilter } from '../middlewares/auth.js';
import { validate } from '../middlewares/validation.js';
import {
  createCitaSchema,
  updateCitaSchema,
  getCitaSchema,
  listCitasSchema,
} from '../validators/cita.validator.js';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Apply consultorio filter for non-admin users
router.use(applyConsultorioFilter);

// Get all citas with filters (staff: recepcionista, doctor, admin)
router.get('/', authorizeStaff, validate(listCitasSchema), citaController.getAllCitas);

// Get calendar view (staff: recepcionista, doctor, admin)
router.get('/calendario', authorizeStaff, citaController.getCalendar);

// Get cita by ID (staff: recepcionista, doctor, admin)
router.get('/:id', authorizeStaff, validate(getCitaSchema), citaController.getCitaById);

// Create cita (staff: recepcionista, doctor, admin)
router.post('/', authorizeStaff, validate(createCitaSchema), citaController.createCita);

// Update cita (staff: recepcionista, doctor, admin)
router.put('/:id', authorizeStaff, validate(updateCitaSchema), citaController.updateCita);

// Cancel cita (staff: recepcionista, doctor, admin)
router.patch('/:id/cancelar', authorizeStaff, validate(getCitaSchema), citaController.cancelCita);

// Delete cita (admin only)
router.delete('/:id', authorize('admin'), validate(getCitaSchema), citaController.deleteCita);

export default router;

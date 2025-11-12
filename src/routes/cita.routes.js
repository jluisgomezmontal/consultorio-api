import { Router } from 'express';
import citaController from '../controllers/cita.controller.js';
import { authenticate } from '../middlewares/auth.js';
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

// Get all citas with filters
router.get('/', validate(listCitasSchema), citaController.getAllCitas);

// Get calendar view
router.get('/calendario', citaController.getCalendar);

// Get cita by ID
router.get('/:id', validate(getCitaSchema), citaController.getCitaById);

// Create cita
router.post('/', validate(createCitaSchema), citaController.createCita);

// Update cita
router.put('/:id', validate(updateCitaSchema), citaController.updateCita);

// Cancel cita
router.patch('/:id/cancelar', validate(getCitaSchema), citaController.cancelCita);

// Delete cita
router.delete('/:id', validate(getCitaSchema), citaController.deleteCita);

export default router;

import { Router } from 'express';
import pacienteController from '../controllers/paciente.controller.js';
import { authenticate, authorizeStaff, authorize } from '../middlewares/auth.js';
import { validate } from '../middlewares/validation.js';
import {
  createPacienteSchema,
  updatePacienteSchema,
  getPacienteSchema,
  searchPacientesSchema,
} from '../validators/paciente.validator.js';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Get all pacientes with search (staff: recepcionista, doctor, admin)
router.get('/', authorizeStaff, validate(searchPacientesSchema), pacienteController.getAllPacientes);

// Search pacientes (staff: recepcionista, doctor, admin)
router.get('/search', authorizeStaff, pacienteController.searchPacientes);

// Get paciente by ID (staff: recepcionista, doctor, admin)
router.get('/:id', authorizeStaff, validate(getPacienteSchema), pacienteController.getPacienteById);

// Get paciente history (staff: recepcionista, doctor, admin)
router.get('/:id/historial', authorizeStaff, validate(getPacienteSchema), pacienteController.getPacienteHistory);

// Create paciente (staff: recepcionista, doctor, admin)
router.post('/', authorizeStaff, validate(createPacienteSchema), pacienteController.createPaciente);

// Update paciente (staff: recepcionista, doctor, admin)
router.put('/:id', authorizeStaff, validate(updatePacienteSchema), pacienteController.updatePaciente);

// Delete paciente (admin only)
router.delete('/:id', authorize('admin'), validate(getPacienteSchema), pacienteController.deletePaciente);

export default router;

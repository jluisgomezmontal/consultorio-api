import { Router } from 'express';
import pacienteController from '../controllers/paciente.controller.js';
import { authenticate } from '../middlewares/auth.js';
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

// Get all pacientes with search
router.get('/', validate(searchPacientesSchema), pacienteController.getAllPacientes);

// Search pacientes
router.get('/search', pacienteController.searchPacientes);

// Get paciente by ID
router.get('/:id', validate(getPacienteSchema), pacienteController.getPacienteById);

// Get paciente history
router.get('/:id/historial', validate(getPacienteSchema), pacienteController.getPacienteHistory);

// Create paciente
router.post('/', validate(createPacienteSchema), pacienteController.createPaciente);

// Update paciente
router.put('/:id', validate(updatePacienteSchema), pacienteController.updatePaciente);

// Delete paciente
router.delete('/:id', validate(getPacienteSchema), pacienteController.deletePaciente);

export default router;

import { Router } from 'express';
import medicationAllergyController from '../controllers/medicationAllergy.controller.js';
import { authenticate, authorizeStaff, authorize, applyConsultorioFilter } from '../middlewares/auth.js';
import { validate } from '../middlewares/validation.js';
import {
  createMedicationAllergySchema,
  updateMedicationAllergySchema,
  getMedicationAllergySchema,
  searchMedicationAllergiesSchema,
  addMedicationAllergyToPacienteSchema,
  removeMedicationAllergyFromPacienteSchema,
  getPacienteMedicationAllergiesSchema,
} from '../validators/medicationAllergy.validator.js';

const router = Router();

router.use(authenticate);

router.get(
  '/',
  authorizeStaff,
  validate(searchMedicationAllergiesSchema),
  medicationAllergyController.getAllMedicationAllergies
);

router.get(
  '/by-category',
  authorizeStaff,
  medicationAllergyController.getMedicationsByCategory
);

router.get(
  '/:id',
  authorizeStaff,
  validate(getMedicationAllergySchema),
  medicationAllergyController.getMedicationAllergyById
);

router.post(
  '/',
  authorize('admin'),
  validate(createMedicationAllergySchema),
  medicationAllergyController.createMedicationAllergy
);

router.put(
  '/:id',
  authorize('admin'),
  validate(updateMedicationAllergySchema),
  medicationAllergyController.updateMedicationAllergy
);

router.delete(
  '/:id',
  authorize('admin'),
  validate(getMedicationAllergySchema),
  medicationAllergyController.deleteMedicationAllergy
);

router.use(applyConsultorioFilter);

router.get(
  '/pacientes/:pacienteId',
  authorizeStaff,
  validate(getPacienteMedicationAllergiesSchema),
  medicationAllergyController.getPacienteMedicationAllergies
);

router.post(
  '/pacientes/:pacienteId/:medicationAllergyId',
  authorizeStaff,
  validate(addMedicationAllergyToPacienteSchema),
  medicationAllergyController.addMedicationAllergyToPaciente
);

router.delete(
  '/pacientes/:pacienteId/:medicationAllergyId',
  authorizeStaff,
  validate(removeMedicationAllergyFromPacienteSchema),
  medicationAllergyController.removeMedicationAllergyFromPaciente
);

export default router;

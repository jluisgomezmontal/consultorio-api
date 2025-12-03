import { Router } from 'express';
import pagoController from '../controllers/pago.controller.js';
import { authenticate, authorizeStaff, authorize, applyConsultorioFilter } from '../middlewares/auth.js';
import { validate } from '../middlewares/validation.js';
import {
  createPagoSchema,
  updatePagoSchema,
  getPagoSchema,
  listPagosSchema,
} from '../validators/pago.validator.js';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Apply consultorio filter for non-admin users
router.use(applyConsultorioFilter);

// Get all pagos with filters (staff: recepcionista, doctor, admin)
router.get('/', authorizeStaff, validate(listPagosSchema), pagoController.getAllPagos);

// Get income report (staff: recepcionista, doctor, admin)
router.get('/ingresos', authorizeStaff, pagoController.getIncomeReport);

// Get pago by ID (staff: recepcionista, doctor, admin)
router.get('/:id', authorizeStaff, validate(getPagoSchema), pagoController.getPagoById);

// Create pago (staff: recepcionista, doctor, admin)
router.post('/', authorizeStaff, validate(createPagoSchema), pagoController.createPago);

// Update pago (staff: recepcionista, doctor, admin)
router.put('/:id', authorizeStaff, validate(updatePagoSchema), pagoController.updatePago);

// Delete pago (admin only)
router.delete('/:id', authorize('admin'), validate(getPagoSchema), pagoController.deletePago);

export default router;

import { Router } from 'express';
import pagoController from '../controllers/pago.controller.js';
import { authenticate } from '../middlewares/auth.js';
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

// Get all pagos with filters
router.get('/', validate(listPagosSchema), pagoController.getAllPagos);

// Get income report
router.get('/ingresos', pagoController.getIncomeReport);

// Get pago by ID
router.get('/:id', validate(getPagoSchema), pagoController.getPagoById);

// Create pago
router.post('/', validate(createPagoSchema), pagoController.createPago);

// Update pago
router.put('/:id', validate(updatePagoSchema), pagoController.updatePago);

// Delete pago
router.delete('/:id', validate(getPagoSchema), pagoController.deletePago);

export default router;

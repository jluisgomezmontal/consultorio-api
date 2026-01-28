import { Router } from 'express';
import aiController from '../controllers/ai.controller.js';
import { authenticate, authorize } from '../middlewares/auth.js';
import { validate } from '../middlewares/validation.js';
import { suggestTreatmentSchema } from '../validators/ai.validator.js';

const router = Router();

router.use(authenticate);

router.post(
  '/suggest-treatment',
  authorize('doctor', 'admin'),
  validate(suggestTreatmentSchema),
  aiController.suggestTreatment
);

export default router;

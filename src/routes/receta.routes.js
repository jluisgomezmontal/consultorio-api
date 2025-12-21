import { Router } from 'express';
import recetaController from '../controllers/receta.controller.js';
import { authenticate, authorize } from '../middlewares/auth.js';
import { validate } from '../middlewares/validation.js';
import { generateRecetaSchema } from '../validators/receta.validator.js';

const router = Router();

router.use(authenticate);

router.post('/generate', authorize('doctor', 'admin'), validate(generateRecetaSchema), recetaController.generateReceta);

router.get('/preview-template', authorize('doctor', 'admin'), recetaController.previewTemplate);

export default router;

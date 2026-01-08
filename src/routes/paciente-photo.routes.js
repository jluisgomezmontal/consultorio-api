import express from 'express';
import pacientePhotoController from '../controllers/paciente-photo.controller.js';
import { authenticate } from '../middlewares/auth.js';
import { upload, handleMulterError } from '../middlewares/upload.js';
import { checkFeature } from '../middlewares/checkPaquete.js';

const router = express.Router();

// Todas las rutas requieren autenticación
router.use(authenticate);

// Subir foto de paciente - requires uploadImagenes feature
router.post(
  '/upload',
  checkFeature('uploadImagenes'),
  upload.single('photo'),
  handleMulterError,
  pacientePhotoController.uploadPhoto
);

// Eliminar foto de paciente - requires uploadImagenes feature
router.delete('/delete', checkFeature('uploadImagenes'), pacientePhotoController.deletePhoto);

export default router;

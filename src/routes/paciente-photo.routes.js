import express from 'express';
import pacientePhotoController from '../controllers/paciente-photo.controller.js';
import { authenticate } from '../middlewares/auth.js';
import { upload, handleMulterError } from '../middlewares/upload.js';

const router = express.Router();

// Todas las rutas requieren autenticación
router.use(authenticate);

// Subir foto de paciente
router.post(
  '/upload',
  upload.single('photo'),
  handleMulterError,
  pacientePhotoController.uploadPhoto
);

// Eliminar foto de paciente
router.delete('/delete', pacientePhotoController.deletePhoto);

export default router;

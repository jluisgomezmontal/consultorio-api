import express from 'express';
import userPhotoController from '../controllers/user-photo.controller.js';
import { authenticate } from '../middlewares/auth.js';
import { upload, handleMulterError } from '../middlewares/upload.js';
import { checkFeature } from '../middlewares/checkPaquete.js';

const router = express.Router();

// Todas las rutas requieren autenticación
router.use(authenticate);

// Subir foto de perfil - requires uploadImagenes feature
router.post(
  '/upload',
  checkFeature('uploadImagenes'),
  upload.single('photo'),
  handleMulterError,
  userPhotoController.uploadPhoto
);

// Eliminar foto de perfil de S3 - requires uploadImagenes feature
router.delete('/delete', checkFeature('uploadImagenes'), userPhotoController.deletePhoto);

// Actualizar foto de perfil del usuario autenticado
router.put('/my-photo', checkFeature('uploadImagenes'), userPhotoController.updateMyPhoto);

// Eliminar foto de perfil del usuario autenticado
router.delete('/my-photo', checkFeature('uploadImagenes'), userPhotoController.deleteMyPhoto);

export default router;

import express from 'express';
import documentoController from '../controllers/documento.controller.js';
import { authenticate } from '../middlewares/auth.js';
import { upload, handleMulterError } from '../middlewares/upload.js';

const router = express.Router();

// Todas las rutas requieren autenticación
router.use(authenticate);

// Subir documento
router.post(
  '/',
  upload.single('file'),
  handleMulterError,
  documentoController.uploadDocumento
);

// Obtener URL firmada para subida directa
router.post('/upload-url', documentoController.getUploadUrl);

// Obtener documento por ID
router.get('/:id', documentoController.getDocumentoById);

// Obtener documentos por cita
router.get('/cita/:citaId', documentoController.getDocumentosByCita);

// Obtener documentos por paciente
router.get('/paciente/:pacienteId', documentoController.getDocumentosByPaciente);

// Actualizar documento
router.put('/:id', documentoController.updateDocumento);

// Eliminar documento
router.delete('/:id', documentoController.deleteDocumento);

export default router;

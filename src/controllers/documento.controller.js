import documentoService from '../services/documento.service.js';
import s3Service from '../services/s3.service.js';

class DocumentoController {
  /**
   * Subir un documento
   */
  async uploadDocumento(req, res) {
    try {
      const { citaId, pacienteId, tipo, nombre, descripcion } = req.body;
      const file = req.file;

      if (!file) {
        return res.status(400).json({
          success: false,
          message: 'No se proporcionó ningún archivo',
        });
      }

      // Get consultorioId from cita
      const { Cita } = await import('../models/index.js');
      const cita = await Cita.findById(citaId).select('consultorioId').lean();
      
      if (!cita) {
        return res.status(404).json({
          success: false,
          message: 'Cita no encontrada',
        });
      }

      // Subir archivo a S3
      const { key, url } = await s3Service.uploadFile(file, 'documentos');

      // Crear registro en la base de datos
      const documento = await documentoService.createDocumento({
        nombre: nombre || file.originalname,
        descripcion,
        tipo,
        url,
        s3Key: key,
        mimeType: file.mimetype,
        tamanio: file.size,
        citaId,
        pacienteId,
        consultorioId: cita.consultorioId.toString(),
        uploadedBy: req.user.id,
      });

      res.status(201).json({
        success: true,
        data: documento,
        message: 'Documento subido exitosamente',
      });
    } catch (error) {
      console.error('Error al subir documento:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Error al subir el documento',
      });
    }
  }

  /**
   * Obtener URL firmada para subida directa desde el frontend
   */
  async getUploadUrl(req, res) {
    try {
      const { fileName, mimeType } = req.body;

      if (!fileName || !mimeType) {
        return res.status(400).json({
          success: false,
          message: 'fileName y mimeType son requeridos',
        });
      }

      const uploadData = await s3Service.getSignedUploadUrl(fileName, mimeType);

      res.json({
        success: true,
        data: uploadData,
      });
    } catch (error) {
      console.error('Error al generar URL de subida:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Error al generar URL de subida',
      });
    }
  }

  /**
   * Obtener documento por ID
   */
  async getDocumentoById(req, res) {
    try {
      const { id } = req.params;
      const documento = await documentoService.getDocumentoById(id);

      // Verificar permisos
      if (
        req.user.role !== 'admin' &&
        documento.consultorioId.toString() !== req.user.consultorioId
      ) {
        return res.status(403).json({
          success: false,
          message: 'No tienes permiso para acceder a este documento',
        });
      }

      res.json({
        success: true,
        data: documento,
      });
    } catch (error) {
      console.error('Error al obtener documento:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Error al obtener el documento',
      });
    }
  }

  /**
   * Obtener documentos por cita
   */
  async getDocumentosByCita(req, res) {
    try {
      const { citaId } = req.params;
      
      // Get consultorioId from cita
      const { Cita } = await import('../models/index.js');
      const cita = await Cita.findById(citaId).select('consultorioId').lean();
      
      if (!cita) {
        return res.status(404).json({
          success: false,
          message: 'Cita no encontrada',
        });
      }

      const documentos = await documentoService.getDocumentosByCita(citaId, cita.consultorioId.toString());

      res.json({
        success: true,
        data: documentos,
      });
    } catch (error) {
      console.error('Error al obtener documentos:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Error al obtener los documentos',
      });
    }
  }

  /**
   * Obtener documentos por paciente
   */
  async getDocumentosByPaciente(req, res) {
    try {
      const { pacienteId } = req.params;
      const { page = 1, limit = 20 } = req.query;
      
      // Get consultorioId from paciente
      const { Paciente } = await import('../models/index.js');
      const paciente = await Paciente.findById(pacienteId).select('consultorioId').lean();
      
      if (!paciente) {
        return res.status(404).json({
          success: false,
          message: 'Paciente no encontrado',
        });
      }

      const result = await documentoService.getDocumentosByPaciente(
        pacienteId,
        paciente.consultorioId.toString(),
        parseInt(page),
        parseInt(limit)
      );

      res.json({
        success: true,
        ...result,
      });
    } catch (error) {
      console.error('Error al obtener documentos:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Error al obtener los documentos',
      });
    }
  }

  /**
   * Eliminar documento
   */
  async deleteDocumento(req, res) {
    try {
      const { id } = req.params;
      
      // Get consultorioId from documento
      const documento = await documentoService.getDocumentoByIdRaw(id);
      
      if (!documento) {
        return res.status(404).json({
          success: false,
          message: 'Documento no encontrado',
        });
      }

      await documentoService.deleteDocumento(id, documento.consultorioId.toString());

      res.json({
        success: true,
        message: 'Documento eliminado exitosamente',
      });
    } catch (error) {
      console.error('Error al eliminar documento:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Error al eliminar el documento',
      });
    }
  }

  /**
   * Actualizar información del documento
   */
  async updateDocumento(req, res) {
    try {
      const { id } = req.params;
      const { nombre, descripcion, tipo } = req.body;
      const consultorioId =
        req.user.role === 'admin' ? req.body.consultorioId : req.user.consultorioId;

      const documento = await documentoService.updateDocumento(id, consultorioId, {
        nombre,
        descripcion,
        tipo,
      });

      res.json({
        success: true,
        data: documento,
        message: 'Documento actualizado exitosamente',
      });
    } catch (error) {
      console.error('Error al actualizar documento:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Error al actualizar el documento',
      });
    }
  }
}

export default new DocumentoController();

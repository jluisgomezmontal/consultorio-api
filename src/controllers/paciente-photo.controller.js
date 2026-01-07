import s3Service from '../services/s3.service.js';

class PacientePhotoController {
  /**
   * Subir foto de paciente a S3
   */
  async uploadPhoto(req, res) {
    try {
      const file = req.file;

      if (!file) {
        return res.status(400).json({
          success: false,
          message: 'No se proporcionó ningún archivo',
        });
      }

      // Validar que sea una imagen
      if (!file.mimetype.startsWith('image/')) {
        return res.status(400).json({
          success: false,
          message: 'El archivo debe ser una imagen',
        });
      }

      // Subir archivo a S3 en carpeta 'pacientes-fotos'
      const { key, url } = await s3Service.uploadFile(file, 'pacientes-fotos');

      res.status(200).json({
        success: true,
        data: {
          photoUrl: url,
          s3Key: key,
        },
        message: 'Foto subida exitosamente',
      });
    } catch (error) {
      console.error('Error al subir foto de paciente:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Error al subir la foto',
      });
    }
  }

  /**
   * Eliminar foto de paciente de S3
   */
  async deletePhoto(req, res) {
    try {
      const { s3Key } = req.body;

      if (!s3Key) {
        return res.status(400).json({
          success: false,
          message: 's3Key es requerido',
        });
      }

      // Validar que la key sea de la carpeta correcta
      if (!s3Key.startsWith('pacientes-fotos/')) {
        return res.status(400).json({
          success: false,
          message: 'Key de S3 inválida',
        });
      }

      await s3Service.deleteFile(s3Key);

      res.json({
        success: true,
        message: 'Foto eliminada exitosamente',
      });
    } catch (error) {
      console.error('Error al eliminar foto de paciente:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Error al eliminar la foto',
      });
    }
  }
}

export default new PacientePhotoController();

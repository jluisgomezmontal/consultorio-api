import s3Service from '../services/s3.service.js';
import User from '../models/User.model.js';

const userPhotoController = {
  /**
   * Subir foto de perfil de usuario a S3
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

      // Subir archivo a S3 en carpeta 'usuarios-fotos'
      const { key, url } = await s3Service.uploadFile(file, 'usuarios-fotos');

      res.status(200).json({
        success: true,
        data: {
          photoUrl: url,
          s3Key: key,
        },
      });
    } catch (error) {
      console.error('Error uploading user photo:', error);
      res.status(500).json({
        success: false,
        message: 'Error al subir la foto de perfil',
        error: error.message,
      });
    }
  },

  /**
   * Eliminar foto de perfil de usuario de S3
   */
  async deletePhoto(req, res) {
    try {
      const { s3Key } = req.body;

      if (!s3Key) {
        return res.status(400).json({
          success: false,
          message: 'Se requiere la clave S3 del archivo',
        });
      }

      await s3Service.deleteFile(s3Key);

      res.status(200).json({
        success: true,
        message: 'Foto de perfil eliminada correctamente',
      });
    } catch (error) {
      console.error('Error deleting user photo:', error);
      res.status(500).json({
        success: false,
        message: 'Error al eliminar la foto de perfil',
        error: error.message,
      });
    }
  },

  /**
   * Actualizar foto de perfil del usuario autenticado
   */
  async updateMyPhoto(req, res) {
    try {
      const userId = req.user.id;
      const { photoUrl, photoS3Key } = req.body;

      if (!photoUrl || !photoS3Key) {
        return res.status(400).json({
          success: false,
          message: 'Se requieren photoUrl y photoS3Key',
        });
      }

      const user = await User.findById(userId);

      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'Usuario no encontrado',
        });
      }

      // Si el usuario ya tiene una foto, eliminar la anterior de S3
      if (user.photoS3Key) {
        try {
          await s3Service.deleteFile(user.photoS3Key);
        } catch (error) {
          console.error('Error deleting old photo:', error);
        }
      }

      // Actualizar foto del usuario
      user.photoUrl = photoUrl;
      user.photoS3Key = photoS3Key;
      await user.save();

      res.status(200).json({
        success: true,
        message: 'Foto de perfil actualizada correctamente',
        data: {
          photoUrl: user.photoUrl,
          photoS3Key: user.photoS3Key,
        },
      });
    } catch (error) {
      console.error('Error updating user photo:', error);
      res.status(500).json({
        success: false,
        message: 'Error al actualizar la foto de perfil',
        error: error.message,
      });
    }
  },

  /**
   * Eliminar foto de perfil del usuario autenticado
   */
  async deleteMyPhoto(req, res) {
    try {
      const userId = req.user.id;

      const user = await User.findById(userId);

      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'Usuario no encontrado',
        });
      }

      if (!user.photoS3Key) {
        return res.status(400).json({
          success: false,
          message: 'El usuario no tiene foto de perfil',
        });
      }

      // Eliminar foto de S3
      await s3Service.deleteFile(user.photoS3Key);

      // Actualizar usuario
      user.photoUrl = undefined;
      user.photoS3Key = undefined;
      await user.save();

      res.status(200).json({
        success: true,
        message: 'Foto de perfil eliminada correctamente',
      });
    } catch (error) {
      console.error('Error deleting user photo:', error);
      res.status(500).json({
        success: false,
        message: 'Error al eliminar la foto de perfil',
        error: error.message,
      });
    }
  },
};

export default userPhotoController;

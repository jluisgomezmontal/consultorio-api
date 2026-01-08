import paqueteService from '../services/paquete.service.js';

class PaqueteController {
  /**
   * Obtener todos los paquetes disponibles
   */
  async getAllPaquetes(req, res) {
    try {
      const paquetes = await paqueteService.getAllPaquetes();

      res.json({
        success: true,
        data: paquetes,
      });
    } catch (error) {
      console.error('Error al obtener paquetes:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Error al obtener los paquetes',
      });
    }
  }

  /**
   * Obtener información del paquete actual del consultorio
   */
  async getConsultorioPaquete(req, res) {
    try {
      // El usuario puede tener múltiples consultorios, tomamos el primero
      const consultorioId = req.user.consultoriosIds?.[0] || req.user.consultorioId;

      if (!consultorioId) {
        return res.status(400).json({
          success: false,
          message: 'Usuario no tiene consultorio asignado',
        });
      }

      const info = await paqueteService.getConsultorioPaqueteInfo(consultorioId);

      res.json({
        success: true,
        data: info,
      });
    } catch (error) {
      console.error('Error al obtener información del paquete:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Error al obtener información del paquete',
      });
    }
  }

  /**
   * Verificar si se puede realizar una acción (límite)
   */
  async verificarLimite(req, res) {
    try {
      const consultorioId = req.user.consultoriosIds?.[0] || req.user.consultorioId;
      const { tipo } = req.params;

      const verificacion = await paqueteService.verificarLimite(consultorioId, tipo);

      res.json({
        success: true,
        data: verificacion,
      });
    } catch (error) {
      console.error('Error al verificar límite:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Error al verificar límite',
      });
    }
  }

  /**
   * Verificar si se tiene acceso a una feature
   */
  async verificarFeature(req, res) {
    try {
      const consultorioId = req.user.consultoriosIds?.[0] || req.user.consultorioId;
      const { feature } = req.params;

      const verificacion = await paqueteService.verificarFeature(consultorioId, feature);

      res.json({
        success: true,
        data: verificacion,
      });
    } catch (error) {
      console.error('Error al verificar feature:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Error al verificar feature',
      });
    }
  }

  /**
   * Actualizar paquete del consultorio (solo admin)
   */
  async actualizarPaquete(req, res) {
    try {
      const { consultorioId, paquete, tipoPago } = req.body;

      // Solo admins pueden cambiar paquetes de otros consultorios
      const targetConsultorioId =
        req.user.role === 'admin' ? consultorioId : (req.user.consultoriosIds?.[0] || req.user.consultorioId);

      if (!targetConsultorioId) {
        return res.status(400).json({
          success: false,
          message: 'Consultorio no identificado',
        });
      }

      const consultorio = await paqueteService.actualizarPaquete(
        targetConsultorioId,
        paquete,
        tipoPago
      );

      res.json({
        success: true,
        data: consultorio,
        message: 'Paquete actualizado exitosamente',
      });
    } catch (error) {
      console.error('Error al actualizar paquete:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Error al actualizar el paquete',
      });
    }
  }

  /**
   * Inicializar paquetes por defecto (solo para desarrollo/setup inicial)
   */
  async inicializarPaquetes(req, res) {
    try {
      await paqueteService.inicializarPaquetes();

      res.json({
        success: true,
        message: 'Paquetes inicializados correctamente',
      });
    } catch (error) {
      console.error('Error al inicializar paquetes:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Error al inicializar paquetes',
      });
    }
  }

  /**
   * Actualizar paquete de un consultorio específico (solo admin)
   */
  async actualizarPaqueteConsultorio(req, res) {
    try {
      const { consultorioId } = req.params;
      const { paquete, tipoPago, estado, fechaVencimiento } = req.body;

      const result = await paqueteService.actualizarPaqueteConsultorio(
        consultorioId,
        paquete,
        tipoPago,
        estado,
        fechaVencimiento
      );

      res.json({
        success: true,
        data: result,
        message: 'Paquete actualizado correctamente',
      });
    } catch (error) {
      console.error('Error al actualizar paquete del consultorio:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Error al actualizar paquete del consultorio',
      });
    }
  }

  /**
   * Obtener todos los consultorios con su información de paquete (solo admin)
   */
  async getAllConsultoriosConPaquete(req, res) {
    try {
      const consultorios = await paqueteService.getAllConsultoriosConPaquete();

      res.json({
        success: true,
        data: consultorios,
      });
    } catch (error) {
      console.error('Error al obtener consultorios:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Error al obtener consultorios',
      });
    }
  }

  /**
   * Obtener paquete por ID (solo admin)
   */
  async getPaqueteById(req, res) {
    try {
      const { id } = req.params;
      const paquete = await paqueteService.getPaqueteById(id);

      res.json({
        success: true,
        data: paquete,
      });
    } catch (error) {
      console.error('Error al obtener paquete:', error);
      res.status(404).json({
        success: false,
        message: error.message || 'Error al obtener el paquete',
      });
    }
  }

  /**
   * Crear nuevo paquete (solo admin)
   */
  async crearPaquete(req, res) {
    try {
      const paquete = await paqueteService.crearPaquete(req.body);

      res.status(201).json({
        success: true,
        data: paquete,
        message: 'Paquete creado exitosamente',
      });
    } catch (error) {
      console.error('Error al crear paquete:', error);
      res.status(400).json({
        success: false,
        message: error.message || 'Error al crear el paquete',
      });
    }
  }

  /**
   * Actualizar paquete por ID (solo admin)
   */
  async actualizarPaqueteById(req, res) {
    try {
      const { id } = req.params;
      const paquete = await paqueteService.actualizarPaqueteById(id, req.body);

      res.json({
        success: true,
        data: paquete,
        message: 'Paquete actualizado exitosamente',
      });
    } catch (error) {
      console.error('Error al actualizar paquete:', error);
      res.status(400).json({
        success: false,
        message: error.message || 'Error al actualizar el paquete',
      });
    }
  }

  /**
   * Eliminar paquete (solo admin)
   */
  async eliminarPaquete(req, res) {
    try {
      const { id } = req.params;
      const result = await paqueteService.eliminarPaquete(id);

      res.json({
        success: true,
        message: result.message,
      });
    } catch (error) {
      console.error('Error al eliminar paquete:', error);
      res.status(400).json({
        success: false,
        message: error.message || 'Error al eliminar el paquete',
      });
    }
  }
}

export default new PaqueteController();

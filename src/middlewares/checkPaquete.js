import paqueteService from '../services/paquete.service.js';

/**
 * Middleware para verificar límites de usuarios (doctores/recepcionistas)
 */
export const checkLimiteUsuarios = (tipoUsuario) => {
  return async (req, res, next) => {
    try {
      const consultorioId = req.user.consultoriosIds?.[0] || req.user.consultorioId;

      if (!consultorioId) {
        return res.status(400).json({
          success: false,
          message: 'Consultorio no identificado',
        });
      }

      // Solo validar en creación de usuarios
      if (req.method !== 'POST') {
        return next();
      }

      const verificacion = await paqueteService.verificarLimite(
        consultorioId,
        tipoUsuario
      );

      if (!verificacion.permitido) {
        return res.status(403).json({
          success: false,
          message: verificacion.mensaje,
          limiteAlcanzado: true,
          limite: {
            tipo: tipoUsuario,
            actual: verificacion.actual,
            maximo: verificacion.limite,
          },
        });
      }

      next();
    } catch (error) {
      console.error('Error en checkLimiteUsuarios:', error);
      return res.status(500).json({
        success: false,
        message: 'Error al verificar límites del paquete',
      });
    }
  };
};

/**
 * Middleware para verificar acceso a features
 */
export const checkFeature = (feature) => {
  return async (req, res, next) => {
    try {
      const consultorioId = req.user.consultoriosIds?.[0] || req.user.consultorioId;

      if (!consultorioId) {
        return res.status(400).json({
          success: false,
          message: 'Consultorio no identificado',
        });
      }

      const verificacion = await paqueteService.verificarFeature(
        consultorioId,
        feature
      );

      if (!verificacion.permitido) {
        return res.status(403).json({
          success: false,
          message: verificacion.mensaje,
          featureNoDisponible: true,
          feature: verificacion.feature,
          paqueteActual: verificacion.paquete,
        });
      }

      next();
    } catch (error) {
      console.error('Error en checkFeature:', error);
      return res.status(500).json({
        success: false,
        message: 'Error al verificar acceso a la funcionalidad',
      });
    }
  };
};

/**
 * Middleware para verificar estado de suscripción
 */
export const checkSuscripcionActiva = async (req, res, next) => {
  try {
    const consultorioId = req.user.consultoriosIds?.[0] || req.user.consultorioId;

    if (!consultorioId) {
      return res.status(400).json({
        success: false,
        message: 'Consultorio no identificado',
      });
    }

    const { Consultorio } = await import('../models/index.js');
    const consultorio = await Consultorio.findById(consultorioId);

    if (!consultorio) {
      return res.status(404).json({
        success: false,
        message: 'Consultorio no encontrado',
      });
    }

    // Verificar si la suscripción está activa o en trial
    if (
      consultorio.suscripcion.estado !== 'activa' &&
      consultorio.suscripcion.estado !== 'trial'
    ) {
      return res.status(403).json({
        success: false,
        message: 'Tu suscripción ha vencido. Por favor, renueva tu plan para continuar.',
        suscripcionVencida: true,
        estado: consultorio.suscripcion.estado,
      });
    }

    // Verificar si la fecha de vencimiento ha pasado
    if (
      consultorio.suscripcion.fechaVencimiento &&
      new Date() > new Date(consultorio.suscripcion.fechaVencimiento)
    ) {
      // Actualizar estado a vencida
      consultorio.suscripcion.estado = 'vencida';
      await consultorio.save();

      return res.status(403).json({
        success: false,
        message: 'Tu suscripción ha vencido. Por favor, renueva tu plan para continuar.',
        suscripcionVencida: true,
        fechaVencimiento: consultorio.suscripcion.fechaVencimiento,
      });
    }

    next();
  } catch (error) {
    console.error('Error en checkSuscripcionActiva:', error);
    return res.status(500).json({
      success: false,
      message: 'Error al verificar estado de suscripción',
    });
  }
};

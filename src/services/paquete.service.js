import Paquete from '../models/Paquete.model.js';
import Consultorio from '../models/Consultorio.model.js';
import User from '../models/User.model.js';

class PaqueteService {
  /**
   * Obtener todos los paquetes activos
   */
  async getAllPaquetes() {
    const paquetes = await Paquete.find({ activo: true }).sort({ orden: 1 });
    return paquetes;
  }

  /**
   * Obtener paquete por nombre
   */
  async getPaqueteByNombre(nombre) {
    const paquete = await Paquete.findOne({ nombre, activo: true });
    if (!paquete) {
      throw new Error(`Paquete ${nombre} no encontrado`);
    }
    return paquete;
  }

  /**
   * Verificar si un consultorio puede realizar una acción según su paquete
   */
  async verificarLimite(consultorioId, tipo) {
    const consultorio = await Consultorio.findById(consultorioId);
    if (!consultorio) {
      throw new Error('Consultorio no encontrado');
    }

    const paquete = await this.getPaqueteByNombre(consultorio.paquete);

    switch (tipo) {
      case 'doctor':
        const doctoresCount = await User.countDocuments({
          consultoriosIds: consultorioId,
          role: 'doctor',
        });
        return {
          permitido: doctoresCount < paquete.limites.doctores,
          actual: doctoresCount,
          limite: paquete.limites.doctores,
          mensaje: `Has alcanzado el límite de ${paquete.limites.doctores} doctor(es) en tu plan ${paquete.displayName}`,
        };

      case 'recepcionista':
        const recepcionistasCount = await User.countDocuments({
          consultoriosIds: consultorioId,
          role: 'recepcionista',
        });
        return {
          permitido: recepcionistasCount < paquete.limites.recepcionistas,
          actual: recepcionistasCount,
          limite: paquete.limites.recepcionistas,
          mensaje: `Has alcanzado el límite de ${paquete.limites.recepcionistas} recepcionista(s) en tu plan ${paquete.displayName}`,
        };

      case 'consultorio':
        // Para futuro: cuando un usuario pueda tener múltiples consultorios
        return {
          permitido: true,
          actual: 1,
          limite: paquete.limites.consultorios,
          mensaje: `Has alcanzado el límite de ${paquete.limites.consultorios} consultorio(s) en tu plan ${paquete.displayName}`,
        };

      default:
        throw new Error(`Tipo de límite desconocido: ${tipo}`);
    }
  }

  /**
   * Verificar si un consultorio tiene acceso a una feature
   */
  async verificarFeature(consultorioId, feature) {
    const consultorio = await Consultorio.findById(consultorioId);
    if (!consultorio) {
      throw new Error('Consultorio no encontrado');
    }

    const paquete = await this.getPaqueteByNombre(consultorio.paquete);

    const featureHabilitada = paquete.features[feature];
    
    return {
      permitido: featureHabilitada === true,
      feature,
      paquete: paquete.displayName,
      mensaje: `La función "${feature}" no está disponible en tu plan ${paquete.displayName}. Actualiza tu plan para acceder.`,
    };
  }

  /**
   * Obtener información completa del paquete de un consultorio
   */
  async getConsultorioPaqueteInfo(consultorioId) {
    const consultorio = await Consultorio.findById(consultorioId);
    if (!consultorio) {
      throw new Error('Consultorio no encontrado');
    }

    // Verificar si la suscripción está vencida
    if (
      consultorio.suscripcion.estado === 'activa' &&
      consultorio.suscripcion.fechaVencimiento &&
      new Date() > new Date(consultorio.suscripcion.fechaVencimiento)
    ) {
      consultorio.suscripcion.estado = 'vencida';
      await consultorio.save();
      console.log(`[Paquete Service] Suscripción vencida para consultorio ${consultorioId}`);
    }

    const paquete = await this.getPaqueteByNombre(consultorio.paquete);

    // Contar usuarios actuales
    const [doctoresCount, recepcionistasCount] = await Promise.all([
      User.countDocuments({ consultoriosIds: consultorioId, role: 'doctor' }),
      User.countDocuments({ consultoriosIds: consultorioId, role: 'recepcionista' }),
    ]);

    return {
      paquete: {
        nombre: paquete.nombre,
        displayName: paquete.displayName,
        descripcion: paquete.descripcion,
      },
      suscripcion: consultorio.suscripcion,
      uso: {
        doctores: {
          actual: doctoresCount,
          limite: paquete.limites.doctores,
          disponible: paquete.limites.doctores - doctoresCount,
        },
        recepcionistas: {
          actual: recepcionistasCount,
          limite: paquete.limites.recepcionistas,
          disponible: paquete.limites.recepcionistas - recepcionistasCount,
        },
      },
      features: paquete.features,
    };
  }

  /**
   * Actualizar paquete de un consultorio
   */
  async actualizarPaquete(consultorioId, nuevoPaquete, tipoPago = 'mensual') {
    const consultorio = await Consultorio.findById(consultorioId);
    if (!consultorio) {
      throw new Error('Consultorio no encontrado');
    }

    const paquete = await this.getPaqueteByNombre(nuevoPaquete);

    // Calcular fecha de vencimiento
    const fechaInicio = new Date();
    const fechaVencimiento = new Date();
    if (tipoPago === 'anual') {
      fechaVencimiento.setFullYear(fechaVencimiento.getFullYear() + 1);
    } else {
      fechaVencimiento.setMonth(fechaVencimiento.getMonth() + 1);
    }

    consultorio.paquete = paquete.nombre;
    consultorio.suscripcion = {
      estado: 'activa',
      fechaInicio,
      fechaVencimiento,
      tipoPago,
    };

    await consultorio.save();

    return consultorio;
  }

  /**
   * Inicializar paquetes por defecto en la base de datos
   */
  /**
   * Actualizar paquete de un consultorio específico (admin)
   */
  async actualizarPaqueteConsultorio(consultorioId, paquete, tipoPago, estado, fechaVencimiento) {
    const consultorio = await Consultorio.findById(consultorioId);
    if (!consultorio) {
      throw new Error('Consultorio no encontrado');
    }

    const paqueteInfo = await Paquete.findOne({ nombre: paquete });
    if (!paqueteInfo) {
      throw new Error('Paquete no válido');
    }

    consultorio.paquete = paquete;
    if (tipoPago) consultorio.suscripcion.tipoPago = tipoPago;
    if (estado) consultorio.suscripcion.estado = estado;
    if (fechaVencimiento) consultorio.suscripcion.fechaVencimiento = fechaVencimiento;

    await consultorio.save();
    return consultorio;
  }

  /**
   * Obtener todos los consultorios con información de paquete (admin)
   */
  async getAllConsultoriosConPaquete() {
    const consultorios = await Consultorio.find()
      .select('name email phone address paquete suscripcion createdAt')
      .lean();

    const consultoriosConInfo = await Promise.all(
      consultorios.map(async (consultorio) => {
        const paqueteInfo = await Paquete.findOne({ nombre: consultorio.paquete });
        
        const doctores = await User.countDocuments({
          consultoriosIds: consultorio._id,
          role: 'doctor',
        });
        
        const recepcionistas = await User.countDocuments({
          consultoriosIds: consultorio._id,
          role: 'recepcionista',
        });

        return {
          ...consultorio,
          paqueteInfo,
          uso: {
            doctores,
            recepcionistas,
          },
        };
      })
    );

    return consultoriosConInfo;
  }

  async getPaqueteById(id) {
    const paquete = await Paquete.findById(id);
    if (!paquete) {
      throw new Error('Paquete no encontrado');
    }
    return paquete;
  }

  async crearPaquete(data) {
    const paqueteExistente = await Paquete.findOne({ nombre: data.nombre });
    if (paqueteExistente) {
      throw new Error(`Ya existe un paquete con el nombre: ${data.nombre}`);
    }

    const paquete = new Paquete(data);
    await paquete.save();
    return paquete;
  }

  async actualizarPaqueteById(id, data) {
    const paquete = await Paquete.findById(id);
    if (!paquete) {
      throw new Error('Paquete no encontrado');
    }

    if (data.nombre && data.nombre !== paquete.nombre) {
      const paqueteExistente = await Paquete.findOne({ nombre: data.nombre });
      if (paqueteExistente) {
        throw new Error(`Ya existe un paquete con el nombre: ${data.nombre}`);
      }
    }

    Object.assign(paquete, data);
    await paquete.save();
    return paquete;
  }

  async eliminarPaquete(id) {
    const paquete = await Paquete.findById(id);
    if (!paquete) {
      throw new Error('Paquete no encontrado');
    }

    const consultoriosUsandoPaquete = await Consultorio.countDocuments({ paquete: paquete.nombre });
    if (consultoriosUsandoPaquete > 0) {
      throw new Error(`No se puede eliminar el paquete. ${consultoriosUsandoPaquete} consultorio(s) lo están usando`);
    }

    await Paquete.findByIdAndDelete(id);
    return { message: 'Paquete eliminado exitosamente' };
  }

  async inicializarPaquetes() {
    const paquetesExistentes = await Paquete.countDocuments();
    if (paquetesExistentes > 0) {
      throw new Error('Los paquetes ya están inicializados');
    }

    const paquetesDefault = [
      {
        nombre: 'basico',
        displayName: 'Básico',
        descripcion: 'Plan inicial para consultorios pequeños',
        precio: {
          mensual: 299,
          anual: 2990,
        },
        limites: {
          consultorios: 1,
          doctores: 1,
          recepcionistas: 1,
          pacientes: null,
          citas: null,
        },
        features: {
          uploadDocumentos: false,
          uploadImagenes: false,
          reportesAvanzados: false,
          integraciones: false,
          soportePrioritario: false,
        },
        activo: true,
        orden: 1,
      },
      {
        nombre: 'profesional',
        displayName: 'Profesional',
        descripcion: 'Plan completo para profesionales independientes',
        precio: {
          mensual: 599,
          anual: 5990,
        },
        limites: {
          consultorios: 1,
          doctores: 1,
          recepcionistas: 1,
          pacientes: null,
          citas: null,
        },
        features: {
          uploadDocumentos: true,
          uploadImagenes: true,
          reportesAvanzados: true,
          integraciones: false,
          soportePrioritario: false,
        },
        activo: true,
        orden: 2,
      },
      {
        nombre: 'clinica',
        displayName: 'Clínica',
        descripcion: 'Plan avanzado para clínicas y equipos médicos',
        precio: {
          mensual: 1199,
          anual: 11990,
        },
        limites: {
          consultorios: 1,
          doctores: 2,
          recepcionistas: 2,
          pacientes: null,
          citas: null,
        },
        features: {
          uploadDocumentos: true,
          uploadImagenes: true,
          reportesAvanzados: true,
          integraciones: true,
          soportePrioritario: true,
        },
        activo: true,
        orden: 3,
      },
    ];

    await Paquete.insertMany(paquetesDefault);
    console.log('✅ Paquetes inicializados correctamente');
  }
}

export default new PaqueteService();

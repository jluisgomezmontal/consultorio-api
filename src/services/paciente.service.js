import { Paciente, Cita, User, Consultorio, Pago } from '../models/index.js';
import { NotFoundError } from '../utils/errors.js';

class PacienteService {
  /**
   * Get all pacientes with pagination and search
   * @param {Number} page - Page number
   * @param {Number} limit - Items per page
   * @param {String} search - Search term
   * @param {Object} consultorioFilter - MongoDB filter for consultorio restriction (from middleware)
   */
  async getAllPacientes(page = 1, limit = 10, search = '', consultorioFilter = null) {
    const skip = (page - 1) * limit;

    const filter = search
      ? {
          $or: [
            { fullName: { $regex: search, $options: 'i' } },
            { phone: { $regex: search, $options: 'i' } },
            { email: { $regex: search, $options: 'i' } },
          ],
        }
      : {};

    // Apply consultorio filter if provided (for non-admin users)
    if (consultorioFilter) {
      Object.assign(filter, consultorioFilter);
    }

    const [pacientesRaw, total] = await Promise.all([
      Paciente.find(filter).skip(skip).limit(limit).sort({ createdAt: -1 }).lean(),
      Paciente.countDocuments(filter),
    ]);

    const pacientes = pacientesRaw.map((paciente) => {
      const { _id, __v, ...rest } = paciente;
      return {
        ...rest,
        id: _id.toString(),
      };
    });

    return { pacientes, total, page, limit };
  }

  /**
   * Get paciente by ID
   * @param {String} id - Paciente ID
   * @param {Object} consultorioFilter - MongoDB filter for consultorio restriction (from middleware)
   */
  async getPacienteById(id, consultorioFilter = null) {
    const filter = { _id: id };
    
    // Apply consultorio filter if provided (for non-admin users)
    if (consultorioFilter) {
      Object.assign(filter, consultorioFilter);
    }

    const pacienteDoc = await Paciente.findOne(filter).lean();

    if (!pacienteDoc) {
      throw new NotFoundError('Paciente not found or access denied');
    }

    // Count citas for this paciente
    const citasCount = await Cita.countDocuments({ pacienteId: id });
    const { _id, __v, ...paciente } = pacienteDoc;

    return {
      ...paciente,
      id: _id.toString(),
      _count: { citas: citasCount },
    };
  }

  /**
   * Create new paciente
   * @param {Object} data - Paciente data (must include consultorioId)
   */
  async createPaciente(data) {
    const paciente = await Paciente.create(data);
    return paciente.toObject();
  }

  /**
   * Update paciente
   * @param {String} id - Paciente ID
   * @param {Object} data - Update data
   * @param {Object} consultorioFilter - MongoDB filter for consultorio restriction (from middleware)
   */
  async updatePaciente(id, data, consultorioFilter = null) {
    const filter = { _id: id };
    
    // Apply consultorio filter if provided (for non-admin users)
    if (consultorioFilter) {
      Object.assign(filter, consultorioFilter);
    }

    const paciente = await Paciente.findOneAndUpdate(filter, data, {
      new: true,
      runValidators: true,
    }).lean();

    if (!paciente) {
      throw new NotFoundError('Paciente not found or access denied');
    }

    const { _id, __v, ...rest } = paciente;

    return {
      ...rest,
      id: _id.toString(),
    };
  }

  /**
   * Delete paciente
   * @param {String} id - Paciente ID
   * @param {Object} consultorioFilter - MongoDB filter for consultorio restriction (from middleware)
   */
  async deletePaciente(id, consultorioFilter = null) {
    const filter = { _id: id };
    
    // Apply consultorio filter if provided (for non-admin users)
    if (consultorioFilter) {
      Object.assign(filter, consultorioFilter);
    }

    const paciente = await Paciente.findOneAndDelete(filter);

    if (!paciente) {
      throw new NotFoundError('Paciente not found or access denied');
    }

    // Delete all related citas and their pagos
    const citas = await Cita.find({ pacienteId: id });
    const citaIds = citas.map((cita) => cita._id);
    await Pago.deleteMany({ citaId: { $in: citaIds } });
    await Cita.deleteMany({ pacienteId: id });

    return { message: 'Paciente deleted successfully' };
  }

  /**
   * Get paciente medical history with all citas
   * @param {String} id - Paciente ID
   * @param {Object} consultorioFilter - MongoDB filter for consultorio restriction (from middleware)
   */
  async getPacienteHistory(id, consultorioFilter = null) {
    const pacienteDoc = await Paciente.findById(id).lean();

    if (!pacienteDoc) {
      throw new NotFoundError('Paciente not found');
    }

    // Build filter for citas
    const citasFilter = { pacienteId: id };
    
    // Apply consultorio filter if provided (for non-admin users)
    if (consultorioFilter) {
      Object.assign(citasFilter, consultorioFilter);
    }

    const citas = await Cita.find(citasFilter)
      .populate('doctorId', 'id name email')
      .populate('consultorioId', 'id name')
      .sort({ date: -1 })
      .lean();

    // Get pagos for each cita and normalize data
    const citasWithPagos = await Promise.all(
      citas.map(async (cita) => {
        const pagosRaw = await Pago.find({ citaId: cita._id }).lean();
        const pagos = pagosRaw.map((pago) => {
          const { _id, __v, citaId, ...rest } = pago;
          return {
            ...rest,
            id: _id.toString(),
            citaId: citaId?.toString() ?? citaId,
          };
        });

        const { _id, __v, doctorId, consultorioId, pacienteId, ...rest } = cita;
        return {
          ...rest,
          id: _id.toString(),
          pacienteId: pacienteId?.toString() ?? pacienteId,
          doctorId: doctorId?.id || doctorId?._id?.toString(),
          consultorioId: consultorioId?.id || consultorioId?._id?.toString(),
          doctor: doctorId,
          consultorio: consultorioId,
          pagos,
        };
      })
    );

    const { _id, __v, ...paciente } = pacienteDoc;

    return {
      ...paciente,
      id: _id.toString(),
      citas: citasWithPagos,
    };
  }

  /**
   * Search pacientes by name, phone, or email
   * @param {String} query - Search query
   * @param {Object} consultorioFilter - MongoDB filter for consultorio restriction (from middleware)
   */
  async searchPacientes(query, consultorioFilter = null) {
    const filter = {
      $or: [
        { fullName: { $regex: query, $options: 'i' } },
        { phone: { $regex: query, $options: 'i' } },
        { email: { $regex: query, $options: 'i' } },
      ],
    };

    // Apply consultorio filter if provided (for non-admin users)
    if (consultorioFilter) {
      Object.assign(filter, consultorioFilter);
    }

    const pacientes = await Paciente.find(filter)
      .limit(20)
      .lean();

    return pacientes;
  }
}

export default new PacienteService();

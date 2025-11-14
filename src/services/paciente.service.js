import { Paciente, Cita, User, Consultorio, Pago } from '../models/index.js';
import { NotFoundError } from '../utils/errors.js';

class PacienteService {
  /**
   * Get all pacientes with pagination and search
   */
  async getAllPacientes(page = 1, limit = 10, search = '') {
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
   */
  async getPacienteById(id) {
    const pacienteDoc = await Paciente.findById(id).lean();

    if (!pacienteDoc) {
      throw new NotFoundError('Paciente not found');
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
   */
  async createPaciente(data) {
    const paciente = await Paciente.create(data);
    return paciente.toObject();
  }

  /**
   * Update paciente
   */
  async updatePaciente(id, data) {
    const paciente = await Paciente.findByIdAndUpdate(id, data, {
      new: true,
      runValidators: true,
    }).lean();

    if (!paciente) {
      throw new NotFoundError('Paciente not found');
    }

    const { _id, __v, ...rest } = paciente;

    return {
      ...rest,
      id: _id.toString(),
    };
  }

  /**
   * Delete paciente
   */
  async deletePaciente(id) {
    const paciente = await Paciente.findByIdAndDelete(id);

    if (!paciente) {
      throw new NotFoundError('Paciente not found');
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
   */
  async getPacienteHistory(id) {
    const paciente = await Paciente.findById(id).lean();

    if (!paciente) {
      throw new NotFoundError('Paciente not found');
    }

    const citas = await Cita.find({ pacienteId: id })
      .populate('doctorId', 'id name email')
      .populate('consultorioId', 'id name')
      .sort({ date: -1 })
      .lean();

    // Get pagos for each cita
    const citasWithPagos = await Promise.all(
      citas.map(async (cita) => {
        const pagos = await Pago.find({ citaId: cita._id }).lean();
        return {
          ...cita,
          doctor: cita.doctorId,
          consultorio: cita.consultorioId,
          pagos,
        };
      })
    );

    paciente.citas = citasWithPagos;

    return paciente;
  }

  /**
   * Search pacientes by name, phone, or email
   */
  async searchPacientes(query) {
    const pacientes = await Paciente.find({
      $or: [
        { fullName: { $regex: query, $options: 'i' } },
        { phone: { $regex: query, $options: 'i' } },
        { email: { $regex: query, $options: 'i' } },
      ],
    })
      .limit(20)
      .lean();

    return pacientes;
  }
}

export default new PacienteService();

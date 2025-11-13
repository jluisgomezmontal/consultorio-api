import { Consultorio, User, Cita, Pago } from '../models/index.js';
import { NotFoundError } from '../utils/errors.js';

class ConsultorioService {
  /**
   * Get all consultorios
   */
  async getAllConsultorios(page = 1, limit = 10) {
    const skip = (page - 1) * limit;

    const [consultorios, total] = await Promise.all([
      Consultorio.find().skip(skip).limit(limit).sort({ createdAt: -1 }).lean(),
      Consultorio.countDocuments(),
    ]);

    // Get counts for each consultorio
    const consultoriosWithCounts = await Promise.all(
      consultorios.map(async (consultorio) => {
        const usersCount = await User.countDocuments({ consultorioId: consultorio._id });
        const citasCount = await Cita.countDocuments({ consultorioId: consultorio._id });
        return {
          ...consultorio,
          _count: {
            users: usersCount,
            citas: citasCount,
          },
        };
      })
    );

    return { consultorios: consultoriosWithCounts, total, page, limit };
  }

  /**
   * Get consultorio by ID
   */
  async getConsultorioById(id) {
    const consultorio = await Consultorio.findById(id).lean();

    if (!consultorio) {
      throw new NotFoundError('Consultorio not found');
    }

    // Get users and citas count
    const [users, citasCount] = await Promise.all([
      User.find({ consultorioId: id }).lean(),
      Cita.countDocuments({ consultorioId: id }),
    ]);

    return {
      ...consultorio,
      users,
      _count: {
        citas: citasCount,
      },
    };
  }

  /**
   * Create new consultorio
   */
  async createConsultorio(data) {
    const consultorio = await Consultorio.create(data);
    return consultorio.toObject();
  }

  /**
   * Update consultorio
   */
  async updateConsultorio(id, data) {
    const consultorio = await Consultorio.findByIdAndUpdate(id, data, {
      new: true,
      runValidators: true,
    }).lean();

    if (!consultorio) {
      throw new NotFoundError('Consultorio not found');
    }

    return consultorio;
  }

  /**
   * Delete consultorio
   */
  async deleteConsultorio(id) {
    const consultorio = await Consultorio.findById(id);

    if (!consultorio) {
      throw new NotFoundError('Consultorio not found');
    }

    // Delete all related data (cascade delete)
    const citas = await Cita.find({ consultorioId: id });
    const citaIds = citas.map((cita) => cita._id);
    await Pago.deleteMany({ citaId: { $in: citaIds } });
    await Cita.deleteMany({ consultorioId: id });
    await User.deleteMany({ consultorioId: id });
    await Consultorio.findByIdAndDelete(id);

    return { message: 'Consultorio deleted successfully' };
  }

  /**
   * Get consultorio summary with statistics
   */
  async getConsultorioSummary(id) {
    const consultorio = await Consultorio.findById(id).lean();

    if (!consultorio) {
      throw new NotFoundError('Consultorio not found');
    }

    const users = await User.find({ consultorioId: id }).lean();

    // Get citas statistics
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [
      totalCitas,
      citasHoy,
      citasPendientes,
      uniquePacientes,
      citasForIngresos,
    ] = await Promise.all([
      Cita.countDocuments({ consultorioId: id }),
      Cita.countDocuments({
        consultorioId: id,
        date: { $gte: today },
      }),
      Cita.countDocuments({
        consultorioId: id,
        estado: 'pendiente',
      }),
      Cita.distinct('pacienteId', { consultorioId: id }),
      Cita.find({ consultorioId: id }).select('_id').lean(),
    ]);

    const citaIds = citasForIngresos.map((c) => c._id);
    const ingresosResult = await Pago.aggregate([
      {
        $match: {
          citaId: { $in: citaIds },
          estatus: 'pagado',
        },
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$monto' },
        },
      },
    ]);

    return {
      consultorio: { ...consultorio, users },
      statistics: {
        totalCitas,
        citasHoy,
        citasPendientes,
        totalPacientes: uniquePacientes.length,
        totalIngresos: ingresosResult[0]?.total || 0,
        totalDoctors: users.filter((u) => u.role === 'doctor').length,
        totalStaff: users.length,
      },
    };
  }
}

export default new ConsultorioService();

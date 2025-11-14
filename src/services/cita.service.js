import { Cita, Paciente, User, Consultorio, Pago } from '../models/index.js';
import { NotFoundError, ConflictError, BadRequestError } from '../utils/errors.js';

class CitaService {
  /**
   * Get all citas with filters and pagination
   */
  async getAllCitas(filters = {}, page = 1, limit = 10) {
    const skip = (page - 1) * limit;

    const filter = {};

    if (filters.doctorId) {
      filter.doctorId = filters.doctorId;
    }

    if (filters.pacienteId) {
      filter.pacienteId = filters.pacienteId;
    }

    if (filters.consultorioId) {
      filter.consultorioId = filters.consultorioId;
    }

    if (filters.estado) {
      filter.estado = filters.estado;
    }

    if (filters.dateFrom || filters.dateTo) {
      filter.date = {};
      if (filters.dateFrom) {
        filter.date.$gte = new Date(filters.dateFrom);
      }
      if (filters.dateTo) {
        filter.date.$lte = new Date(filters.dateTo);
      }
    }

    // Search needs to be handled separately with aggregation
    let query = Cita.find(filter)
      .skip(skip)
      .limit(limit)
      .populate('pacienteId', 'id fullName phone email')
      .populate('doctorId', 'id name email')
      .populate('consultorioId', 'id name')
      .sort({ date: 1, time: 1 });

    const [citas, total] = await Promise.all([
      query.lean(),
      Cita.countDocuments(filter),
    ]);

    // Get pagos for each cita
    const citasWithPagos = await Promise.all(
      citas.map(async (cita) => {
        const pagos = await Pago.find({ citaId: cita._id }).lean();
        const { _id, __v, pacienteId, doctorId, consultorioId, ...rest } = cita;
        const paciente = pacienteId;
        const doctor = doctorId;
        const consultorio = consultorioId;
        return {
          ...rest,
          id: _id.toString(),
          pacienteId: paciente?.id || paciente?._id?.toString(),
          doctorId: doctor?.id || doctor?._id?.toString(),
          consultorioId: consultorio?.id || consultorio?._id?.toString(),
          paciente,
          doctor,
          consultorio,
          pagos,
        };
      })
    );

    // Apply text search filter if provided
    let filteredCitas = citasWithPagos;
    if (filters.search) {
      const searchTerm = filters.search.trim().toLowerCase();
      if (searchTerm.length > 0) {
        filteredCitas = citasWithPagos.filter((cita) => {
          return (
            cita.paciente?.fullName?.toLowerCase().includes(searchTerm) ||
            cita.paciente?.phone?.toLowerCase().includes(searchTerm) ||
            cita.paciente?.email?.toLowerCase().includes(searchTerm) ||
            cita.doctor?.name?.toLowerCase().includes(searchTerm) ||
            cita.doctor?.email?.toLowerCase().includes(searchTerm) ||
            cita.consultorio?.name?.toLowerCase().includes(searchTerm) ||
            cita.motivo?.toLowerCase().includes(searchTerm) ||
            cita.diagnostico?.toLowerCase().includes(searchTerm) ||
            cita.tratamiento?.toLowerCase().includes(searchTerm) ||
            cita.notas?.toLowerCase().includes(searchTerm)
          );
        });
      }
    }

    return { citas: filteredCitas, total, page, limit };
  }

  /**
   * Get cita by ID
   */
  async getCitaById(id) {
    const cita = await Cita.findById(id)
      .populate('pacienteId')
      .populate('doctorId', 'id name email role')
      .populate('consultorioId')
      .lean();

    if (!cita) {
      throw new NotFoundError('Cita not found');
    }

    // Get pagos
    const pagosLean = await Pago.find({ citaId: id }).sort({ createdAt: -1 }).lean();
    const pagos = pagosLean.map((pago) => {
      const { _id, __v, citaId: pagoCitaId, ...rest } = pago;
      return {
        ...rest,
        id: _id.toString(),
        citaId: pagoCitaId?.toString() ?? pagoCitaId,
      };
    });

    const { _id, __v, pacienteId, doctorId, consultorioId, ...rest } = cita;
    const pacienteRef = pacienteId;
    const doctorRef = doctorId;
    const consultorioRef = consultorioId;

    return {
      ...rest,
      id: _id.toString(),
      pacienteId: pacienteRef?.id || pacienteRef?._id?.toString(),
      doctorId: doctorRef?.id || doctorRef?._id?.toString(),
      consultorioId: consultorioRef?.id || consultorioRef?._id?.toString(),
      paciente: pacienteRef,
      doctor: doctorRef,
      consultorio: consultorioRef,
      pagos,
    };
  }

  /**
   * Create new cita with conflict validation
   */
  async createCita(data) {
    // Validate paciente exists
    const paciente = await Paciente.findById(data.pacienteId);
    if (!paciente) {
      throw new NotFoundError('Paciente not found');
    }

    // Validate doctor exists and is a doctor
    const doctor = await User.findById(data.doctorId);
    if (!doctor) {
      throw new NotFoundError('Doctor not found');
    }
    if (doctor.role !== 'doctor') {
      throw new BadRequestError('Selected user is not a doctor');
    }

    // Validate consultorio exists
    const consultorio = await Consultorio.findById(data.consultorioId);
    if (!consultorio) {
      throw new NotFoundError('Consultorio not found');
    }

    // Check for schedule conflicts
    const conflictingCita = await this.checkScheduleConflict(
      data.doctorId,
      data.date,
      data.time
    );

    if (conflictingCita) {
      throw new ConflictError(
        `Doctor already has an appointment at ${data.time} on ${new Date(data.date).toLocaleDateString()}`
      );
    }

    // Create cita
    const cita = await Cita.create({
      ...data,
      date: new Date(data.date),
    });

    const populatedCita = await Cita.findById(cita._id)
      .populate('pacienteId')
      .populate('doctorId', 'id name email')
      .populate('consultorioId')
      .lean();

    const { _id, __v, pacienteId, doctorId, consultorioId, ...rest } = populatedCita;
    const pacienteRef = pacienteId;
    const doctorRef = doctorId;
    const consultorioRef = consultorioId;

    return {
      ...rest,
      id: _id.toString(),
      pacienteId: pacienteRef?.id || pacienteRef?._id?.toString(),
      doctorId: doctorRef?.id || doctorRef?._id?.toString(),
      consultorioId: consultorioRef?.id || consultorioRef?._id?.toString(),
      paciente: pacienteRef,
      doctor: doctorRef,
      consultorio: consultorioRef,
    };
  }

  /**
   * Update cita
   */
  async updateCita(id, data) {
    const cita = await Cita.findById(id);

    if (!cita) {
      throw new NotFoundError('Cita not found');
    }

    // If updating date/time/doctor, check for conflicts
    if (data.date || data.time || data.doctorId) {
      const doctorId = data.doctorId || cita.doctorId;
      const date = data.date || cita.date;
      const time = data.time || cita.time;

      const conflictingCita = await this.checkScheduleConflict(
        doctorId,
        date,
        time,
        id // exclude current cita
      );

      if (conflictingCita) {
        throw new ConflictError(
          `Doctor already has an appointment at ${time} on ${new Date(date).toLocaleDateString()}`
        );
      }
    }

    // Update cita
    const updateData = { ...data };
    if (data.date) {
      updateData.date = new Date(data.date);
    }

    const updatedCita = await Cita.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    })
      .populate('pacienteId')
      .populate('doctorId', 'id name email')
      .populate('consultorioId')
      .lean();

    // Get pagos
    const pagos = await Pago.find({ citaId: id }).lean();

    const { _id, __v, pacienteId, doctorId, consultorioId, ...rest } = updatedCita;
    const pacienteRef = pacienteId;
    const doctorRef = doctorId;
    const consultorioRef = consultorioId;

    return {
      ...rest,
      id: _id.toString(),
      pacienteId: pacienteRef?.id || pacienteRef?._id?.toString(),
      doctorId: doctorRef?.id || doctorRef?._id?.toString(),
      consultorioId: consultorioRef?.id || consultorioRef?._id?.toString(),
      paciente: pacienteRef,
      doctor: doctorRef,
      consultorio: consultorioRef,
      pagos,
    };
  }

  /**
   * Cancel cita
   */
  async cancelCita(id) {
    const cita = await Cita.findById(id);

    if (!cita) {
      throw new NotFoundError('Cita not found');
    }

    const updatedCita = await Cita.findByIdAndUpdate(
      id,
      { estado: 'cancelada' },
      { new: true }
    )
      .populate('pacienteId')
      .populate('doctorId', 'id name email')
      .populate('consultorioId')
      .lean();

    const { _id, __v, pacienteId, doctorId, consultorioId, ...rest } = updatedCita;
    const pacienteRef = pacienteId;
    const doctorRef = doctorId;
    const consultorioRef = consultorioId;

    return {
      ...rest,
      id: _id.toString(),
      pacienteId: pacienteRef?.id || pacienteRef?._id?.toString(),
      doctorId: doctorRef?.id || doctorRef?._id?.toString(),
      consultorioId: consultorioRef?.id || consultorioRef?._id?.toString(),
      paciente: pacienteRef,
      doctor: doctorRef,
      consultorio: consultorioRef,
    };
  }

  /**
   * Delete cita
   */
  async deleteCita(id) {
    const cita = await Cita.findById(id);

    if (!cita) {
      throw new NotFoundError('Cita not found');
    }

    // Delete all related pagos
    await Pago.deleteMany({ citaId: id });

    await Cita.findByIdAndDelete(id);

    return { message: 'Cita deleted successfully' };
  }

  /**
   * Check for schedule conflicts
   */
  async checkScheduleConflict(doctorId, date, time, excludeCitaId = null) {
    const dateObj = new Date(date);
    dateObj.setHours(0, 0, 0, 0);

    const nextDay = new Date(dateObj);
    nextDay.setDate(nextDay.getDate() + 1);

    const filter = {
      doctorId,
      date: {
        $gte: dateObj,
        $lt: nextDay,
      },
      time,
      estado: {
        $nin: ['cancelada'],
      },
    };

    if (excludeCitaId) {
      filter._id = { $ne: excludeCitaId };
    }

    const conflictingCita = await Cita.findOne(filter);

    return conflictingCita;
  }

  /**
   * Get calendar view for doctor or consultorio
   */
  async getCalendar(doctorId = null, consultorioId = null, month = null, year = null) {
    const now = new Date();
    const targetMonth = month || now.getMonth() + 1;
    const targetYear = year || now.getFullYear();

    const startDate = new Date(targetYear, targetMonth - 1, 1);
    const endDate = new Date(targetYear, targetMonth, 0, 23, 59, 59);

    const filter = {
      date: {
        $gte: startDate,
        $lte: endDate,
      },
    };

    if (doctorId) filter.doctorId = doctorId;
    if (consultorioId) filter.consultorioId = consultorioId;

    const citas = await Cita.find(filter)
      .populate('pacienteId', 'id fullName phone')
      .populate('doctorId', 'id name')
      .sort({ date: 1, time: 1 })
      .lean();

    return citas.map((cita) => {
      const { _id, __v, pacienteId, doctorId, ...rest } = cita;
      const pacienteRef = pacienteId;
      const doctorRef = doctorId;
      return {
        ...rest,
        id: _id.toString(),
        pacienteId: pacienteRef?.id || pacienteRef?._id?.toString(),
        doctorId: doctorRef?.id || doctorRef?._id?.toString(),
        paciente: pacienteRef,
        doctor: doctorRef,
      };
    });
  }
}

export default new CitaService();

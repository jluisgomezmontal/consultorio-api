import { Cita, Paciente, User, Consultorio, Pago } from '../models/index.js';
import { NotFoundError, ConflictError, BadRequestError } from '../utils/errors.js';

// Helper to parse a YYYY-MM-DD string as a local date (avoids UTC shifting one day back)
function parseLocalDate(dateInput) {
  if (!dateInput) return null;

  if (dateInput instanceof Date) {
    return new Date(
      dateInput.getFullYear(),
      dateInput.getMonth(),
      dateInput.getDate(),
      0,
      0,
      0,
      0
    );
  }

  if (typeof dateInput === 'string') {
    // If it already includes time, let JS handle it normally
    if (dateInput.includes('T')) {
      return new Date(dateInput);
    }

    const [year, month, day] = dateInput.split('-').map((part) => Number(part));
    if (!year || !month || !day) {
      return new Date(dateInput);
    }

    return new Date(year, month - 1, day, 0, 0, 0, 0);
  }

  return new Date(dateInput);
}

class CitaService {
  /**
   * Get all citas with filters and pagination
   * @param {Object} filters - Filter options
   * @param {Number} page - Page number
   * @param {Number} limit - Items per page
   * @param {Object} consultorioFilter - MongoDB filter for consultorio restriction (from middleware)
   */
  async getAllCitas(filters = {}, page = 1, limit = 10, consultorioFilter = null) {
    const skip = (page - 1) * limit;

    const filter = {};

    // Apply consultorio filter if provided (for non-admin users)
    if (consultorioFilter) {
      Object.assign(filter, consultorioFilter);
    }

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
        const fromInput = filters.dateFrom.includes('T')
          ? filters.dateFrom
          : `${filters.dateFrom}T00:00:00`;
        const fromDate = new Date(fromInput);
        fromDate.setHours(fromDate.getHours(), 0, 0, 0);
        filter.date.$gte = fromDate;
      }

      if (filters.dateTo) {
        const toInput = filters.dateTo.includes('T')
          ? filters.dateTo
          : `${filters.dateTo}T23:59:59`;
        const toDate = new Date(toInput);
        toDate.setHours(toDate.getHours(), 59, 59, 999);
        filter.date.$lte = toDate;
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
   * @param {String} id - Cita ID
   * @param {Object} consultorioFilter - MongoDB filter for consultorio restriction (from middleware)
   */
  async getCitaById(id, consultorioFilter = null) {
    const filter = { _id: id };
    
    // Apply consultorio filter if provided (for non-admin users)
    if (consultorioFilter) {
      Object.assign(filter, consultorioFilter);
    }

    const cita = await Cita.findOne(filter)
      .populate('pacienteId')
      .populate('doctorId', 'id name email role')
      .populate('consultorioId')
      .lean();

    if (!cita) {
      throw new NotFoundError('Cita not found or access denied');
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

    // Transform paciente to include id field
    const pacienteTransformed = pacienteRef ? {
      ...pacienteRef,
      id: pacienteRef._id?.toString() || pacienteRef.id,
    } : null;

    // Transform doctor to include id field
    const doctorTransformed = doctorRef ? {
      ...doctorRef,
      id: doctorRef._id?.toString() || doctorRef.id,
    } : null;

    // Transform consultorio to include id field
    const consultorioTransformed = consultorioRef ? {
      ...consultorioRef,
      id: consultorioRef._id?.toString() || consultorioRef.id,
    } : null;

    return {
      ...rest,
      id: _id.toString(),
      pacienteId: pacienteRef?._id?.toString() || pacienteRef?.id,
      doctorId: doctorRef?._id?.toString() || doctorRef?.id,
      consultorioId: consultorioRef?._id?.toString() || consultorioRef?.id,
      paciente: pacienteTransformed,
      doctor: doctorTransformed,
      consultorio: consultorioTransformed,
      pagos,
    };
  }

  /**
   * Create new cita with conflict validation
   * @param {Object} data - Cita data
   * @param {Object} user - Authenticated user (from req.user)
   */
  async createCita(data, user = null) {
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

    // Validate consultorio access for non-admin users
    if (user && user.role !== 'admin') {
      const userConsultorios = user.consultoriosIds || [];
      if (!userConsultorios.includes(data.consultorioId)) {
        throw new BadRequestError('You do not have access to create appointments in this consultorio');
      }
    }

    // Normalize date to local day and check for schedule conflicts
    const normalizedCreateDate = parseLocalDate(data.date);
    const conflictingCita = await this.checkScheduleConflict(
      data.doctorId,
      normalizedCreateDate,
      data.time
    );

    if (conflictingCita) {
      throw new ConflictError(
        `El doctor ya tiene una cita a las ${data.time} el ${normalizedCreateDate.toLocaleDateString('es-MX', { year: 'numeric', month: 'long', day: 'numeric' })}`
      );
    }

    // Create cita
    const cita = await Cita.create({
      ...data,
      date: normalizedCreateDate,
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
   * @param {String} id - Cita ID
   * @param {Object} data - Update data
   * @param {Object} consultorioFilter - MongoDB filter for consultorio restriction (from middleware)
   * @param {Object} user - Authenticated user (from req.user)
   */
  async updateCita(id, data, consultorioFilter = null, user = null) {
    const filter = { _id: id };
    
    // Apply consultorio filter if provided (for non-admin users)
    if (consultorioFilter) {
      Object.assign(filter, consultorioFilter);
    }

    const cita = await Cita.findOne(filter);

    if (!cita) {
      throw new NotFoundError('Cita not found or access denied');
    }

    // Validate consultorio access if changing consultorio
    if (data.consultorioId && user && user.role !== 'admin') {
      const userConsultorios = user.consultoriosIds || [];
      if (!userConsultorios.includes(data.consultorioId)) {
        throw new BadRequestError('You do not have access to move appointments to this consultorio');
      }
    }

    // If updating date/time/doctor, check for conflicts
    if (data.date || data.time || data.doctorId) {
      const doctorId = data.doctorId || cita.doctorId;
      const date = data.date ? parseLocalDate(data.date) : cita.date;
      const time = data.time || cita.time;

      const conflictingCita = await this.checkScheduleConflict(
        doctorId,
        date,
        time,
        id // exclude current cita
      );

      if (conflictingCita) {
        throw new ConflictError(
          `El doctor ya tiene una cita a las ${time} el ${date.toLocaleDateString('es-MX', { year: 'numeric', month: 'long', day: 'numeric' })}`
        );
      }
    }

    // Update cita
    const updateData = { ...data };
    if (data.date) {
      updateData.date = parseLocalDate(data.date);
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
   * @param {String} id - Cita ID
   * @param {Object} consultorioFilter - MongoDB filter for consultorio restriction (from middleware)
   */
  async cancelCita(id, consultorioFilter = null) {
    const filter = { _id: id };
    
    // Apply consultorio filter if provided (for non-admin users)
    if (consultorioFilter) {
      Object.assign(filter, consultorioFilter);
    }

    const cita = await Cita.findOne(filter);

    if (!cita) {
      throw new NotFoundError('Cita not found or access denied');
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
   * @param {String} id - Cita ID
   * @param {Object} consultorioFilter - MongoDB filter for consultorio restriction (from middleware)
   */
  async deleteCita(id, consultorioFilter = null) {
    const filter = { _id: id };
    
    // Apply consultorio filter if provided (for non-admin users)
    if (consultorioFilter) {
      Object.assign(filter, consultorioFilter);
    }

    const cita = await Cita.findOne(filter);

    if (!cita) {
      throw new NotFoundError('Cita not found or access denied');
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
    const dateObj = parseLocalDate(date);
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

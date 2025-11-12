import prisma from '../config/database.js';
import { NotFoundError, ConflictError, BadRequestError } from '../utils/errors.js';

class CitaService {
  /**
   * Get all citas with filters and pagination
   */
  async getAllCitas(filters = {}, page = 1, limit = 10) {
    const skip = (page - 1) * limit;

    const where = {};

    if (filters.doctorId) where.doctorId = filters.doctorId;
    if (filters.pacienteId) where.pacienteId = filters.pacienteId;
    if (filters.consultorioId) where.consultorioId = filters.consultorioId;
    if (filters.estado) where.estado = filters.estado;

    if (filters.dateFrom || filters.dateTo) {
      where.date = {};
      if (filters.dateFrom) where.date.gte = new Date(filters.dateFrom);
      if (filters.dateTo) where.date.lte = new Date(filters.dateTo);
    }

    const [citas, total] = await Promise.all([
      prisma.cita.findMany({
        where,
        skip,
        take: limit,
        include: {
          paciente: {
            select: {
              id: true,
              fullName: true,
              phone: true,
              email: true,
            },
          },
          doctor: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          consultorio: {
            select: {
              id: true,
              name: true,
            },
          },
          pagos: true,
        },
        orderBy: [
          { date: 'asc' },
          { time: 'asc' },
        ],
      }),
      prisma.cita.count({ where }),
    ]);

    return { citas, total, page, limit };
  }

  /**
   * Get cita by ID
   */
  async getCitaById(id) {
    const cita = await prisma.cita.findUnique({
      where: { id },
      include: {
        paciente: true,
        doctor: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
        consultorio: true,
        pagos: true,
      },
    });

    if (!cita) {
      throw new NotFoundError('Cita not found');
    }

    return cita;
  }

  /**
   * Create new cita with conflict validation
   */
  async createCita(data) {
    // Validate paciente exists
    const paciente = await prisma.paciente.findUnique({
      where: { id: data.pacienteId },
    });
    if (!paciente) {
      throw new NotFoundError('Paciente not found');
    }

    // Validate doctor exists and is a doctor
    const doctor = await prisma.user.findUnique({
      where: { id: data.doctorId },
    });
    if (!doctor) {
      throw new NotFoundError('Doctor not found');
    }
    if (doctor.role !== 'doctor') {
      throw new BadRequestError('Selected user is not a doctor');
    }

    // Validate consultorio exists
    const consultorio = await prisma.consultorio.findUnique({
      where: { id: data.consultorioId },
    });
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
    const cita = await prisma.cita.create({
      data: {
        ...data,
        date: new Date(data.date),
      },
      include: {
        paciente: true,
        doctor: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        consultorio: true,
      },
    });

    return cita;
  }

  /**
   * Update cita
   */
  async updateCita(id, data) {
    const cita = await prisma.cita.findUnique({
      where: { id },
    });

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
    const updatedCita = await prisma.cita.update({
      where: { id },
      data: {
        ...data,
        date: data.date ? new Date(data.date) : undefined,
      },
      include: {
        paciente: true,
        doctor: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        consultorio: true,
        pagos: true,
      },
    });

    return updatedCita;
  }

  /**
   * Cancel cita
   */
  async cancelCita(id) {
    const cita = await prisma.cita.findUnique({
      where: { id },
    });

    if (!cita) {
      throw new NotFoundError('Cita not found');
    }

    const updatedCita = await prisma.cita.update({
      where: { id },
      data: { estado: 'cancelada' },
      include: {
        paciente: true,
        doctor: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        consultorio: true,
      },
    });

    return updatedCita;
  }

  /**
   * Delete cita
   */
  async deleteCita(id) {
    const cita = await prisma.cita.findUnique({
      where: { id },
    });

    if (!cita) {
      throw new NotFoundError('Cita not found');
    }

    await prisma.cita.delete({
      where: { id },
    });

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

    const where = {
      doctorId,
      date: {
        gte: dateObj,
        lt: nextDay,
      },
      time,
      estado: {
        notIn: ['cancelada'],
      },
    };

    if (excludeCitaId) {
      where.id = { not: excludeCitaId };
    }

    const conflictingCita = await prisma.cita.findFirst({
      where,
    });

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

    const where = {
      date: {
        gte: startDate,
        lte: endDate,
      },
    };

    if (doctorId) where.doctorId = doctorId;
    if (consultorioId) where.consultorioId = consultorioId;

    const citas = await prisma.cita.findMany({
      where,
      include: {
        paciente: {
          select: {
            id: true,
            fullName: true,
            phone: true,
          },
        },
        doctor: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: [
        { date: 'asc' },
        { time: 'asc' },
      ],
    });

    return citas;
  }
}

export default new CitaService();

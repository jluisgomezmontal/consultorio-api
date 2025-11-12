import prisma from '../config/database.js';
import { NotFoundError } from '../utils/errors.js';

class ConsultorioService {
  /**
   * Get all consultorios
   */
  async getAllConsultorios(page = 1, limit = 10) {
    const skip = (page - 1) * limit;

    const [consultorios, total] = await Promise.all([
      prisma.consultorio.findMany({
        skip,
        take: limit,
        include: {
          _count: {
            select: {
              users: true,
              citas: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      }),
      prisma.consultorio.count(),
    ]);

    return { consultorios, total, page, limit };
  }

  /**
   * Get consultorio by ID
   */
  async getConsultorioById(id) {
    const consultorio = await prisma.consultorio.findUnique({
      where: { id },
      include: {
        users: true,
        _count: {
          select: {
            citas: true,
          },
        },
      },
    });

    if (!consultorio) {
      throw new NotFoundError('Consultorio not found');
    }

    return consultorio;
  }

  /**
   * Create new consultorio
   */
  async createConsultorio(data) {
    const consultorio = await prisma.consultorio.create({
      data,
    });

    return consultorio;
  }

  /**
   * Update consultorio
   */
  async updateConsultorio(id, data) {
    const consultorio = await prisma.consultorio.findUnique({
      where: { id },
    });

    if (!consultorio) {
      throw new NotFoundError('Consultorio not found');
    }

    const updatedConsultorio = await prisma.consultorio.update({
      where: { id },
      data,
    });

    return updatedConsultorio;
  }

  /**
   * Delete consultorio
   */
  async deleteConsultorio(id) {
    const consultorio = await prisma.consultorio.findUnique({
      where: { id },
    });

    if (!consultorio) {
      throw new NotFoundError('Consultorio not found');
    }

    await prisma.consultorio.delete({
      where: { id },
    });

    return { message: 'Consultorio deleted successfully' };
  }

  /**
   * Get consultorio summary with statistics
   */
  async getConsultorioSummary(id) {
    const consultorio = await prisma.consultorio.findUnique({
      where: { id },
      include: {
        users: true,
      },
    });

    if (!consultorio) {
      throw new NotFoundError('Consultorio not found');
    }

    // Get citas statistics
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [
      totalCitas,
      citasHoy,
      citasPendientes,
      totalPacientes,
      totalIngresos,
    ] = await Promise.all([
      prisma.cita.count({
        where: { consultorioId: id },
      }),
      prisma.cita.count({
        where: {
          consultorioId: id,
          date: {
            gte: today,
          },
        },
      }),
      prisma.cita.count({
        where: {
          consultorioId: id,
          estado: 'pendiente',
        },
      }),
      prisma.cita.findMany({
        where: { consultorioId: id },
        distinct: ['pacienteId'],
      }).then((citas) => citas.length),
      prisma.pago.aggregate({
        where: {
          cita: {
            consultorioId: id,
          },
          estatus: 'pagado',
        },
        _sum: {
          monto: true,
        },
      }),
    ]);

    return {
      consultorio,
      statistics: {
        totalCitas,
        citasHoy,
        citasPendientes,
        totalPacientes,
        totalIngresos: totalIngresos._sum.monto || 0,
        totalDoctors: consultorio.users.filter((u) => u.role === 'doctor').length,
        totalStaff: consultorio.users.length,
      },
    };
  }
}

export default new ConsultorioService();

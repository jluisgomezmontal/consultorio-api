import prisma from '../config/database.js';
import { NotFoundError } from '../utils/errors.js';

class PagoService {
  /**
   * Get all pagos with filters and pagination
   */
  async getAllPagos(filters = {}, page = 1, limit = 10) {
    const skip = (page - 1) * limit;

    const where = {};

    if (filters.citaId) where.citaId = filters.citaId;
    if (filters.estatus) where.estatus = filters.estatus;

    if (filters.dateFrom || filters.dateTo) {
      where.fechaPago = {};
      if (filters.dateFrom) where.fechaPago.gte = new Date(filters.dateFrom);
      if (filters.dateTo) where.fechaPago.lte = new Date(filters.dateTo);
    }

    const [pagos, total] = await Promise.all([
      prisma.pago.findMany({
        where,
        skip,
        take: limit,
        include: {
          cita: {
            include: {
              paciente: {
                select: {
                  id: true,
                  fullName: true,
                },
              },
              doctor: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },
        },
        orderBy: {
          fechaPago: 'desc',
        },
      }),
      prisma.pago.count({ where }),
    ]);

    return { pagos, total, page, limit };
  }

  /**
   * Get pago by ID
   */
  async getPagoById(id) {
    const pago = await prisma.pago.findUnique({
      where: { id },
      include: {
        cita: {
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
        },
      },
    });

    if (!pago) {
      throw new NotFoundError('Pago not found');
    }

    return pago;
  }

  /**
   * Create new pago
   */
  async createPago(data) {
    // Validate cita exists
    const cita = await prisma.cita.findUnique({
      where: { id: data.citaId },
    });

    if (!cita) {
      throw new NotFoundError('Cita not found');
    }

    const pago = await prisma.pago.create({
      data: {
        ...data,
        fechaPago: data.fechaPago ? new Date(data.fechaPago) : new Date(),
      },
      include: {
        cita: {
          include: {
            paciente: {
              select: {
                id: true,
                fullName: true,
              },
            },
            doctor: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
    });

    return pago;
  }

  /**
   * Update pago
   */
  async updatePago(id, data) {
    const pago = await prisma.pago.findUnique({
      where: { id },
    });

    if (!pago) {
      throw new NotFoundError('Pago not found');
    }

    const updatedPago = await prisma.pago.update({
      where: { id },
      data: {
        ...data,
        fechaPago: data.fechaPago ? new Date(data.fechaPago) : undefined,
      },
      include: {
        cita: {
          include: {
            paciente: {
              select: {
                id: true,
                fullName: true,
              },
            },
            doctor: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
    });

    return updatedPago;
  }

  /**
   * Delete pago
   */
  async deletePago(id) {
    const pago = await prisma.pago.findUnique({
      where: { id },
    });

    if (!pago) {
      throw new NotFoundError('Pago not found');
    }

    await prisma.pago.delete({
      where: { id },
    });

    return { message: 'Pago deleted successfully' };
  }

  /**
   * Get income report by date range
   */
  async getIncomeReport(dateFrom, dateTo, doctorId = null, consultorioId = null) {
    const where = {
      estatus: 'pagado',
    };

    if (dateFrom || dateTo) {
      where.fechaPago = {};
      if (dateFrom) where.fechaPago.gte = new Date(dateFrom);
      if (dateTo) where.fechaPago.lte = new Date(dateTo);
    }

    if (doctorId || consultorioId) {
      where.cita = {};
      if (doctorId) where.cita.doctorId = doctorId;
      if (consultorioId) where.cita.consultorioId = consultorioId;
    }

    const [totalIngresos, pagosPorMetodo, pagosDetalle] = await Promise.all([
      prisma.pago.aggregate({
        where,
        _sum: {
          monto: true,
        },
        _count: true,
      }),
      prisma.pago.groupBy({
        by: ['metodo'],
        where,
        _sum: {
          monto: true,
        },
        _count: true,
      }),
      prisma.pago.findMany({
        where,
        include: {
          cita: {
            include: {
              paciente: {
                select: {
                  id: true,
                  fullName: true,
                },
              },
              doctor: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },
        },
        orderBy: {
          fechaPago: 'desc',
        },
      }),
    ]);

    return {
      totalIngresos: totalIngresos._sum.monto || 0,
      totalPagos: totalIngresos._count,
      pagosPorMetodo,
      pagosDetalle,
    };
  }

  /**
   * Get pagos by cita
   */
  async getPagosByCita(citaId) {
    const pagos = await prisma.pago.findMany({
      where: { citaId },
      orderBy: {
        fechaPago: 'desc',
      },
    });

    return pagos;
  }
}

export default new PagoService();

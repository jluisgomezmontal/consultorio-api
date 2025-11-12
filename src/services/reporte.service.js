import prisma from '../config/database.js';

class ReporteService {
  /**
   * Get citas statistics
   */
  async getCitasReport(dateFrom, dateTo, consultorioId = null) {
    const where = {};

    if (dateFrom || dateTo) {
      where.date = {};
      if (dateFrom) where.date.gte = new Date(dateFrom);
      if (dateTo) where.date.lte = new Date(dateTo);
    }

    if (consultorioId) {
      where.consultorioId = consultorioId;
    }

    const [
      totalCitas,
      citasPorEstado,
      citasPorDoctor,
      citasPorMes,
    ] = await Promise.all([
      prisma.cita.count({ where }),
      prisma.cita.groupBy({
        by: ['estado'],
        where,
        _count: true,
      }),
      prisma.cita.groupBy({
        by: ['doctorId'],
        where,
        _count: true,
      }),
      prisma.$queryRaw`
        SELECT 
          TO_CHAR(date, 'YYYY-MM') as mes,
          COUNT(*)::int as total
        FROM citas
        ${consultorioId ? prisma.$queryRaw`WHERE consultorio_id = ${consultorioId}` : prisma.$queryRaw``}
        GROUP BY TO_CHAR(date, 'YYYY-MM')
        ORDER BY mes DESC
        LIMIT 12
      `,
    ]);

    // Get doctor names for citasPorDoctor
    const doctorIds = citasPorDoctor.map((item) => item.doctorId);
    const doctors = await prisma.user.findMany({
      where: { id: { in: doctorIds } },
      select: { id: true, name: true },
    });

    const citasPorDoctorConNombre = citasPorDoctor.map((item) => {
      const doctor = doctors.find((d) => d.id === item.doctorId);
      return {
        doctorId: item.doctorId,
        doctorName: doctor?.name || 'Unknown',
        total: item._count,
      };
    });

    return {
      totalCitas,
      citasPorEstado: citasPorEstado.map((item) => ({
        estado: item.estado,
        total: item._count,
      })),
      citasPorDoctor: citasPorDoctorConNombre,
      citasPorMes,
    };
  }

  /**
   * Get income report
   */
  async getIngresosReport(dateFrom, dateTo, consultorioId = null, doctorId = null) {
    const where = {
      estatus: 'pagado',
    };

    if (dateFrom || dateTo) {
      where.fechaPago = {};
      if (dateFrom) where.fechaPago.gte = new Date(dateFrom);
      if (dateTo) where.fechaPago.lte = new Date(dateTo);
    }

    if (consultorioId || doctorId) {
      where.cita = {};
      if (consultorioId) where.cita.consultorioId = consultorioId;
      if (doctorId) where.cita.doctorId = doctorId;
    }

    const [
      totalIngresos,
      pagosPorMetodo,
      ingresosPorDoctor,
    ] = await Promise.all([
      prisma.pago.aggregate({
        where,
        _sum: { monto: true },
        _count: true,
      }),
      prisma.pago.groupBy({
        by: ['metodo'],
        where,
        _sum: { monto: true },
        _count: true,
      }),
      prisma.$queryRaw`
        SELECT 
          u.id,
          u.name as doctor_name,
          COUNT(p.id)::int as total_pagos,
          SUM(p.monto)::float as total_ingresos
        FROM pagos p
        INNER JOIN citas c ON p.cita_id = c.id
        INNER JOIN users u ON c.doctor_id = u.id
        WHERE p.estatus = 'pagado'
        ${dateFrom ? prisma.$queryRaw`AND p.fecha_pago >= ${dateFrom}` : prisma.$queryRaw``}
        ${dateTo ? prisma.$queryRaw`AND p.fecha_pago <= ${dateTo}` : prisma.$queryRaw``}
        ${consultorioId ? prisma.$queryRaw`AND c.consultorio_id = ${consultorioId}` : prisma.$queryRaw``}
        GROUP BY u.id, u.name
        ORDER BY total_ingresos DESC
      `,
    ]);

    return {
      totalIngresos: totalIngresos._sum.monto || 0,
      totalPagos: totalIngresos._count,
      pagosPorMetodo: pagosPorMetodo.map((item) => ({
        metodo: item.metodo,
        total: item._sum.monto || 0,
        cantidad: item._count,
      })),
      ingresosPorDoctor,
    };
  }

  /**
   * Get pacientes statistics
   */
  async getPacientesReport(consultorioId = null) {
    const now = new Date();
    const thirtyDaysAgo = new Date(now);
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const where = consultorioId ? { consultorioId } : {};

    const [
      totalPacientes,
      nuevoPacientes,
      pacientesRecurrentes,
      pacientesPorGenero,
    ] = await Promise.all([
      prisma.paciente.count(),
      prisma.paciente.count({
        where: {
          createdAt: {
            gte: thirtyDaysAgo,
          },
        },
      }),
      prisma.$queryRaw`
        SELECT COUNT(DISTINCT paciente_id)::int as total
        FROM citas
        WHERE paciente_id IN (
          SELECT paciente_id
          FROM citas
          GROUP BY paciente_id
          HAVING COUNT(*) > 1
        )
        ${consultorioId ? prisma.$queryRaw`AND consultorio_id = ${consultorioId}` : prisma.$queryRaw``}
      `,
      prisma.paciente.groupBy({
        by: ['gender'],
        _count: true,
      }),
    ]);

    return {
      totalPacientes,
      nuevosPacientes: nuevoPacientes,
      pacientesRecurrentes: pacientesRecurrentes[0]?.total || 0,
      pacientesPorGenero: pacientesPorGenero.map((item) => ({
        genero: item.gender || 'No especificado',
        total: item._count,
      })),
    };
  }

  /**
   * Get dashboard summary
   */
  async getDashboardSummary(consultorioId = null) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const where = consultorioId ? { consultorioId } : {};

    const [
      citasHoy,
      citasPendientes,
      totalPacientes,
      ingresosHoy,
    ] = await Promise.all([
      prisma.cita.count({
        where: {
          ...where,
          date: {
            gte: today,
            lt: tomorrow,
          },
        },
      }),
      prisma.cita.count({
        where: {
          ...where,
          estado: 'pendiente',
        },
      }),
      prisma.paciente.count(),
      prisma.pago.aggregate({
        where: {
          estatus: 'pagado',
          fechaPago: {
            gte: today,
            lt: tomorrow,
          },
          ...(consultorioId && {
            cita: {
              consultorioId,
            },
          }),
        },
        _sum: {
          monto: true,
        },
      }),
    ]);

    return {
      citasHoy,
      citasPendientes,
      totalPacientes,
      ingresosHoy: ingresosHoy._sum.monto || 0,
    };
  }
}

export default new ReporteService();

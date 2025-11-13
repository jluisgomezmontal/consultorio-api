import { Cita, Pago, Paciente, User } from '../models/index.js';

class ReporteService {
  /**
   * Get citas statistics
   */
  async getCitasReport(dateFrom, dateTo, consultorioId = null) {
    const filter = {};

    if (dateFrom || dateTo) {
      filter.date = {};
      if (dateFrom) filter.date.$gte = new Date(dateFrom);
      if (dateTo) filter.date.$lte = new Date(dateTo);
    }

    if (consultorioId) {
      filter.consultorioId = consultorioId;
    }

    const [
      totalCitas,
      citasPorEstado,
      citasPorDoctor,
      citasPorMes,
    ] = await Promise.all([
      Cita.countDocuments(filter),
      Cita.aggregate([
        { $match: filter },
        {
          $group: {
            _id: '$estado',
            count: { $sum: 1 },
          },
        },
      ]),
      Cita.aggregate([
        { $match: filter },
        {
          $group: {
            _id: '$doctorId',
            count: { $sum: 1 },
          },
        },
      ]),
      Cita.aggregate([
        { $match: consultorioId ? { consultorioId } : {} },
        {
          $group: {
            _id: {
              $dateToString: { format: '%Y-%m', date: '$date' },
            },
            total: { $sum: 1 },
          },
        },
        { $sort: { _id: -1 } },
        { $limit: 12 },
        {
          $project: {
            mes: '$_id',
            total: 1,
            _id: 0,
          },
        },
      ]),
    ]);

    // Get doctor names for citasPorDoctor
    const doctorIds = citasPorDoctor.map((item) => item._id);
    const doctors = await User.find({ _id: { $in: doctorIds } })
      .select('_id name')
      .lean();

    const citasPorDoctorConNombre = citasPorDoctor.map((item) => {
      const doctor = doctors.find((d) => d._id.toString() === item._id.toString());
      return {
        doctorId: item._id,
        doctorName: doctor?.name || 'Unknown',
        total: item.count,
      };
    });

    return {
      totalCitas,
      citasPorEstado: citasPorEstado.map((item) => ({
        estado: item._id,
        total: item.count,
      })),
      citasPorDoctor: citasPorDoctorConNombre,
      citasPorMes,
    };
  }

  /**
   * Get income report
   */
  async getIngresosReport(dateFrom, dateTo, consultorioId = null, doctorId = null) {
    // Get citas matching criteria
    const citaFilter = {};
    if (consultorioId) citaFilter.consultorioId = consultorioId;
    if (doctorId) citaFilter.doctorId = doctorId;

    const matchingCitas = await Cita.find(citaFilter).select('_id doctorId').lean();
    const citaIds = matchingCitas.map((c) => c._id);

    // Build pago filter
    const pagoFilter = {
      estatus: 'pagado',
      citaId: { $in: citaIds },
    };

    if (dateFrom || dateTo) {
      pagoFilter.fechaPago = {};
      if (dateFrom) pagoFilter.fechaPago.$gte = new Date(dateFrom);
      if (dateTo) pagoFilter.fechaPago.$lte = new Date(dateTo);
    }

    const [
      totalIngresosResult,
      pagosPorMetodo,
      ingresosPorDoctorResult,
    ] = await Promise.all([
      Pago.aggregate([
        { $match: pagoFilter },
        {
          $group: {
            _id: null,
            total: { $sum: '$monto' },
            count: { $sum: 1 },
          },
        },
      ]),
      Pago.aggregate([
        { $match: pagoFilter },
        {
          $group: {
            _id: '$metodo',
            total: { $sum: '$monto' },
            cantidad: { $sum: 1 },
          },
        },
      ]),
      Pago.aggregate([
        { $match: pagoFilter },
        {
          $lookup: {
            from: 'citas',
            localField: 'citaId',
            foreignField: '_id',
            as: 'cita',
          },
        },
        { $unwind: '$cita' },
        {
          $group: {
            _id: '$cita.doctorId',
            total_pagos: { $sum: 1 },
            total_ingresos: { $sum: '$monto' },
          },
        },
        { $sort: { total_ingresos: -1 } },
      ]),
    ]);

    // Get doctor names
    const doctorIds = ingresosPorDoctorResult.map((item) => item._id);
    const doctors = await User.find({ _id: { $in: doctorIds } })
      .select('_id name')
      .lean();

    const ingresosPorDoctor = ingresosPorDoctorResult.map((item) => {
      const doctor = doctors.find((d) => d._id.toString() === item._id.toString());
      return {
        id: item._id,
        doctor_name: doctor?.name || 'Unknown',
        total_pagos: item.total_pagos,
        total_ingresos: item.total_ingresos,
      };
    });

    return {
      totalIngresos: totalIngresosResult[0]?.total || 0,
      totalPagos: totalIngresosResult[0]?.count || 0,
      pagosPorMetodo: pagosPorMetodo.map((item) => ({
        metodo: item._id,
        total: item.total || 0,
        cantidad: item.cantidad,
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

    const citaFilter = consultorioId ? { consultorioId } : {};

    const [
      totalPacientes,
      nuevoPacientes,
      pacientesRecurrentesResult,
      pacientesPorGenero,
    ] = await Promise.all([
      Paciente.countDocuments(),
      Paciente.countDocuments({
        createdAt: { $gte: thirtyDaysAgo },
      }),
      Cita.aggregate([
        { $match: citaFilter },
        {
          $group: {
            _id: '$pacienteId',
            count: { $sum: 1 },
          },
        },
        {
          $match: {
            count: { $gt: 1 },
          },
        },
        {
          $count: 'total',
        },
      ]),
      Paciente.aggregate([
        {
          $group: {
            _id: '$gender',
            count: { $sum: 1 },
          },
        },
      ]),
    ]);

    return {
      totalPacientes,
      nuevosPacientes: nuevoPacientes,
      pacientesRecurrentes: pacientesRecurrentesResult[0]?.total || 0,
      pacientesPorGenero: pacientesPorGenero.map((item) => ({
        genero: item._id || 'No especificado',
        total: item.count,
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

    const filter = consultorioId ? { consultorioId } : {};

    const [
      citasHoy,
      citasPendientes,
      totalPacientes,
      citasForIngresos,
    ] = await Promise.all([
      Cita.countDocuments({
        ...filter,
        date: {
          $gte: today,
          $lt: tomorrow,
        },
      }),
      Cita.countDocuments({
        ...filter,
        estado: 'pendiente',
      }),
      Paciente.countDocuments(),
      Cita.find(consultorioId ? { consultorioId } : {}).select('_id').lean(),
    ]);

    // Get ingresos for today
    const citaIds = citasForIngresos.map((c) => c._id);
    const ingresosResult = await Pago.aggregate([
      {
        $match: {
          estatus: 'pagado',
          fechaPago: {
            $gte: today,
            $lt: tomorrow,
          },
          citaId: { $in: citaIds },
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
      citasHoy,
      citasPendientes,
      totalPacientes,
      ingresosHoy: ingresosResult[0]?.total || 0,
    };
  }
}

export default new ReporteService();

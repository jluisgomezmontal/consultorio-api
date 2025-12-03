import { Pago, Cita, Paciente, User } from '../models/index.js';
import { NotFoundError } from '../utils/errors.js';

class PagoService {
  /**
   * Get all pagos with filters and pagination
   * @param {Object} filters - Filter options
   * @param {Number} page - Page number
   * @param {Number} limit - Items per page
   * @param {Object} consultorioFilter - MongoDB filter for consultorio restriction (from middleware)
   */
  async getAllPagos(filters = {}, page = 1, limit = 10, consultorioFilter = null) {
    const skip = (page - 1) * limit;

    const filter = {};

    // Apply consultorio filter if provided (for non-admin users)
    if (consultorioFilter) {
      Object.assign(filter, consultorioFilter);
    }

    if (filters.citaId) filter.citaId = filters.citaId;
    if (filters.estatus) filter.estatus = filters.estatus;

    if (filters.dateFrom || filters.dateTo) {
      filter.fechaPago = {};

      if (filters.dateFrom) {
        const fromInput = filters.dateFrom.includes('T')
          ? filters.dateFrom
          : `${filters.dateFrom}T00:00:00`;
        const fromDate = new Date(fromInput);
        fromDate.setHours(fromDate.getHours(), 0, 0, 0);
        filter.fechaPago.$gte = fromDate;
      }

      if (filters.dateTo) {
        const toInput = filters.dateTo.includes('T')
          ? filters.dateTo
          : `${filters.dateTo}T23:59:59`;
        const toDate = new Date(toInput);
        toDate.setHours(toDate.getHours(), 59, 59, 999);
        filter.fechaPago.$lte = toDate;
      }
    }

    const [pagos, total] = await Promise.all([
      Pago.find(filter)
        .skip(skip)
        .limit(limit)
        .populate({
          path: 'citaId',
          populate: [
            { path: 'pacienteId', select: 'id fullName' },
            { path: 'doctorId', select: 'id name' },
          ],
        })
        .sort({ fechaPago: -1 })
        .lean(),
      Pago.countDocuments(filter),
    ]);

    // Transform citaId to cita for compatibility
    const transformedPagos = pagos.map((pago) => {
      const { _id, __v, citaId, ...rest } = pago;
      const cita = citaId
        ? {
            ...citaId,
            id: citaId._id?.toString() ?? citaId.id,
            paciente: citaId.pacienteId,
            doctor: citaId.doctorId,
          }
        : null;

      return {
        ...rest,
        id: _id.toString(),
        citaId: cita?.id,
        cita,
      };
    });

    return { pagos: transformedPagos, total, page, limit };
  }

  /**
   * Get pago by ID
   * @param {String} id - Pago ID
   * @param {Object} consultorioFilter - MongoDB filter for consultorio restriction (from middleware)
   */
  async getPagoById(id, consultorioFilter = null) {
    const filter = { _id: id };
    
    // Apply consultorio filter if provided (for non-admin users)
    if (consultorioFilter) {
      Object.assign(filter, consultorioFilter);
    }

    const pago = await Pago.findOne(filter)
      .populate({
        path: 'citaId',
        populate: [
          { path: 'pacienteId' },
          { path: 'doctorId', select: 'id name email' },
          { path: 'consultorioId' },
        ],
      })
      .lean();

    if (!pago) {
      throw new NotFoundError('Pago not found or access denied');
    }

    // Transform citaId to cita for compatibility
    const { _id, __v, citaId, ...rest } = pago;
    const cita = citaId
      ? {
          ...citaId,
          id: citaId._id?.toString() ?? citaId.id,
          paciente: citaId.pacienteId,
          doctor: citaId.doctorId,
          consultorio: citaId.consultorioId,
        }
      : null;

    return {
      ...rest,
      id: _id.toString(),
      citaId: cita?.id,
      cita,
    };
  }

  /**
   * Create new pago
   * @param {Object} data - Pago data
   */
  async createPago(data) {
    // Validate cita exists and get consultorioId from it
    const citaExists = await Cita.findById(data.citaId);

    if (!citaExists) {
      throw new NotFoundError('Cita not found');
    }

    const pago = await Pago.create({
      ...data,
      consultorioId: citaExists.consultorioId, // Auto-assign from cita
      fechaPago: data.fechaPago ? new Date(data.fechaPago) : new Date(),
    });

    const populatedPago = await Pago.findById(pago._id)
      .populate({
        path: 'citaId',
        populate: [
          { path: 'pacienteId', select: 'id fullName' },
          { path: 'doctorId', select: 'id name' },
        ],
      })
      .lean();

    // Transform citaId to cita for compatibility
    const { _id, __v, citaId, ...rest } = populatedPago;
    const citaRef = citaId
      ? {
          ...citaId,
          id: citaId._id?.toString() ?? citaId.id,
          paciente: citaId.pacienteId,
          doctor: citaId.doctorId,
        }
      : null;

    return {
      ...rest,
      id: _id.toString(),
      citaId: citaRef?.id,
      cita: citaRef,
    };
  }

  /**
   * Update pago
   * @param {String} id - Pago ID
   * @param {Object} data - Update data
   * @param {Object} consultorioFilter - MongoDB filter for consultorio restriction (from middleware)
   */
  async updatePago(id, data, consultorioFilter = null) {
    const filter = { _id: id };
    
    // Apply consultorio filter if provided (for non-admin users)
    if (consultorioFilter) {
      Object.assign(filter, consultorioFilter);
    }

    const updateData = { ...data };
    if (data.fechaPago) {
      updateData.fechaPago = new Date(data.fechaPago);
    }

    const updatedPago = await Pago.findOneAndUpdate(filter, updateData, {
      new: true,
      runValidators: true,
    })
      .populate({
        path: 'citaId',
        populate: [
          { path: 'pacienteId', select: 'id fullName' },
          { path: 'doctorId', select: 'id name' },
        ],
      })
      .lean();

    if (!updatedPago) {
      throw new NotFoundError('Pago not found or access denied');
    }

    // Transform citaId to cita for compatibility
    const { _id, __v, citaId, ...rest } = updatedPago;
    const citaRef = citaId
      ? {
          ...citaId,
          id: citaId._id?.toString() ?? citaId.id,
          paciente: citaId.pacienteId,
          doctor: citaId.doctorId,
        }
      : null;

    return {
      ...rest,
      id: _id.toString(),
      citaId: citaRef?.id,
      cita: citaRef,
    };
  }

  /**
   * Delete pago
   * @param {String} id - Pago ID
   * @param {Object} consultorioFilter - MongoDB filter for consultorio restriction (from middleware)
   */
  async deletePago(id, consultorioFilter = null) {
    const filter = { _id: id };
    
    // Apply consultorio filter if provided (for non-admin users)
    if (consultorioFilter) {
      Object.assign(filter, consultorioFilter);
    }

    const pago = await Pago.findOneAndDelete(filter);

    if (!pago) {
      throw new NotFoundError('Pago not found or access denied');
    }

    return { message: 'Pago deleted successfully' };
  }

  /**
   * Get income report by date range
   */
  async getIncomeReport(dateFrom, dateTo, doctorId = null, consultorioId = null) {
    // First get citas that match the filters
    const citaFilter = {};
    if (doctorId) citaFilter.doctorId = doctorId;
    if (consultorioId) citaFilter.consultorioId = consultorioId;

    const citaIds = await Cita.find(citaFilter).select('_id').lean();
    const citaIdsList = citaIds.map((c) => c._id);

    // Build pago filter
    const pagoFilter = {
      estatus: 'pagado',
      citaId: { $in: citaIdsList },
    };

    if (dateFrom || dateTo) {
      pagoFilter.fechaPago = {};
      if (dateFrom) pagoFilter.fechaPago.$gte = new Date(dateFrom);
      if (dateTo) pagoFilter.fechaPago.$lte = new Date(dateTo);
    }

    const [totalIngresosResult, pagosPorMetodoResult, pagosDetalle] = await Promise.all([
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
            _sum: { monto: { $sum: '$monto' } },
            _count: { $sum: 1 },
          },
        },
      ]),
      Pago.find(pagoFilter)
        .populate({
          path: 'citaId',
          populate: [
            { path: 'pacienteId', select: 'id fullName' },
            { path: 'doctorId', select: 'id name' },
          ],
        })
        .sort({ fechaPago: -1 })
        .lean(),
    ]);

    // Transform pagos for compatibility
    const transformedPagos = pagosDetalle.map((pago) => ({
      ...pago,
      cita: pago.citaId
        ? {
            ...pago.citaId,
            paciente: pago.citaId.pacienteId,
            doctor: pago.citaId.doctorId,
          }
        : null,
    }));

    // Transform pagosPorMetodo for compatibility
    const pagosPorMetodo = pagosPorMetodoResult.map((item) => ({
      metodo: item._id,
      _sum: { monto: item._sum.monto },
      _count: item._count,
    }));

    return {
      totalIngresos: totalIngresosResult[0]?.total || 0,
      totalPagos: totalIngresosResult[0]?.count || 0,
      pagosPorMetodo,
      pagosDetalle: transformedPagos,
    };
  }

  /**
   * Get pagos by cita
   */
  async getPagosByCita(citaId) {
    const pagos = await Pago.find({ citaId }).sort({ fechaPago: -1 }).lean();
    return pagos;
  }
}

export default new PagoService();

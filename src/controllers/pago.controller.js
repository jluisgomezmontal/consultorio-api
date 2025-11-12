import pagoService from '../services/pago.service.js';
import { successResponse, createdResponse, paginatedResponse } from '../utils/response.js';

class PagoController {
  /**
   * Get all pagos
   */
  async getAllPagos(req, res, next) {
    try {
      const {
        page = 1,
        limit = 10,
        citaId,
        estatus,
        dateFrom,
        dateTo,
      } = req.query;

      const filters = {
        citaId,
        estatus,
        dateFrom,
        dateTo,
      };

      const result = await pagoService.getAllPagos(
        filters,
        parseInt(page),
        parseInt(limit)
      );

      return paginatedResponse(res, result.pagos, result.page, result.limit, result.total);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get pago by ID
   */
  async getPagoById(req, res, next) {
    try {
      const { id } = req.params;
      const pago = await pagoService.getPagoById(id);
      return successResponse(res, pago);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Create new pago
   */
  async createPago(req, res, next) {
    try {
      const pago = await pagoService.createPago(req.body);
      return createdResponse(res, pago, 'Pago registered successfully');
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update pago
   */
  async updatePago(req, res, next) {
    try {
      const { id } = req.params;
      const pago = await pagoService.updatePago(id, req.body);
      return successResponse(res, pago, 'Pago updated successfully');
    } catch (error) {
      next(error);
    }
  }

  /**
   * Delete pago
   */
  async deletePago(req, res, next) {
    try {
      const { id } = req.params;
      const result = await pagoService.deletePago(id);
      return successResponse(res, result, result.message);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get income report
   */
  async getIncomeReport(req, res, next) {
    try {
      const { dateFrom, dateTo, doctorId, consultorioId } = req.query;
      const report = await pagoService.getIncomeReport(
        dateFrom,
        dateTo,
        doctorId,
        consultorioId
      );
      return successResponse(res, report);
    } catch (error) {
      next(error);
    }
  }
}

export default new PagoController();

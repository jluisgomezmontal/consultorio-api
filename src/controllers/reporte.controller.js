import reporteService from '../services/reporte.service.js';
import { successResponse } from '../utils/response.js';

class ReporteController {
  /**
   * Get citas report
   */
  async getCitasReport(req, res, next) {
    try {
      const { dateFrom, dateTo, consultorioId } = req.query;
      const report = await reporteService.getCitasReport(dateFrom, dateTo, consultorioId);
      return successResponse(res, report);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get ingresos report
   */
  async getIngresosReport(req, res, next) {
    try {
      const { dateFrom, dateTo, consultorioId, doctorId } = req.query;
      const report = await reporteService.getIngresosReport(
        dateFrom,
        dateTo,
        consultorioId,
        doctorId
      );
      return successResponse(res, report);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get pacientes report
   */
  async getPacientesReport(req, res, next) {
    try {
      const { consultorioId } = req.query;
      const report = await reporteService.getPacientesReport(consultorioId);
      return successResponse(res, report);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get dashboard summary
   */
  async getDashboardSummary(req, res, next) {
    try {
      const { consultorioId } = req.query;
      const summary = await reporteService.getDashboardSummary(consultorioId);
      return successResponse(res, summary);
    } catch (error) {
      next(error);
    }
  }
}

export default new ReporteController();

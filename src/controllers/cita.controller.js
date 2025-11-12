import citaService from '../services/cita.service.js';
import { successResponse, createdResponse, paginatedResponse } from '../utils/response.js';

class CitaController {
  /**
   * Get all citas
   */
  async getAllCitas(req, res, next) {
    try {
      const {
        page = 1,
        limit = 10,
        doctorId,
        pacienteId,
        consultorioId,
        estado,
        dateFrom,
        dateTo,
      } = req.query;

      const filters = {
        doctorId,
        pacienteId,
        consultorioId,
        estado,
        dateFrom,
        dateTo,
      };

      const result = await citaService.getAllCitas(
        filters,
        parseInt(page),
        parseInt(limit)
      );

      return paginatedResponse(res, result.citas, result.page, result.limit, result.total);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get cita by ID
   */
  async getCitaById(req, res, next) {
    try {
      const { id } = req.params;
      const cita = await citaService.getCitaById(id);
      return successResponse(res, cita);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Create new cita
   */
  async createCita(req, res, next) {
    try {
      const cita = await citaService.createCita(req.body);
      return createdResponse(res, cita, 'Cita created successfully');
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update cita
   */
  async updateCita(req, res, next) {
    try {
      const { id } = req.params;
      const cita = await citaService.updateCita(id, req.body);
      return successResponse(res, cita, 'Cita updated successfully');
    } catch (error) {
      next(error);
    }
  }

  /**
   * Cancel cita
   */
  async cancelCita(req, res, next) {
    try {
      const { id } = req.params;
      const cita = await citaService.cancelCita(id);
      return successResponse(res, cita, 'Cita cancelled successfully');
    } catch (error) {
      next(error);
    }
  }

  /**
   * Delete cita
   */
  async deleteCita(req, res, next) {
    try {
      const { id } = req.params;
      const result = await citaService.deleteCita(id);
      return successResponse(res, result, result.message);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get calendar
   */
  async getCalendar(req, res, next) {
    try {
      const { doctorId, consultorioId, month, year } = req.query;
      const citas = await citaService.getCalendar(
        doctorId,
        consultorioId,
        month ? parseInt(month) : null,
        year ? parseInt(year) : null
      );
      return successResponse(res, citas);
    } catch (error) {
      next(error);
    }
  }
}

export default new CitaController();

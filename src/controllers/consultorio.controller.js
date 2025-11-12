import consultorioService from '../services/consultorio.service.js';
import { successResponse, createdResponse, paginatedResponse } from '../utils/response.js';

class ConsultorioController {
  /**
   * Get all consultorios
   */
  async getAllConsultorios(req, res, next) {
    try {
      const { page = 1, limit = 10 } = req.query;
      const result = await consultorioService.getAllConsultorios(
        parseInt(page),
        parseInt(limit)
      );
      return paginatedResponse(res, result.consultorios, result.page, result.limit, result.total);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get consultorio by ID
   */
  async getConsultorioById(req, res, next) {
    try {
      const { id } = req.params;
      const consultorio = await consultorioService.getConsultorioById(id);
      return successResponse(res, consultorio);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Create new consultorio
   */
  async createConsultorio(req, res, next) {
    try {
      const consultorio = await consultorioService.createConsultorio(req.body);
      return createdResponse(res, consultorio, 'Consultorio created successfully');
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update consultorio
   */
  async updateConsultorio(req, res, next) {
    try {
      const { id } = req.params;
      const consultorio = await consultorioService.updateConsultorio(id, req.body);
      return successResponse(res, consultorio, 'Consultorio updated successfully');
    } catch (error) {
      next(error);
    }
  }

  /**
   * Delete consultorio
   */
  async deleteConsultorio(req, res, next) {
    try {
      const { id } = req.params;
      const result = await consultorioService.deleteConsultorio(id);
      return successResponse(res, result, result.message);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get consultorio summary
   */
  async getConsultorioSummary(req, res, next) {
    try {
      const { id } = req.params;
      const summary = await consultorioService.getConsultorioSummary(id);
      return successResponse(res, summary);
    } catch (error) {
      next(error);
    }
  }
}

export default new ConsultorioController();

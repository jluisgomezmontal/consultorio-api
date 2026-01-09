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

  /**
   * Update clinical history configuration
   */
  async updateClinicalHistoryConfig(req, res, next) {
    try {
      const { id } = req.params;
      const config = req.body;
      
      const consultorio = await consultorioService.updateClinicalHistoryConfig(id, config);
      
      return successResponse(res, consultorio, 'Clinical history configuration updated successfully');
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update consultorio basic info (doctor only)
   */
  async updateConsultorioBasicInfo(req, res, next) {
    try {
      const { id } = req.params;
      const userId = req.user.id;
      const imageFile = req.file;
      
      const consultorio = await consultorioService.updateConsultorioBasicInfo(
        id,
        userId,
        req.body,
        imageFile
      );
      
      return successResponse(res, consultorio, 'Consultorio updated successfully');
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update receta template (doctor only)
   */
  async updateRecetaTemplate(req, res, next) {
    try {
      const { id } = req.params;
      const userId = req.user.id;
      const { recetaTemplate } = req.body;
      
      const consultorio = await consultorioService.updateRecetaTemplate(id, userId, recetaTemplate);
      
      return successResponse(res, consultorio, 'Receta template updated successfully');
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get clinical history configuration
   */
  async getClinicalHistoryConfig(req, res, next) {
    try {
      const { id } = req.params;
      const config = await consultorioService.getClinicalHistoryConfig(id);
      return successResponse(res, config);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update consultorio permissions (doctor only)
   */
  async updatePermissions(req, res, next) {
    try {
      const { id } = req.params;
      const userId = req.user.id;
      const { permissions } = req.body;
      
      const consultorio = await consultorioService.updatePermissions(id, userId, permissions);
      
      return successResponse(res, consultorio, 'Permissions updated successfully');
    } catch (error) {
      next(error);
    }
  }
}

export default new ConsultorioController();

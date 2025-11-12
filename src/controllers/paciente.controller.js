import pacienteService from '../services/paciente.service.js';
import { successResponse, createdResponse, paginatedResponse } from '../utils/response.js';

class PacienteController {
  /**
   * Get all pacientes
   */
  async getAllPacientes(req, res, next) {
    try {
      const { page = 1, limit = 10, search = '' } = req.query;
      const result = await pacienteService.getAllPacientes(
        parseInt(page),
        parseInt(limit),
        search
      );
      return paginatedResponse(res, result.pacientes, result.page, result.limit, result.total);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get paciente by ID
   */
  async getPacienteById(req, res, next) {
    try {
      const { id } = req.params;
      const paciente = await pacienteService.getPacienteById(id);
      return successResponse(res, paciente);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Create new paciente
   */
  async createPaciente(req, res, next) {
    try {
      const paciente = await pacienteService.createPaciente(req.body);
      return createdResponse(res, paciente, 'Paciente created successfully');
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update paciente
   */
  async updatePaciente(req, res, next) {
    try {
      const { id } = req.params;
      const paciente = await pacienteService.updatePaciente(id, req.body);
      return successResponse(res, paciente, 'Paciente updated successfully');
    } catch (error) {
      next(error);
    }
  }

  /**
   * Delete paciente
   */
  async deletePaciente(req, res, next) {
    try {
      const { id } = req.params;
      const result = await pacienteService.deletePaciente(id);
      return successResponse(res, result, result.message);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get paciente history
   */
  async getPacienteHistory(req, res, next) {
    try {
      const { id } = req.params;
      const history = await pacienteService.getPacienteHistory(id);
      return successResponse(res, history);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Search pacientes
   */
  async searchPacientes(req, res, next) {
    try {
      const { q } = req.query;
      const pacientes = await pacienteService.searchPacientes(q || '');
      return successResponse(res, pacientes);
    } catch (error) {
      next(error);
    }
  }
}

export default new PacienteController();

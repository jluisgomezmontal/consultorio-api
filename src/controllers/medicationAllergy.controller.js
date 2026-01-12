import medicationAllergyService from '../services/medicationAllergy.service.js';
import { successResponse, createdResponse, paginatedResponse } from '../utils/response.js';

class MedicationAllergyController {
  async getAllMedicationAllergies(req, res, next) {
    try {
      const { page = 1, limit = 50, search = '', category = '' } = req.query;
      const result = await medicationAllergyService.getAllMedicationAllergies(
        parseInt(page),
        parseInt(limit),
        search,
        category
      );
      return paginatedResponse(res, result.medications, result.page, result.limit, result.total);
    } catch (error) {
      next(error);
    }
  }

  async getMedicationAllergyById(req, res, next) {
    try {
      const { id } = req.params;
      const medication = await medicationAllergyService.getMedicationAllergyById(id);
      return successResponse(res, medication);
    } catch (error) {
      next(error);
    }
  }

  async getMedicationsByCategory(req, res, next) {
    try {
      const medications = await medicationAllergyService.getMedicationsByCategory();
      return successResponse(res, medications);
    } catch (error) {
      next(error);
    }
  }

  async createMedicationAllergy(req, res, next) {
    try {
      const medication = await medicationAllergyService.createMedicationAllergy(req.body);
      return createdResponse(res, medication, 'Medication allergy created successfully');
    } catch (error) {
      next(error);
    }
  }

  async updateMedicationAllergy(req, res, next) {
    try {
      const { id } = req.params;
      const medication = await medicationAllergyService.updateMedicationAllergy(id, req.body);
      return successResponse(res, medication, 'Medication allergy updated successfully');
    } catch (error) {
      next(error);
    }
  }

  async deleteMedicationAllergy(req, res, next) {
    try {
      const { id } = req.params;
      const result = await medicationAllergyService.deleteMedicationAllergy(id);
      return successResponse(res, result, result.message);
    } catch (error) {
      next(error);
    }
  }

  async addMedicationAllergyToPaciente(req, res, next) {
    try {
      const { pacienteId, medicationAllergyId } = req.params;
      const paciente = await medicationAllergyService.addMedicationAllergyToPaciente(
        pacienteId,
        medicationAllergyId,
        req.consultorioFilter
      );
      return successResponse(res, paciente, 'Medication allergy added to patient successfully');
    } catch (error) {
      next(error);
    }
  }

  async removeMedicationAllergyFromPaciente(req, res, next) {
    try {
      const { pacienteId, medicationAllergyId } = req.params;
      const paciente = await medicationAllergyService.removeMedicationAllergyFromPaciente(
        pacienteId,
        medicationAllergyId,
        req.consultorioFilter
      );
      return successResponse(res, paciente, 'Medication allergy removed from patient successfully');
    } catch (error) {
      next(error);
    }
  }

  async getPacienteMedicationAllergies(req, res, next) {
    try {
      const { pacienteId } = req.params;
      const allergies = await medicationAllergyService.getPacienteMedicationAllergies(
        pacienteId,
        req.consultorioFilter
      );
      return successResponse(res, allergies);
    } catch (error) {
      next(error);
    }
  }
}

export default new MedicationAllergyController();

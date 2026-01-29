import aiService from '../services/ai.service.js';
import { Paciente } from '../models/index.js';
import { successResponse } from '../utils/response.js';
import { BadRequestError } from '../utils/errors.js';

class AIController {
  async suggestTreatment(req, res, next) {
    try {
      const { diagnostico, pacienteId } = req.body;

      if (!diagnostico || diagnostico.trim() === '') {
        throw new BadRequestError('El diagnóstico es requerido');
      }

      let pacienteInfo = {};

      if (pacienteId) {
        const paciente = await Paciente.findById(pacienteId)
          .select('birthDate age medicationAllergies medicalHistory allergies, gender')
          .populate('medicationAllergies', 'name activeIngredient');

        if (paciente) {
          if (paciente.birthDate) {
            const today = new Date();
            const birthDate = new Date(paciente.birthDate);
            let edad = today.getFullYear() - birthDate.getFullYear();
            const monthDiff = today.getMonth() - birthDate.getMonth();
            if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
              edad--;
            }
            pacienteInfo.edad = edad;
          } else if (paciente.age) {
            pacienteInfo.edad = paciente.age;
          }

          if (paciente.medicationAllergies && paciente.medicationAllergies.length > 0) {
            pacienteInfo.alergias = paciente.medicationAllergies.map(
              (allergy) => allergy.name || allergy.activeIngredient
            ).filter(Boolean);
          }

          if (paciente.medicalHistory && paciente.medicalHistory.trim() !== '') {
            pacienteInfo.condicionesPreexistentes = [paciente.medicalHistory];
          }
          if (paciente.gender && paciente.gender.trim() !== '') {
            pacienteInfo.genero = [paciente.gender];
          }

          if (paciente.allergies && paciente.allergies.trim() !== '') {
            if (!pacienteInfo.alergias) {
              pacienteInfo.alergias = [];
            }
            pacienteInfo.alergias.push(paciente.allergies);
          }
        }
      }

      const suggestions = await aiService.suggestTreatment(diagnostico, pacienteInfo);

      return successResponse(res, suggestions, 'Sugerencias generadas exitosamente');
    } catch (error) {
      next(error);
    }
  }
}

export default new AIController();

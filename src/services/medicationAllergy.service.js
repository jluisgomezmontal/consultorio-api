import MedicationAllergy from '../models/MedicationAllergy.model.js';
import { Paciente } from '../models/index.js';
import { NotFoundError, BadRequestError } from '../utils/errors.js';

class MedicationAllergyService {
  async getAllMedicationAllergies(page = 1, limit = 50, search = '', category = '') {
    const skip = (page - 1) * limit;

    const filter = { isActive: true };

    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { activeIngredient: { $regex: search, $options: 'i' } },
        { commonBrands: { $regex: search, $options: 'i' } },
      ];
    }

    if (category) {
      filter.category = category;
    }

    const [medicationsRaw, total] = await Promise.all([
      MedicationAllergy.find(filter).skip(skip).limit(limit).sort({ name: 1 }).lean(),
      MedicationAllergy.countDocuments(filter),
    ]);

    const medications = medicationsRaw.map((med) => {
      const { _id, __v, ...rest } = med;
      return {
        ...rest,
        id: _id.toString(),
      };
    });

    return { medications, total, page, limit };
  }

  async getMedicationAllergyById(id) {
    const medication = await MedicationAllergy.findById(id).lean();

    if (!medication) {
      throw new NotFoundError('Medication allergy not found');
    }

    const { _id, __v, ...rest } = medication;

    return {
      ...rest,
      id: _id.toString(),
    };
  }

  async getMedicationsByCategory() {
    const medications = await MedicationAllergy.find({ isActive: true })
      .sort({ category: 1, name: 1 })
      .lean();

    const groupedByCategory = medications.reduce((acc, med) => {
      const { _id, __v, ...rest } = med;
      const medication = {
        ...rest,
        id: _id.toString(),
      };

      if (!acc[med.category]) {
        acc[med.category] = [];
      }
      acc[med.category].push(medication);
      return acc;
    }, {});

    return groupedByCategory;
  }

  async createMedicationAllergy(data) {
    const medication = await MedicationAllergy.create(data);
    return medication.toObject();
  }

  async updateMedicationAllergy(id, data) {
    const medication = await MedicationAllergy.findByIdAndUpdate(id, data, {
      new: true,
      runValidators: true,
    }).lean();

    if (!medication) {
      throw new NotFoundError('Medication allergy not found');
    }

    const { _id, __v, ...rest } = medication;

    return {
      ...rest,
      id: _id.toString(),
    };
  }

  async deleteMedicationAllergy(id) {
    const medication = await MedicationAllergy.findByIdAndUpdate(
      id,
      { isActive: false },
      { new: true }
    );

    if (!medication) {
      throw new NotFoundError('Medication allergy not found');
    }

    const patientsWithAllergy = await Paciente.countDocuments({
      medicationAllergies: id,
    });

    return {
      message: 'Medication allergy deactivated successfully',
      affectedPatients: patientsWithAllergy,
    };
  }

  async addMedicationAllergyToPaciente(pacienteId, medicationAllergyId, consultorioFilter = null) {
    const filter = { _id: pacienteId };
    
    if (consultorioFilter) {
      Object.assign(filter, consultorioFilter);
    }

    const medication = await MedicationAllergy.findById(medicationAllergyId);
    if (!medication) {
      throw new NotFoundError('Medication allergy not found');
    }

    const paciente = await Paciente.findOne(filter);
    if (!paciente) {
      throw new NotFoundError('Paciente not found or access denied');
    }

    if (paciente.medicationAllergies.includes(medicationAllergyId)) {
      throw new BadRequestError('Medication allergy already added to this patient');
    }

    paciente.medicationAllergies.push(medicationAllergyId);
    await paciente.save();

    const updatedPaciente = await Paciente.findById(pacienteId)
      .populate('medicationAllergies')
      .lean();

    const { _id, __v, ...rest } = updatedPaciente;

    return {
      ...rest,
      id: _id.toString(),
    };
  }

  async removeMedicationAllergyFromPaciente(pacienteId, medicationAllergyId, consultorioFilter = null) {
    const filter = { _id: pacienteId };
    
    if (consultorioFilter) {
      Object.assign(filter, consultorioFilter);
    }

    const paciente = await Paciente.findOne(filter);
    if (!paciente) {
      throw new NotFoundError('Paciente not found or access denied');
    }

    const index = paciente.medicationAllergies.indexOf(medicationAllergyId);
    if (index === -1) {
      throw new BadRequestError('Medication allergy not found in patient record');
    }

    paciente.medicationAllergies.splice(index, 1);
    await paciente.save();

    const updatedPaciente = await Paciente.findById(pacienteId)
      .populate('medicationAllergies')
      .lean();

    const { _id, __v, ...rest } = updatedPaciente;

    return {
      ...rest,
      id: _id.toString(),
    };
  }

  async getPacienteMedicationAllergies(pacienteId, consultorioFilter = null) {
    const filter = { _id: pacienteId };
    
    if (consultorioFilter) {
      Object.assign(filter, consultorioFilter);
    }

    const paciente = await Paciente.findOne(filter)
      .populate('medicationAllergies')
      .lean();

    if (!paciente) {
      throw new NotFoundError('Paciente not found or access denied');
    }

    const allergies = paciente.medicationAllergies.map((allergy) => {
      const { _id, __v, ...rest } = allergy;
      return {
        ...rest,
        id: _id.toString(),
      };
    });

    return allergies;
  }
}

export default new MedicationAllergyService();

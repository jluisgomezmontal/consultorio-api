import { Consultorio, User, Cita, Pago } from '../models/index.js';
import { NotFoundError } from '../utils/errors.js';

class ConsultorioService {
  /**
   * Get all consultorios
   */
  async getAllConsultorios(page = 1, limit = 10) {
    const skip = (page - 1) * limit;

    const [consultoriosRaw, total] = await Promise.all([
      Consultorio.find().skip(skip).limit(limit).sort({ createdAt: -1 }).lean(),
      Consultorio.countDocuments(),
    ]);

    // Get counts for each consultorio
    const consultoriosWithCounts = await Promise.all(
      consultoriosRaw.map(async (consultorio) => {
        const usersCount = await User.countDocuments({ consultoriosIds: consultorio._id });
        const citasCount = await Cita.countDocuments({ consultorioId: consultorio._id });
        const { _id, __v, ...rest } = consultorio;
        return {
          ...rest,
          id: _id.toString(),
          _count: {
            users: usersCount,
            citas: citasCount,
          },
        };
      })
    );

    return { consultorios: consultoriosWithCounts, total, page, limit };
  }

  /**
   * Get consultorio by ID
   */
  async getConsultorioById(id) {
    const consultorioDoc = await Consultorio.findById(id).lean();

    if (!consultorioDoc) {
      throw new NotFoundError('Consultorio not found');
    }

    console.log('📋 Getting consultorio by ID:', {
      id,
      name: consultorioDoc.name,
      imageUrl: consultorioDoc.imageUrl,
      s3ImageKey: consultorioDoc.s3ImageKey,
      hasImage: !!consultorioDoc.imageUrl,
    });

    // Get users and citas count
    const [users, citasCount] = await Promise.all([
      User.find({ consultoriosIds: id }).lean(),
      Cita.countDocuments({ consultorioId: id }),
    ]);

    const { _id, __v, ...consultorio } = consultorioDoc;

    const usersWithIds = users.map((user) => {
      const { _id: userId, __v: userV, ...userRest } = user;
      return {
        ...userRest,
        id: userId.toString(),
      };
    });

    return {
      ...consultorio,
      id: _id.toString(),
      users: usersWithIds,
      _count: {
        citas: citasCount,
      },
    };
  }

  /**
   * Create new consultorio
   */
  async createConsultorio(data) {
    const consultorio = await Consultorio.create(data);
    return consultorio.toObject();
  }

  /**
   * Update consultorio
   */
  async updateConsultorio(id, data) {
    const consultorio = await Consultorio.findByIdAndUpdate(id, data, {
      new: true,
      runValidators: true,
    }).lean();

    if (!consultorio) {
      throw new NotFoundError('Consultorio not found');
    }

    const { _id, __v, ...rest } = consultorio;

    return {
      ...rest,
      id: _id.toString(),
    };
  }

  /**
   * Delete consultorio
   */
  async deleteConsultorio(id) {
    const consultorio = await Consultorio.findById(id);

    if (!consultorio) {
      throw new NotFoundError('Consultorio not found');
    }

    // Delete all related data (cascade delete)
    const citas = await Cita.find({ consultorioId: id });
    const citaIds = citas.map((cita) => cita._id);
    await Pago.deleteMany({ citaId: { $in: citaIds } });
    await Cita.deleteMany({ consultorioId: id });
    await User.deleteMany({ consultoriosIds: id });
    await Consultorio.findByIdAndDelete(id);

    return { message: 'Consultorio deleted successfully' };
  }

  /**
   * Get consultorio summary with statistics
   */
  async getConsultorioSummary(id) {
    const consultorioDoc = await Consultorio.findById(id).lean();

    if (!consultorioDoc) {
      throw new NotFoundError('Consultorio not found');
    }

    const users = await User.find({ consultoriosIds: id }).lean();

    // Get citas statistics
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [
      totalCitas,
      citasHoy,
      citasPendientes,
      uniquePacientes,
      citasForIngresos,
    ] = await Promise.all([
      Cita.countDocuments({ consultorioId: id }),
      Cita.countDocuments({
        consultorioId: id,
        date: { $gte: today },
      }),
      Cita.countDocuments({
        consultorioId: id,
        estado: 'pendiente',
      }),
      Cita.distinct('pacienteId', { consultorioId: id }),
      Cita.find({ consultorioId: id }).select('_id').lean(),
    ]);

    const citaIds = citasForIngresos.map((c) => c._id);
    const ingresosResult = await Pago.aggregate([
      {
        $match: {
          citaId: { $in: citaIds },
          estatus: 'pagado',
        },
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$monto' },
        },
      },
    ]);

    const { _id: consultorioId, __v, ...consultorioRest } = consultorioDoc;

    const usersWithIds = users.map((user) => {
      const { _id: userId, __v: userV, ...userRest } = user;
      return {
        ...userRest,
        id: userId.toString(),
      };
    });

    return {
      consultorio: { ...consultorioRest, id: consultorioId.toString(), users: usersWithIds },
      statistics: {
        totalCitas,
        citasHoy,
        citasPendientes,
        totalPacientes: uniquePacientes.length,
        totalIngresos: ingresosResult[0]?.total || 0,
        totalDoctors: users.filter((u) => u.role === 'doctor').length,
        totalStaff: users.length,
      },
    };
  }

  /**
   * Update clinical history configuration for a consultorio
   */
  async updateClinicalHistoryConfig(id, config) {
    const consultorio = await Consultorio.findByIdAndUpdate(
      id,
      { clinicalHistoryConfig: config },
      {
        new: true,
        runValidators: true,
      }
    ).lean();

    if (!consultorio) {
      throw new NotFoundError('Consultorio not found');
    }

    const { _id, __v, ...rest } = consultorio;

    return {
      ...rest,
      id: _id.toString(),
    };
  }

  /**
   * Get clinical history configuration for a consultorio
   */
  async getClinicalHistoryConfig(id) {
    const consultorio = await Consultorio.findById(id).select('clinicalHistoryConfig').lean();

    if (!consultorio) {
      throw new NotFoundError('Consultorio not found');
    }

    const defaultConfig = {
      antecedentesHeredofamiliares: true,
      antecedentesPersonalesPatologicos: true,
      antecedentesPersonalesNoPatologicos: true,
      ginecoObstetricos: true,
    };

    return consultorio.clinicalHistoryConfig || defaultConfig;
  }

  /**
   * Update consultorio basic info (doctor only)
   */
  async updateConsultorioBasicInfo(id, userId, data, imageFile = null) {
    const consultorio = await Consultorio.findById(id);

    if (!consultorio) {
      throw new NotFoundError('Consultorio not found');
    }

    const user = await User.findById(userId);
    if (!user || user.role !== 'doctor') {
      throw new BadRequestError('Only doctors can update consultorio basic info');
    }

    const hasAccess = user.consultoriosIds.some(cId => cId.toString() === id);
    if (!hasAccess) {
      throw new BadRequestError('You do not have access to this consultorio');
    }

    const updateData = {};
    if (data.name) updateData.name = data.name;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.address !== undefined) updateData.address = data.address;
    if (data.phone !== undefined) updateData.phone = data.phone;
    if (data.openHour) updateData.openHour = data.openHour;
    if (data.closeHour) updateData.closeHour = data.closeHour;

    if (imageFile) {
      console.log('📤 Uploading consultorio image...');
      const s3Service = (await import('./s3.service.js')).default;
      const { url, key } = await s3Service.uploadFile(imageFile, 'consultorios');
      
      console.log('✅ Image uploaded successfully:', { url, key });
      
      if (consultorio.imageUrl && consultorio.s3ImageKey) {
        try {
          await s3Service.deleteFile(consultorio.s3ImageKey);
        } catch (error) {
          console.error('Error deleting old image:', error);
        }
      }
      
      updateData.imageUrl = url;
      updateData.s3ImageKey = key;
      console.log('💾 Saving imageUrl to database:', url);
    }

    const updatedConsultorio = await Consultorio.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    }).lean();

    console.log('✅ Consultorio updated in database:', {
      id: updatedConsultorio._id,
      name: updatedConsultorio.name,
      imageUrl: updatedConsultorio.imageUrl,
      hasImage: !!updatedConsultorio.imageUrl,
    });

    const { _id, ...rest } = updatedConsultorio;
    return { ...rest, id: _id.toString() };
  }

  /**
   * Update receta template (doctor only)
   */
  async updateRecetaTemplate(id, userId, templateName) {
    const consultorio = await Consultorio.findById(id);

    if (!consultorio) {
      throw new NotFoundError('Consultorio not found');
    }

    const user = await User.findById(userId);
    if (!user || user.role !== 'doctor') {
      throw new BadRequestError('Only doctors can update receta template');
    }

    const hasAccess = user.consultoriosIds.some(cId => cId.toString() === id);
    if (!hasAccess) {
      throw new BadRequestError('You do not have access to this consultorio');
    }

    const updatedConsultorio = await Consultorio.findByIdAndUpdate(
      id,
      { recetaTemplate: templateName },
      { new: true, runValidators: true }
    ).lean();

    const { _id, ...rest } = updatedConsultorio;
    return { ...rest, id: _id.toString() };
  }

  /**
   * Update consultorio permissions (doctor only)
   */
  async updatePermissions(id, userId, permissions) {
    const consultorio = await Consultorio.findById(id);

    if (!consultorio) {
      throw new NotFoundError('Consultorio not found');
    }

    const user = await User.findById(userId);
    if (!user || user.role !== 'doctor') {
      throw new BadRequestError('Only doctors can update permissions');
    }

    const hasAccess = user.consultoriosIds.some(cId => cId.toString() === id);
    if (!hasAccess) {
      throw new BadRequestError('You do not have access to this consultorio');
    }

    const updatedConsultorio = await Consultorio.findByIdAndUpdate(
      id,
      { permissions },
      { new: true, runValidators: true }
    ).lean();

    const { _id, ...rest } = updatedConsultorio;
    return { ...rest, id: _id.toString() };
  }
}

export default new ConsultorioService();

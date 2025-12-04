import Documento from '../models/Documento.model.js';
import s3Service from './s3.service.js';

class DocumentoService {
  async createDocumento(data) {
    const documento = new Documento(data);
    await documento.save();
    return documento;
  }

  async getDocumentoByIdRaw(id) {
    const documento = await Documento.findById(id).lean();
    return documento;
  }

  async getDocumentoById(id) {
    const documento = await Documento.findById(id)
      .populate('pacienteId', 'fullName')
      .populate('citaId', 'date time')
      .populate('uploadedBy', 'name email');

    if (!documento) {
      throw new Error('Documento no encontrado');
    }

    // Generar URL firmada para descarga
    const signedUrl = await s3Service.getSignedDownloadUrl(documento.s3Key);
    
    return {
      ...documento.toObject(),
      downloadUrl: signedUrl,
    };
  }

  async getDocumentosByCita(citaId, consultorioId) {
    const documentos = await Documento.find({ citaId, consultorioId })
      .populate('uploadedBy', 'name email')
      .sort({ createdAt: -1 });

    // Generar URLs firmadas para cada documento
    const documentosConUrls = await Promise.all(
      documentos.map(async (doc) => {
        const signedUrl = await s3Service.getSignedDownloadUrl(doc.s3Key);
        return {
          ...doc.toObject(),
          downloadUrl: signedUrl,
        };
      })
    );

    return documentosConUrls;
  }

  async getDocumentosByPaciente(pacienteId, consultorioId, page = 1, limit = 20) {
    const skip = (page - 1) * limit;

    const [documentos, total] = await Promise.all([
      Documento.find({ pacienteId, consultorioId })
        .populate('citaId', 'date time motivo')
        .populate('uploadedBy', 'name email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Documento.countDocuments({ pacienteId, consultorioId }),
    ]);

    // Generar URLs firmadas
    const documentosConUrls = await Promise.all(
      documentos.map(async (doc) => {
        const signedUrl = await s3Service.getSignedDownloadUrl(doc.s3Key);
        return {
          ...doc.toObject(),
          downloadUrl: signedUrl,
        };
      })
    );

    return {
      documentos: documentosConUrls,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  async deleteDocumento(id, consultorioId) {
    const documento = await Documento.findOne({ _id: id, consultorioId });

    if (!documento) {
      throw new Error('Documento no encontrado');
    }

    // Eliminar de S3
    await s3Service.deleteFile(documento.s3Key);

    // Eliminar de la base de datos
    await documento.deleteOne();

    return { message: 'Documento eliminado exitosamente' };
  }

  async updateDocumento(id, consultorioId, updates) {
    const documento = await Documento.findOneAndUpdate(
      { _id: id, consultorioId },
      updates,
      { new: true, runValidators: true }
    );

    if (!documento) {
      throw new Error('Documento no encontrado');
    }

    return documento;
  }
}

export default new DocumentoService();

import mongoose from 'mongoose';

const documentoSchema = new mongoose.Schema(
  {
    nombre: {
      type: String,
      required: true,
      trim: true,
    },
    descripcion: {
      type: String,
      trim: true,
    },
    tipo: {
      type: String,
      enum: ['receta', 'laboratorio', 'imagen', 'estudio', 'consentimiento', 'historial', 'otro'],
      required: true,
    },
    url: {
      type: String,
      required: true,
    },
    s3Key: {
      type: String,
      required: true,
    },
    mimeType: {
      type: String,
      required: true,
    },
    tamanio: {
      type: Number,
      required: true,
    },
    citaId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Cita',
      required: true,
      index: true,
    },
    pacienteId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Paciente',
      required: true,
      index: true,
    },
    consultorioId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Consultorio',
      required: true,
      index: true,
    },
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

documentoSchema.index({ pacienteId: 1, createdAt: -1 });
documentoSchema.index({ citaId: 1, createdAt: -1 });
documentoSchema.index({ consultorioId: 1, createdAt: -1 });

const Documento = mongoose.model('Documento', documentoSchema);

export default Documento;

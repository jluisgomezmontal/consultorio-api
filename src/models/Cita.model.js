import mongoose from 'mongoose';

const citaSchema = new mongoose.Schema(
  {
    pacienteId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Paciente',
      required: true,
      index: true,
    },
    doctorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    consultorioId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Consultorio',
      required: true,
      index: true,
    },
    date: {
      type: Date,
      required: true,
      index: true,
    },
    time: {
      type: String,
      required: true,
      trim: true,
    },
    motivo: {
      type: String,
      trim: true,
    },
    diagnostico: {
      type: String,
      trim: true,
    },
    tratamiento: {
      type: String,
      trim: true,
    },
    estado: {
      type: String,
      required: true,
      enum: ['pendiente', 'confirmada', 'completada', 'cancelada'],
      default: 'pendiente',
      index: true,
    },
    costo: {
      type: Number,
      min: 0,
    },
    notas: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
    collection: 'citas',
    toJSON: {
      virtuals: true,
      transform: function (doc, ret) {
        ret.id = ret._id.toString();
        delete ret._id;
        delete ret.__v;
        return ret;
      },
    },
    toObject: {
      virtuals: true,
      transform: function (doc, ret) {
        ret.id = ret._id.toString();
        delete ret._id;
        delete ret.__v;
        return ret;
      },
    },
  }
);

const Cita = mongoose.model('Cita', citaSchema);

export default Cita;

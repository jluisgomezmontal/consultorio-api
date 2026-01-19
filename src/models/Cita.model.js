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
    weight: {
      type: Number,
      min: 0,
    },
    bloodPressure: {
      type: String,
      trim: true,
    },
    heartRate: {
      type: Number,
      min: 0,
    },
    temperature: {
      type: Number,
      min: 0,
    },
    oxygenSaturation: {
      type: Number,
      min: 0,
      max: 100,
    },
    bmi: {
      type: Number,
      min: 0,
    },
    measurements: {
      type: {
        height: { type: Number, min: 0 },
        waist: { type: Number, min: 0 },
        hip: { type: Number, min: 0 },
      },
      default: {},
    },
    currentCondition: {
      type: String,
      trim: true,
    },
    physicalExam: {
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
    medicamentos: [
      {
        nombre: {
          type: String,
          required: true,
          trim: true,
        },
        dosis: {
          type: String,
          trim: true,
        },
        frecuencia: {
          type: String,
          trim: true,
        },
        duracion: {
          type: String,
          trim: true,
        },
        indicaciones: {
          type: String,
          trim: true,
        },
      },
    ],
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

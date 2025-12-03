import mongoose from 'mongoose';

const pacienteSchema = new mongoose.Schema(
  {
    fullName: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    age: {
      type: Number,
      min: 0,
      max: 150,
    },
    gender: {
      type: String,
      enum: ['masculino', 'femenino', 'otro'],
    },
    phone: {
      type: String,
      trim: true,
      index: true,
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
      index: true,
    },
    address: {
      type: String,
      trim: true,
    },
    medicalHistory: {
      type: String,
      trim: true,
    },
    allergies: {
      type: String,
      trim: true,
    },
    notes: {
      type: String,
      trim: true,
    },
    consultorioId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Consultorio',
      required: true,
      index: true,
    },
  },
  {
    timestamps: true,
    collection: 'pacientes',
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

const Paciente = mongoose.model('Paciente', pacienteSchema);

export default Paciente;

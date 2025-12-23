import mongoose from 'mongoose';

const pacienteSchema = new mongoose.Schema(
  {
    fullName: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    birthDate: {
      type: Date,
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
    bloodType: {
      type: String,
      enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'],
      trim: true,
    },
    medicalInsurance: {
      type: {
        insurer: { type: String, trim: true },
        policyNumber: { type: String, trim: true },
        holderName: { type: String, trim: true },
        relationship: { type: String, enum: ['Titular', 'Esposo(a)', 'Hijo(a)', 'Otro'], trim: true },
      },
      default: {},
    },
    emergencyContact: {
      type: {
        name: { type: String, trim: true },
        relationship: { type: String, trim: true },
        phone: { type: String, trim: true },
      },
      default: {},
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
    clinicalHistory: {
      type: {
        antecedentesHeredofamiliares: {
          type: {
            diabetes: { type: Boolean, default: false },
            hipertension: { type: Boolean, default: false },
            cancer: { type: Boolean, default: false },
            cardiopatias: { type: Boolean, default: false },
            otros: { type: String, trim: true },
          },
          default: {},
        },
        antecedentesPersonalesPatologicos: {
          type: {
            cirugias: { type: String, trim: true },
            hospitalizaciones: { type: String, trim: true },
          },
          default: {},
        },
        antecedentesPersonalesNoPatologicos: {
          type: {
            tabaquismo: { type: Boolean, default: false },
            alcoholismo: { type: Boolean, default: false },
            actividadFisica: { type: String, trim: true },
            vacunas: { type: String, trim: true },
          },
          default: {},
        },
        ginecoObstetricos: {
          type: {
            embarazos: { type: Number, min: 0 },
            partos: { type: Number, min: 0 },
            cesareas: { type: Number, min: 0 },
          },
          default: {},
        },
      },
      default: {},
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

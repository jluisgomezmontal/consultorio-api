import mongoose from 'mongoose';

const paqueteSchema = new mongoose.Schema(
  {
    nombre: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    displayName: {
      type: String,
      required: true,
    },
    descripcion: {
      type: String,
      required: true,
    },
    precio: {
      mensual: {
        type: Number,
        required: true,
      },
      anual: {
        type: Number,
        required: true,
      },
    },
    // Stripe Price IDs
    stripePriceIds: {
      mensual: {
        type: String,
        trim: true,
      },
      anual: {
        type: String,
        trim: true,
      },
    },
    limites: {
      consultorios: {
        type: Number,
        required: true,
        default: 1,
      },
      doctores: {
        type: Number,
        required: true,
        default: 1,
      },
      recepcionistas: {
        type: Number,
        required: true,
        default: 1,
      },
      pacientes: {
        type: Number,
        default: null,
      },
      citas: {
        type: Number,
        default: null,
      },
    },
    features: {
      uploadDocumentos: {
        type: Boolean,
        required: true,
        default: false,
      },
      uploadImagenes: {
        type: Boolean,
        required: true,
        default: false,
      },
      reportesAvanzados: {
        type: Boolean,
        default: false,
      },
      integraciones: {
        type: Boolean,
        default: false,
      },
      soportePrioritario: {
        type: Boolean,
        default: false,
      },
    },
    activo: {
      type: Boolean,
      default: true,
    },
    orden: {
      type: Number,
      required: true,
    },
  },
  {
    timestamps: true,
    collection: 'paquetes',
  }
);

paqueteSchema.set('toJSON', {
  transform: (doc, ret) => {
    ret.id = ret._id.toString();
    delete ret._id;
    delete ret.__v;
    return ret;
  },
});

const Paquete = mongoose.model('Paquete', paqueteSchema);

export default Paquete;

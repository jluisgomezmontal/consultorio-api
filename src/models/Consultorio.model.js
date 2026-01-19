import mongoose from 'mongoose';

const consultorioSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    address: {
      type: String,
      trim: true,
    },
    phone: {
      type: String,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    openHour: {
      type: String,
      trim: true,
    },
    closeHour: {
      type: String,
      trim: true,
    },
    imageUrl: {
      type: String,
      trim: true,
      default: 'https://miconsultorio.vercel.app/miconsultorio.svg',
    },
    s3ImageKey: {
      type: String,
      trim: true,
    },
    recetaTemplate: {
      type: String,
      enum: ['template1', 'template2', 'template3', 'template4', 'template5'],
      default: 'template1',
    },
    clinicalHistoryConfig: {
      type: {
        antecedentesHeredofamiliares: {
          type: Boolean,
          default: true,
        },
        antecedentesPersonalesPatologicos: {
          type: Boolean,
          default: true,
        },
        antecedentesPersonalesNoPatologicos: {
          type: Boolean,
          default: true,
        },
        ginecoObstetricos: {
          type: Boolean,
          default: true,
        },
      },
      default: {
        antecedentesHeredofamiliares: true,
        antecedentesPersonalesPatologicos: true,
        antecedentesPersonalesNoPatologicos: true,
        ginecoObstetricos: true,
      },
    },
    permissions: {
      type: {
        allowReceptionistViewClinicalSummary: {
          type: Boolean,
          default: false,
        },
      },
      default: {
        allowReceptionistViewClinicalSummary: false,
      },
    },
    appointmentSectionsConfig: {
      type: {
        signosVitales: {
          type: Boolean,
          default: true,
        },
        evaluacionMedica: {
          type: Boolean,
          default: true,
        },
        diagnosticoTratamiento: {
          type: Boolean,
          default: true,
        },
        medicamentos: {
          type: Boolean,
          default: true,
        },
        notasAdicionales: {
          type: Boolean,
          default: true,
        },
      },
      default: {
        signosVitales: true,
        evaluacionMedica: true,
        diagnosticoTratamiento: true,
        medicamentos: true,
        notasAdicionales: true,
      },
    },
    paquete: {
      type: String,
      enum: ['basico', 'profesional', 'clinica', 'licencia'],
      required: true,
      default: 'basico',
      index: true,
    },
    suscripcion: {
      estado: {
        type: String,
        enum: ['trial', 'activa', 'vencida', 'cancelada'],
        default: 'trial',
      },
      fechaInicio: {
        type: Date,
        default: Date.now,
      },
      fechaVencimiento: {
        type: Date,
      },
      tipoPago: {
        type: String,
        enum: ['mensual', 'anual'],
        default: 'mensual',
      },
    },
    // Stripe integration
    stripeCustomerId: {
      type: String,
      trim: true,
      index: true,
    },
    stripeSubscriptionId: {
      type: String,
      trim: true,
      index: true,
    },
  },
  {
    timestamps: true,
    collection: 'consultorios',
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

const Consultorio = mongoose.model('Consultorio', consultorioSchema);

export default Consultorio;

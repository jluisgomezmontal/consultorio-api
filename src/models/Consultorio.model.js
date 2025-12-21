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

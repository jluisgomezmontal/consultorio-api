import mongoose from 'mongoose';

const medicationAllergySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    category: {
      type: String,
      required: true,
      enum: [
        'Antibióticos',
        'Analgésicos',
        'Antiinflamatorios',
        'Antihistamínicos',
        'Anestésicos',
        'Anticonvulsivantes',
        'Cardiovasculares',
        'Insulinas',
        'Otros',
      ],
      index: true,
    },
    activeIngredient: {
      type: String,
      trim: true,
    },
    commonBrands: {
      type: [String],
      default: [],
    },
    description: {
      type: String,
      trim: true,
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
  },
  {
    timestamps: true,
    collection: 'medication_allergies',
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

medicationAllergySchema.index({ name: 1, category: 1 });

const MedicationAllergy = mongoose.model('MedicationAllergy', medicationAllergySchema);

export default MedicationAllergy;

import mongoose from 'mongoose';

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
      index: true,
    },
    password: {
      type: String,
      required: true,
      select: false, // Don't include password in queries by default
    },
    role: {
      type: String,
      required: true,
      enum: ['admin', 'doctor', 'recepcionista'],
      default: 'recepcionista',
      index: true,
    },
    consultoriosIds: {
      type: [mongoose.Schema.Types.ObjectId],
      ref: 'Consultorio',
      required: true,
      default: [],
      index: true,
    },
    isActive: {
      type: Boolean,
      required: true,
      default: true,
      index: true,
    },
    cedulas: {
      type: [String],
      default: [],
      trim: true,
    },
  },
  {
    timestamps: true,
    collection: 'users',
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

const User = mongoose.model('User', userSchema);

export default User;

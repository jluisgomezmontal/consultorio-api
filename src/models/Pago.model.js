import mongoose from 'mongoose';

const pagoSchema = new mongoose.Schema(
  {
    citaId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Cita',
      required: true,
      index: true,
    },
    consultorioId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Consultorio',
      required: true,
      index: true,
    },
    monto: {
      type: Number,
      required: true,
      min: 0,
    },
    metodo: {
      type: String,
      required: true,
      enum: ['efectivo', 'tarjeta', 'transferencia'],
    },
    fechaPago: {
      type: Date,
      default: Date.now,
      index: true,
    },
    estatus: {
      type: String,
      required: true,
      enum: ['pagado', 'pendiente'],
      default: 'pendiente',
      index: true,
    },
    comentarios: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
    collection: 'pagos',
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

const Pago = mongoose.model('Pago', pagoSchema);

export default Pago;

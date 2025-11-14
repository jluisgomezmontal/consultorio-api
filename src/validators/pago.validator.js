import { z } from 'zod';

const objectIdRegex = /^[0-9a-fA-F]{24}$/;

const objectIdSchema = z
  .string()
  .regex(objectIdRegex, 'Invalid ObjectId');

export const createPagoSchema = z.object({
  body: z.object({
    citaId: objectIdSchema,
    monto: z.number().positive('Amount must be positive'),
    metodo: z.enum(['efectivo', 'tarjeta', 'transferencia'], {
      errorMap: () => ({ message: 'Payment method must be efectivo, tarjeta, or transferencia' }),
    }),
    fechaPago: z.string().refine((val) => !isNaN(Date.parse(val)), {
      message: 'Invalid date format',
    }).optional(),
    estatus: z.enum(['pagado', 'pendiente']).optional(),
    comentarios: z.string().optional(),
  }),
});

export const updatePagoSchema = z.object({
  body: z.object({
    monto: z.number().positive('Amount must be positive').optional(),
    metodo: z.enum(['efectivo', 'tarjeta', 'transferencia']).optional(),
    fechaPago: z.string().refine((val) => !isNaN(Date.parse(val)), {
      message: 'Invalid date format',
    }).optional(),
    estatus: z.enum(['pagado', 'pendiente']).optional(),
    comentarios: z.string().optional(),
  }),
  params: z.object({
    id: objectIdSchema,
  }),
});

export const getPagoSchema = z.object({
  params: z.object({
    id: objectIdSchema,
  }),
});

export const listPagosSchema = z.object({
  query: z.object({
    citaId: objectIdSchema.optional(),
    estatus: z.enum(['pagado', 'pendiente']).optional(),
    dateFrom: z.string().optional(),
    dateTo: z.string().optional(),
    page: z.string().regex(/^[0-9]+$/).optional(),
    limit: z.string().regex(/^\d+$/).optional(),
  }),
});

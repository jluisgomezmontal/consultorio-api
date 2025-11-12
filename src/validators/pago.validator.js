import { z } from 'zod';

export const createPagoSchema = z.object({
  body: z.object({
    citaId: z.string().uuid('Invalid cita ID'),
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
    id: z.string().uuid('Invalid pago ID'),
  }),
});

export const getPagoSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid pago ID'),
  }),
});

export const listPagosSchema = z.object({
  query: z.object({
    citaId: z.string().uuid().optional(),
    estatus: z.enum(['pagado', 'pendiente']).optional(),
    dateFrom: z.string().optional(),
    dateTo: z.string().optional(),
    page: z.string().regex(/^\d+$/).optional(),
    limit: z.string().regex(/^\d+$/).optional(),
  }),
});

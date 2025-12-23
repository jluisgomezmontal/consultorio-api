import { z } from 'zod';

const objectIdRegex = /^[0-9a-fA-F]{24}$/;

const objectIdSchema = z
  .string()
  .regex(objectIdRegex, 'Invalid ObjectId');

const medicamentoSchema = z.object({
  nombre: z.string().min(1, 'Medication name is required'),
  dosis: z.string().optional(),
  frecuencia: z.string().optional(),
  duracion: z.string().optional(),
  indicaciones: z.string().optional(),
});

const measurementsSchema = z.object({
  height: z.number().positive().optional(),
  waist: z.number().positive().optional(),
  hip: z.number().positive().optional(),
}).optional();

export const createCitaSchema = z.object({
  body: z.object({
    pacienteId: objectIdSchema,
    doctorId: objectIdSchema,
    consultorioId: objectIdSchema,
    date: z.string().refine((val) => !isNaN(Date.parse(val)), {
      message: 'Invalid date format',
    }),
    time: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format (HH:MM)'),
    motivo: z.string().optional(),
    weight: z.number().positive().optional(),
    bloodPressure: z.string().optional(),
    measurements: measurementsSchema,
    currentCondition: z.string().optional(),
    physicalExam: z.string().optional(),
    diagnostico: z.string().optional(),
    tratamiento: z.string().optional(),
    medicamentos: z.array(medicamentoSchema).optional(),
    estado: z.enum(['pendiente', 'confirmada', 'completada', 'cancelada']).optional(),
    costo: z.number().positive().optional(),
    notas: z.string().optional(),
  }),
});

export const updateCitaSchema = z.object({
  body: z.object({
    pacienteId: objectIdSchema.optional(),
    doctorId: objectIdSchema.optional(),
    consultorioId: objectIdSchema.optional(),
    date: z.string().refine((val) => !isNaN(Date.parse(val)), {
      message: 'Invalid date format',
    }).optional(),
    time: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format (HH:MM)').optional(),
    motivo: z.string().optional(),
    weight: z.number().positive().optional(),
    bloodPressure: z.string().optional(),
    measurements: measurementsSchema,
    currentCondition: z.string().optional(),
    physicalExam: z.string().optional(),
    diagnostico: z.string().optional(),
    tratamiento: z.string().optional(),
    medicamentos: z.array(medicamentoSchema).optional(),
    estado: z.enum(['pendiente', 'confirmada', 'completada', 'cancelada']).optional(),
    costo: z.number().positive().optional(),
    notas: z.string().optional(),
  }),
  params: z.object({
    id: objectIdSchema,
  }),
});

export const getCitaSchema = z.object({
  params: z.object({
    id: objectIdSchema,
  }),
});

export const listCitasSchema = z.object({
  query: z.object({
    search: z.string().trim().optional(),
    doctorId: objectIdSchema.optional(),
    pacienteId: objectIdSchema.optional(),
    consultorioId: objectIdSchema.optional(),
    estado: z.enum(['pendiente', 'confirmada', 'completada', 'cancelada']).optional(),
    dateFrom: z.string().optional(),
    dateTo: z.string().optional(),
    page: z.string().regex(/^\d+$/).optional(),
    limit: z.string().regex(/^\d+$/).optional(),
  }),
});

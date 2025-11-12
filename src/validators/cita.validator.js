import { z } from 'zod';

export const createCitaSchema = z.object({
  body: z.object({
    pacienteId: z.string().uuid('Invalid paciente ID'),
    doctorId: z.string().uuid('Invalid doctor ID'),
    consultorioId: z.string().uuid('Invalid consultorio ID'),
    date: z.string().refine((val) => !isNaN(Date.parse(val)), {
      message: 'Invalid date format',
    }),
    time: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format (HH:MM)'),
    motivo: z.string().optional(),
    diagnostico: z.string().optional(),
    tratamiento: z.string().optional(),
    estado: z.enum(['pendiente', 'confirmada', 'completada', 'cancelada']).optional(),
    costo: z.number().positive().optional(),
    notas: z.string().optional(),
  }),
});

export const updateCitaSchema = z.object({
  body: z.object({
    pacienteId: z.string().uuid('Invalid paciente ID').optional(),
    doctorId: z.string().uuid('Invalid doctor ID').optional(),
    consultorioId: z.string().uuid('Invalid consultorio ID').optional(),
    date: z.string().refine((val) => !isNaN(Date.parse(val)), {
      message: 'Invalid date format',
    }).optional(),
    time: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format (HH:MM)').optional(),
    motivo: z.string().optional(),
    diagnostico: z.string().optional(),
    tratamiento: z.string().optional(),
    estado: z.enum(['pendiente', 'confirmada', 'completada', 'cancelada']).optional(),
    costo: z.number().positive().optional(),
    notas: z.string().optional(),
  }),
  params: z.object({
    id: z.string().uuid('Invalid cita ID'),
  }),
});

export const getCitaSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid cita ID'),
  }),
});

export const listCitasSchema = z.object({
  query: z.object({
    doctorId: z.string().uuid().optional(),
    pacienteId: z.string().uuid().optional(),
    consultorioId: z.string().uuid().optional(),
    estado: z.enum(['pendiente', 'confirmada', 'completada', 'cancelada']).optional(),
    dateFrom: z.string().optional(),
    dateTo: z.string().optional(),
    page: z.string().regex(/^\d+$/).optional(),
    limit: z.string().regex(/^\d+$/).optional(),
  }),
});

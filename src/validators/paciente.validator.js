import { z } from 'zod';

const objectIdRegex = /^[0-9a-fA-F]{24}$/;

const objectIdSchema = z
  .string()
  .regex(objectIdRegex, 'Invalid ObjectId');

const clinicalHistorySchema = z.object({
  antecedentesHeredofamiliares: z.object({
    diabetes: z.boolean().optional(),
    hipertension: z.boolean().optional(),
    cancer: z.boolean().optional(),
    cardiopatias: z.boolean().optional(),
    otros: z.string().optional(),
  }).optional(),
  antecedentesPersonalesPatologicos: z.object({
    cirugias: z.string().optional(),
    hospitalizaciones: z.string().optional(),
  }).optional(),
  antecedentesPersonalesNoPatologicos: z.object({
    tabaquismo: z.boolean().optional(),
    alcoholismo: z.boolean().optional(),
    actividadFisica: z.string().optional(),
    vacunas: z.string().optional(),
  }).optional(),
  ginecoObstetricos: z.object({
    embarazos: z.number().int().min(0).optional(),
    partos: z.number().int().min(0).optional(),
    cesareas: z.number().int().min(0).optional(),
  }).optional(),
}).optional();

export const createPacienteSchema = z.object({
  body: z.object({
    fullName: z.string().min(2, 'Full name must be at least 2 characters'),
    consultorioId: objectIdSchema,
    age: z.number().int().positive().optional(),
    gender: z.enum(['masculino', 'femenino', 'otro']).optional(),
    phone: z.string().optional(),
    email: z.string().email('Invalid email format').optional(),
    address: z.string().optional(),
    medicalHistory: z.string().optional(),
    allergies: z.string().optional(),
    notes: z.string().optional(),
    clinicalHistory: clinicalHistorySchema,
  }),
});

export const updatePacienteSchema = z.object({
  body: z.object({
    fullName: z.string().min(2, 'Full name must be at least 2 characters').optional(),
    age: z.number().int().positive().optional(),
    gender: z.enum(['masculino', 'femenino', 'otro']).optional(),
    phone: z.string().optional(),
    email: z.string().email('Invalid email format').optional(),
    address: z.string().optional(),
    medicalHistory: z.string().optional(),
    allergies: z.string().optional(),
    notes: z.string().optional(),
    clinicalHistory: clinicalHistorySchema,
  }),
  params: z.object({
    id: objectIdSchema,
  }),
});

export const getPacienteSchema = z.object({
  params: z.object({
    id: objectIdSchema,
  }),
});

export const searchPacientesSchema = z.object({
  query: z.object({
    search: z.string().optional(),
    page: z.string().regex(/^\d+$/).optional(),
    limit: z.string().regex(/^\d+$/).optional(),
  }),
});

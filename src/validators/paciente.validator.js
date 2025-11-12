import { z } from 'zod';

export const createPacienteSchema = z.object({
  body: z.object({
    fullName: z.string().min(2, 'Full name must be at least 2 characters'),
    age: z.number().int().positive().optional(),
    gender: z.enum(['masculino', 'femenino', 'otro']).optional(),
    phone: z.string().optional(),
    email: z.string().email('Invalid email format').optional(),
    address: z.string().optional(),
    medicalHistory: z.string().optional(),
    allergies: z.string().optional(),
    notes: z.string().optional(),
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
  }),
  params: z.object({
    id: z.string().uuid('Invalid paciente ID'),
  }),
});

export const getPacienteSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid paciente ID'),
  }),
});

export const searchPacientesSchema = z.object({
  query: z.object({
    search: z.string().optional(),
    page: z.string().regex(/^\d+$/).optional(),
    limit: z.string().regex(/^\d+$/).optional(),
  }),
});

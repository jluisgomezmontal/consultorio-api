import { z } from 'zod';

const objectIdRegex = /^[0-9a-fA-F]{24}$/;

const objectIdSchema = z
  .string()
  .regex(objectIdRegex, 'Invalid ObjectId');

export const createMedicationAllergySchema = z.object({
  body: z.object({
    name: z.string().min(2, 'Name must be at least 2 characters'),
    category: z.enum([
      'Antibióticos',
      'Analgésicos',
      'Antiinflamatorios',
      'Antihistamínicos',
      'Anestésicos',
      'Anticonvulsivantes',
      'Cardiovasculares',
      'Insulinas',
      'Otros',
    ]),
    activeIngredient: z.string().optional(),
    commonBrands: z.array(z.string()).optional(),
    description: z.string().optional(),
    isActive: z.boolean().optional(),
  }),
});

export const updateMedicationAllergySchema = z.object({
  body: z.object({
    name: z.string().min(2, 'Name must be at least 2 characters').optional(),
    category: z.enum([
      'Antibióticos',
      'Analgésicos',
      'Antiinflamatorios',
      'Antihistamínicos',
      'Anestésicos',
      'Anticonvulsivantes',
      'Cardiovasculares',
      'Insulinas',
      'Otros',
    ]).optional(),
    activeIngredient: z.string().optional(),
    commonBrands: z.array(z.string()).optional(),
    description: z.string().optional(),
    isActive: z.boolean().optional(),
  }),
  params: z.object({
    id: objectIdSchema,
  }),
});

export const getMedicationAllergySchema = z.object({
  params: z.object({
    id: objectIdSchema,
  }),
});

export const searchMedicationAllergiesSchema = z.object({
  query: z.object({
    search: z.string().optional(),
    category: z.string().optional(),
    page: z.string().regex(/^\d+$/).optional(),
    limit: z.string().regex(/^\d+$/).optional(),
  }),
});

export const addMedicationAllergyToPacienteSchema = z.object({
  params: z.object({
    pacienteId: objectIdSchema,
    medicationAllergyId: objectIdSchema,
  }),
});

export const removeMedicationAllergyFromPacienteSchema = z.object({
  params: z.object({
    pacienteId: objectIdSchema,
    medicationAllergyId: objectIdSchema,
  }),
});

export const getPacienteMedicationAllergiesSchema = z.object({
  params: z.object({
    pacienteId: objectIdSchema,
  }),
});

import { z } from 'zod';

const objectIdRegex = /^[0-9a-fA-F]{24}$/;

const objectIdSchema = z
  .string()
  .regex(objectIdRegex, 'Invalid ObjectId');

export const createConsultorioSchema = z.object({
  body: z.object({
    name: z.string().min(2, 'Name must be at least 2 characters'),
    address: z.string().optional(),
    phone: z.string().optional(),
    description: z.string().optional(),
    openHour: z.string().optional(),
    closeHour: z.string().optional(),
  }),
});

export const updateConsultorioSchema = z.object({
  body: z.object({
    name: z.string().min(2, 'Name must be at least 2 characters').optional(),
    address: z.string().optional(),
    phone: z.string().optional(),
    description: z.string().optional(),
    openHour: z.string().optional(),
    closeHour: z.string().optional(),
    clinicalHistoryConfig: z.object({
      antecedentesHeredofamiliares: z.boolean().optional(),
      antecedentesPersonalesPatologicos: z.boolean().optional(),
      antecedentesPersonalesNoPatologicos: z.boolean().optional(),
      ginecoObstetricos: z.boolean().optional(),
    }).optional(),
  }),
  params: z.object({
    id: objectIdSchema,
  }),
});

export const updateClinicalHistoryConfigSchema = z.object({
  body: z.object({
    antecedentesHeredofamiliares: z.boolean(),
    antecedentesPersonalesPatologicos: z.boolean(),
    antecedentesPersonalesNoPatologicos: z.boolean(),
    ginecoObstetricos: z.boolean(),
  }),
  params: z.object({
    id: objectIdSchema,
  }),
});

export const updateConsultorioBasicInfoSchema = z.object({
  body: z.object({
    name: z.string().min(2, 'Name must be at least 2 characters').optional(),
    description: z.string().optional(),
    address: z.string().optional(),
    phone: z.string().optional(),
    openHour: z.string().regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format').optional(),
    closeHour: z.string().regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format').optional(),
  }),
  params: z.object({
    id: objectIdSchema,
  }),
});

export const updateRecetaTemplateSchema = z.object({
  body: z.object({
    recetaTemplate: z.enum(['template1', 'template2', 'template3', 'template4', 'template5'], {
      errorMap: () => ({ message: 'Template must be template1, template2, template3, template4, or template5' }),
    }),
  }),
  params: z.object({
    id: objectIdSchema,
  }),
});

export const getConsultorioSchema = z.object({
  params: z.object({
    id: objectIdSchema,
  }),
});

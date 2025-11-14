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

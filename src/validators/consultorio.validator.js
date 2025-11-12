import { z } from 'zod';

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
    id: z.string().uuid('Invalid consultorio ID'),
  }),
});

export const getConsultorioSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid consultorio ID'),
  }),
});

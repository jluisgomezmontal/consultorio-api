import { z } from 'zod';

const objectIdSchema = z
  .string()
  .regex(/^[0-9a-fA-F]{24}$/u, 'Invalid ObjectId');

export const generateRecetaSchema = z.object({
  body: z.object({
    citaId: objectIdSchema,
  }),
});

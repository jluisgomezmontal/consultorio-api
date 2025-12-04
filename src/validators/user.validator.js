import { z } from 'zod';

const objectIdSchema = z
  .string()
  .regex(/^[0-9a-fA-F]{24}$/u, 'Invalid ObjectId');

export const createUserSchema = z.object({
  body: z.object({
    name: z.string().min(2, 'Name must be at least 2 characters'),
    email: z.string().email('Invalid email format'),
    role: z.enum(['admin', 'doctor', 'recepcionista'], {
      errorMap: () => ({ message: 'Role must be admin, doctor, or recepcionista' }),
    }),
    consultoriosIds: z
      .array(objectIdSchema, {
        required_error: 'At least one consultorio is required',
      })
      .min(1, 'At least one consultorio is required'),
  }),
});

export const updateUserSchema = z.object({
  body: z.object({
    name: z.string().min(2, 'Name must be at least 2 characters').optional(),
    email: z.string().email('Invalid email format').optional(),
    role: z.enum(['admin', 'doctor', 'recepcionista']).optional(),
    consultoriosIds: z
      .array(objectIdSchema)
      .min(1, 'At least one consultorio is required')
      .optional(),
  }),
  params: z.object({
    id: objectIdSchema,
  }),
});

export const getUserSchema = z.object({
  params: z.object({
    id: objectIdSchema,
  }),
});

export const updatePasswordSchema = z.object({
  body: z.object({
    password: z.string().min(6, 'Password must be at least 6 characters'),
  }),
  params: z.object({
    id: objectIdSchema,
  }),
});

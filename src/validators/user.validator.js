import { z } from 'zod';

export const createUserSchema = z.object({
  body: z.object({
    name: z.string().min(2, 'Name must be at least 2 characters'),
    email: z.string().email('Invalid email format'),
    role: z.enum(['admin', 'doctor', 'recepcionista'], {
      errorMap: () => ({ message: 'Role must be admin, doctor, or recepcionista' }),
    }),
    consultorioId: z.string().uuid('Invalid consultorio ID'),
  }),
});

export const updateUserSchema = z.object({
  body: z.object({
    name: z.string().min(2, 'Name must be at least 2 characters').optional(),
    email: z.string().email('Invalid email format').optional(),
    role: z.enum(['admin', 'doctor', 'recepcionista']).optional(),
    consultorioId: z.string().uuid('Invalid consultorio ID').optional(),
  }),
  params: z.object({
    id: z.string().uuid('Invalid user ID'),
  }),
});

export const getUserSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid user ID'),
  }),
});

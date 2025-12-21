import { z } from 'zod';

const objectIdSchema = z
  .string()
  .regex(/^[0-9a-fA-F]{24}$/u, 'Invalid ObjectId');

export const generateRecetaSchema = z.object({
  body: z.object({
    citaId: objectIdSchema,
    diagnostico: z.string().min(1, 'Diagnóstico es requerido'),
    medicamentos: z.array(z.object({
      nombre: z.string().min(1, 'Nombre del medicamento es requerido'),
      dosis: z.string().optional(),
      frecuencia: z.string().optional(),
      duracion: z.string().optional(),
      indicaciones: z.string().optional(),
    })).min(1, 'Debe incluir al menos un medicamento'),
    indicaciones: z.string().optional(),
  }),
});

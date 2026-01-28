import { z } from 'zod';

const objectIdRegex = /^[0-9a-fA-F]{24}$/;

export const suggestTreatmentSchema = z.object({
  body: z.object({
    diagnostico: z.string().min(5, 'El diagnóstico debe tener al menos 5 caracteres'),
    pacienteId: z.string().regex(objectIdRegex, 'ID de paciente inválido').optional(),
  }),
});

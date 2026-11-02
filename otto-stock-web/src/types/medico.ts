import { z } from 'zod';

export const medicoSchema = z.object({
  nome: z.string().min(3, 'O nome deve ter no mínimo 3 caracteres'),
  crm: z.string().optional(),
  especialidade: z
    .string()
    .max(80, 'A especialidade deve ter no máximo 80 caracteres')
    .optional(),
});

export type MedicoFormData = z.infer<typeof medicoSchema>;

export interface Medico {
  id: number;
  nome: string;
  crm?: string;
  especialidade?: string | null;
  ativo: boolean;
}

import { z } from 'zod';

export const pacienteSchema = z.object({
  nome: z.string().min(3, 'O nome deve ter no mínimo 3 caracteres'),
  cpf: z.string().regex(/^\d{11}$/, 'O CPF deve ter exatamente 11 dígitos numéricos'),
  dataNascimento: z.string().optional(),
  contato: z.string().optional(),
});

export type PacienteFormData = z.infer<typeof pacienteSchema>;

export interface Paciente {
  id: number;
  nome: string;
  cpf: string;
  dataNascimento?: string;
  contato?: string;
  ativo: boolean;
  createdAt: string;
}

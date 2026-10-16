import { z } from 'zod';

export const exameSchema = z.object({
  nome: z.string().min(1, 'O nome do exame é obrigatório'),
  descricao: z.string().optional(),
});

export type ExameFormData = z.infer<typeof exameSchema>;

export interface Exame {
  id: number;
  nome: string;
  descricao?: string | null;
  ativo?: boolean;
  createdAt?: string;
}

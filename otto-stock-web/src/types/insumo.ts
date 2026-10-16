import { z } from 'zod';

export const insumoSchema = z.object({
  nome: z.string().min(3, 'O nome deve ter no mínimo 3 caracteres'),
  descricao: z.string().optional(),
  quantidadeMinima: z
    .number({ message: 'Informe a quantidade mínima' })
    .min(0, 'A quantidade mínima deve ser maior ou igual a 0'),
});

export type InsumoFormData = z.infer<typeof insumoSchema>;

export interface Insumo {
  id: number;
  nome: string;
  descricao?: string | null;
  quantidadeMinima?: number;
  ativo?: boolean;
  createdAt?: string;
}

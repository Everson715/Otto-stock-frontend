import { z } from 'zod';

export const exameInsumoSchema = z.object({
  exameId: z.number({ message: 'Selecione um exame' }).min(1, 'Selecione um exame'),
  insumoId: z.number({ message: 'Selecione um insumo' }).min(1, 'Selecione um insumo'),
  quantidade: z.number({ message: 'Informe a quantidade' }).min(1, 'A quantidade deve ser maior que 0'),
});

export type ExameInsumoFormData = z.infer<typeof exameInsumoSchema>;

export interface ExameInsumo {
  id: number;
  exameId: number;
  insumoId: number;
  quantidade: number;
  exame?: {
    id: number;
    nome: string;
    descricao?: string;
  };
  insumo?: {
    id: number;
    nome: string;
    quantidadeMinima?: number;
  };
}

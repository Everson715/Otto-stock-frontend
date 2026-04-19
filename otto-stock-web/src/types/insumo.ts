import { z } from 'zod';

export const insumoSchema = z.object({
  nome: z.string().min(1, "O nome é obrigatório"),
});

export type InsumoFormData = z.infer<typeof insumoSchema>;

export interface Insumo {
  id: number;
  nome: string;
}

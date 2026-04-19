import { z } from 'zod';

export const exameSchema = z.object({
  nome: z.string().min(1, "O nome do exame é obrigatório"),
});

export type ExameFormData = z.infer<typeof exameSchema>;

export interface Exame {
  id: number;
  nome: string;
}

import { z } from 'zod';

export const atendimentoSchema = z.object({
  medicoId: z.number().min(1, "O médico é obrigatório"),
  exameId: z.number().min(1, "O exame é obrigatório"),
});

export type AtendimentoFormData = z.infer<typeof atendimentoSchema>;

export interface Atendimento {
  id: number;
  status: "PENDENTE" | "FINALIZADO" | "CANCELADO";
  medicoId: number;
  exameId: number;
  medico: {
    nome: string;
  };
  exame: {
    nome: string;
  };
  criadoEm: string;
}

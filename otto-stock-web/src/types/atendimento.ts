import { z } from 'zod';

export const atendimentoSchema = z.object({
  pacienteId: z.number({ message: 'Selecione um paciente' }).min(1, 'Selecione um paciente'),
  medicoId: z.number({ message: 'Selecione um médico' }).min(1, 'Selecione um médico'),
  exameId: z.number({ message: 'Selecione um exame' }).min(1, 'Selecione um exame'),
});

export type AtendimentoFormData = z.infer<typeof atendimentoSchema>;

export interface Atendimento {
  id: number;
  status: 'EM_ATENDIMENTO' | 'FINALIZADO' | 'CANCELADO' | 'PENDENTE';
  pacienteId: number;
  medicoId: number;
  exameId: number;
  paciente?: {
    id: number;
    nome: string;
    cpf?: string;
    dataNascimento?: string;
  };
  medico?: {
    id: number;
    nome: string;
    crm?: string;
  };
  exame?: {
    id: number;
    nome: string;
    descricao?: string;
  };
  criadoEm: string;
}

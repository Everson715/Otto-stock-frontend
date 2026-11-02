import { z } from 'zod';

export const UNIDADES_MEDIDA = [
  'UN',
  'CX',
  'AMPOLA',
  'FRASCO',
  'ML',
  'PAR',
  'PACOTE',
  'ROLO',
  'KIT',
] as const;

export type UnidadeMedida = (typeof UNIDADES_MEDIDA)[number] | 'NAO_INFORMADA';

export const UNIDADE_MEDIDA_LABELS: Record<(typeof UNIDADES_MEDIDA)[number], string> = {
  UN: 'UN (Unidade)',
  CX: 'CX (Caixa)',
  AMPOLA: 'AMPOLA (Ampola)',
  FRASCO: 'FRASCO (Frasco)',
  ML: 'ML (Mililitro)',
  PAR: 'PAR (Par)',
  PACOTE: 'PACOTE (Pacote)',
  ROLO: 'ROLO (Rolo)',
  KIT: 'KIT (Kit)',
};

export const insumoSchema = z.object({
  nome: z.string().min(3, 'O nome deve ter no mínimo 3 caracteres'),
  unidade: z.enum(UNIDADES_MEDIDA, {
    message: 'Selecione uma unidade de medida válida',
  }),
  descricao: z.string().optional(),
  quantidadeMinima: z
    .number({ message: 'Informe a quantidade mínima' })
    .min(0, 'A quantidade mínima deve ser maior ou igual a 0'),
});

export type InsumoFormData = z.infer<typeof insumoSchema>;

export interface Insumo {
  id: number;
  nome: string;
  sku?: string | null;
  unidade?: UnidadeMedida;
  categoria?: string | null;
  fabricante?: string | null;
  descricao?: string | null;
  quantidadeMinima?: number;
  ativo?: boolean;
  createdAt?: string;
}

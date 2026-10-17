import { z } from 'zod';
import type { Perfil } from './auth';

export const PERFIL_OPTIONS: { value: Perfil; label: string; description: string }[] = [
  {
    value: 'ADMIN',
    label: 'Administrador (ADMIN)',
    description: 'Acesso total ao sistema, cadastros e gestão de usuários',
  },
  {
    value: 'GESTOR',
    label: 'Gestor (GESTOR)',
    description: 'Acompanhamento de relatórios, estoque, médicos e atendimentos',
  },
  {
    value: 'ESTOQUISTA',
    label: 'Estoquista (ESTOQUISTA)',
    description: 'Controle de insumos, fichas técnicas e movimentações de estoque',
  },
  {
    value: 'ATENDENTE',
    label: 'Atendente (ATENDENTE)',
    description: 'Recepção, cadastro de pacientes e abertura de atendimentos',
  },
];

const perfilEnumSchema = z.enum(['ADMIN', 'ESTOQUISTA', 'ATENDENTE', 'GESTOR']);

export const createUsuarioSchema = z.object({
  nome: z.string().trim().min(3, 'O nome deve ter pelo menos 3 caracteres'),
  email: z.string().trim().min(1, 'O e-mail é obrigatório').email('E-mail inválido'),
  senha: z.string().min(6, 'A senha deve ter pelo menos 6 caracteres'),
  perfis: z.array(perfilEnumSchema).min(1, 'Selecione pelo menos um perfil de acesso'),
});

export const updateUsuarioSchema = z.object({
  nome: z.string().trim().min(3, 'O nome deve ter pelo menos 3 caracteres'),
  email: z.string().trim().min(1, 'O e-mail é obrigatório').email('E-mail inválido'),
  senha: z
    .string()
    .optional()
    .refine((val) => !val || val.length >= 6, {
      message: 'A nova senha deve ter pelo menos 6 caracteres',
    }),
  perfis: z.array(perfilEnumSchema).min(1, 'Selecione pelo menos um perfil de acesso'),
});

export type CreateUsuarioFormData = z.infer<typeof createUsuarioSchema>;
export type UpdateUsuarioFormData = z.infer<typeof updateUsuarioSchema>;

export interface UsuarioSistema {
  id: number;
  nome: string;
  email: string;
  perfis: Perfil[];
  perfil?: Perfil;
  ativo: boolean;
  createdAt?: string;
}

import { useState, useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useSearchParams } from 'react-router-dom';
import {
  UserPlus,
  Pencil,
  Archive,
  Eye,
  Users,
  ShieldCheck,
  Search,
  RefreshCw,
} from 'lucide-react';
import { toast } from 'sonner';

import { api } from '../api/api';
import { useAuth } from '../contexts/AuthContext';
import type { Perfil } from '../types/auth';
import {
  createUsuarioSchema,
  updateUsuarioSchema,
  PERFIL_OPTIONS,
  type CreateUsuarioFormData,
  type UpdateUsuarioFormData,
  type UsuarioSistema,
} from '../types/usuario';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Modal } from '../components/ui/Modal';
import { MetricCard } from '../components/ui/MetricCard';
import { PageHeader } from '../components/ui/PageHeader';
import { Pagination } from '../components/ui/Pagination';
import { Skeleton } from '../components/ui/Skeleton';
import { StatusBadge, type StatusBadgeVariant } from '../components/ui/StatusBadge';
import { Table, type Column } from '../components/ui/Table';

function getPerfilBadgeVariant(perfil: Perfil): StatusBadgeVariant {
  switch (perfil) {
    case 'ADMIN':
      return 'critico';
    case 'GESTOR':
      return 'info';
    case 'ESTOQUISTA':
      return 'atencao';
    case 'ATENDENTE':
    default:
      return 'conforme';
  }
}

function getPerfisArray(u: UsuarioSistema): Perfil[] {
  if (Array.isArray(u.perfis) && u.perfis.length > 0) {
    return u.perfis;
  }
  if (u.perfil) {
    return [u.perfil];
  }
  return ['ATENDENTE'];
}

export function Usuarios() {
  const { usuario: currentUser } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();

  const [usuarios, setUsuarios] = useState<UsuarioSistema[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [perfilFilter, setPerfilFilter] = useState<string>('TODOS');
  const [page, setPage] = useState(1);
  const pageSize = 8;

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedUsuario, setSelectedUsuario] = useState<UsuarioSistema | null>(null);
  const [usuarioParaDesativar, setUsuarioParaDesativar] = useState<UsuarioSistema | null>(null);
  const [isDeactivating, setIsDeactivating] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<CreateUsuarioFormData | UpdateUsuarioFormData>({
    resolver: zodResolver(isEditMode ? updateUsuarioSchema : createUsuarioSchema),
    defaultValues: {
      nome: '',
      email: '',
      senha: '',
      perfis: ['ATENDENTE'],
    },
  });

  const selectedPerfis = watch('perfis') || [];

  async function carregarUsuarios() {
    setIsLoading(true);
    try {
      const response = await api.get('/usuarios');
      const data: UsuarioSistema[] = Array.isArray(response.data)
        ? response.data
        : response.data?.items || [];
      setUsuarios(data);
    } catch (err: unknown) {
      let msg = 'Erro ao carregar usuários do sistema';
      if (err && typeof err === 'object' && 'response' in err) {
        const axErr = err as { response?: { data?: { message?: string; error?: string } } };
        msg = axErr.response?.data?.message || axErr.response?.data?.error || msg;
      }
      toast.error(msg);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    carregarUsuarios();
  }, []);

  useEffect(() => {
    if (searchParams.get('novo') === '1') {
      handleNovo();
      searchParams.delete('novo');
      setSearchParams(searchParams, { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  const filteredUsuarios = useMemo(() => {
    const term = searchTerm.toLowerCase().trim();
    return usuarios.filter((u) => {
      const perfis = getPerfisArray(u);
      const matchesSearch =
        !term ||
        u.nome.toLowerCase().includes(term) ||
        u.email.toLowerCase().includes(term) ||
        perfis.some((p) => p.toLowerCase().includes(term));

      const matchesPerfil =
        perfilFilter === 'TODOS' || perfis.includes(perfilFilter as Perfil);

      return matchesSearch && matchesPerfil;
    });
  }, [usuarios, searchTerm, perfilFilter]);

  const totalPages = Math.ceil(filteredUsuarios.length / pageSize) || 1;
  const paginatedUsuarios = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredUsuarios.slice(start, start + pageSize);
  }, [filteredUsuarios, page, pageSize]);

  const totalAdmins = useMemo(
    () => usuarios.filter((u) => getPerfisArray(u).includes('ADMIN')).length,
    [usuarios]
  );

  function handleNovo() {
    setIsEditMode(false);
    setSelectedUsuario(null);
    reset({
      nome: '',
      email: '',
      senha: '',
      perfis: ['ATENDENTE'],
    });
    setIsModalOpen(true);
  }

  function handleEditar(usuario: UsuarioSistema) {
    setIsEditMode(true);
    setSelectedUsuario(usuario);
    reset({
      nome: usuario.nome,
      email: usuario.email,
      senha: '',
      perfis: getPerfisArray(usuario),
    });
    setIsModalOpen(true);
  }

  function handleVerDetalhes(usuario: UsuarioSistema) {
    setSelectedUsuario(usuario);
    setIsDetailsOpen(true);
  }

  function togglePerfil(perfil: Perfil) {
    const current = Array.isArray(selectedPerfis) ? [...selectedPerfis] : [];
    const exists = current.includes(perfil);
    const updated = exists
      ? current.filter((p) => p !== perfil)
      : [...current, perfil];

    setValue('perfis', updated, { shouldValidate: true, shouldDirty: true });
  }

  async function onSubmit(data: CreateUsuarioFormData | UpdateUsuarioFormData) {
    try {
      const perfisUnicos = Array.from(new Set(data.perfis));

      if (isEditMode && selectedUsuario) {
        const updatePayload: Record<string, unknown> = {
          nome: data.nome.trim(),
          email: data.email.trim(),
          perfis: perfisUnicos,
        };
        if (data.senha && data.senha.trim().length > 0) {
          updatePayload.senha = data.senha;
        }

        await api.put(`/usuarios/${selectedUsuario.id}`, updatePayload);
        toast.success('Registro de usuário atualizado com sucesso!');
      } else {
        await api.post('/usuarios', {
          nome: data.nome.trim(),
          email: data.email.trim(),
          senha: data.senha,
          perfis: perfisUnicos,
        });
        toast.success('Novo usuário registrado com sucesso!');
      }

      setIsModalOpen(false);
      reset();
      carregarUsuarios();
    } catch (err: unknown) {
      let msg = isEditMode
        ? 'Erro ao atualizar registro do usuário'
        : 'Erro ao registrar novo usuário';
      if (err && typeof err === 'object' && 'response' in err) {
        const axErr = err as {
          response?: {
            status?: number;
            data?: {
              message?: string;
              error?: string;
              details?: { path?: string; message?: string }[];
            };
          };
        };
        if (axErr.response?.status === 409) {
          msg = 'Este endereço de e-mail já está cadastrado para outro usuário.';
        } else if (
          Array.isArray(axErr.response?.data?.details) &&
          axErr.response!.data!.details.length > 0
        ) {
          msg = axErr.response!.data!.details.map((d) => d.message).join(', ');
        } else if (axErr.response?.data?.message) {
          msg = axErr.response.data.message;
        } else if (typeof axErr.response?.data?.error === 'string') {
          msg = axErr.response.data.error;
        }
      }
      toast.error(msg);
    }
  }

  async function confirmarDesativacao() {
    if (!usuarioParaDesativar) return;
    setIsDeactivating(true);
    try {
      await api.delete(`/usuarios/${usuarioParaDesativar.id}`);
      toast.success('Usuário desativado com sucesso');
      setUsuarioParaDesativar(null);
      carregarUsuarios();
    } catch (err: unknown) {
      let msg = 'Erro ao desativar usuário';
      if (err && typeof err === 'object' && 'response' in err) {
        const axErr = err as { response?: { data?: { message?: string; error?: string } } };
        msg = axErr.response?.data?.message || axErr.response?.data?.error || msg;
      }
      toast.error(msg);
    } finally {
      setIsDeactivating(false);
    }
  }

  const columns: Column<UsuarioSistema>[] = [
    {
      header: 'ID',
      accessor: (u) => (
        <span className="font-data-mono text-label-md text-outline">#{u.id}</span>
      ),
    },
    {
      header: 'Usuário',
      accessor: (u) => (
        <div className="flex flex-col">
          <div className="flex items-center gap-1.5">
            <span className="font-semibold text-on-surface">{u.nome}</span>
            {currentUser?.id === u.id && (
              <span className="px-1.5 py-0.5 rounded bg-surface-container-high text-primary font-label-sm text-[10px] font-bold uppercase">
                Você
              </span>
            )}
          </div>
          <span className="text-body-sm text-outline">{u.email}</span>
        </div>
      ),
    },
    {
      header: 'Perfis de Acesso',
      accessor: (u) => {
        const perfis = getPerfisArray(u);
        return (
          <div className="flex flex-wrap items-center gap-1.5">
            {perfis.map((p) => (
              <StatusBadge
                key={p}
                variant={getPerfilBadgeVariant(p)}
                label={p}
              />
            ))}
          </div>
        );
      },
    },
    {
      header: 'Status',
      accessor: (u) =>
        u.ativo !== false ? (
          <StatusBadge variant="conforme" label="Ativo" />
        ) : (
          <StatusBadge variant="neutro" label="Inativo" />
        ),
    },
    {
      header: 'Criado em',
      accessor: (u) => (
        <span className="font-data-mono text-body-sm text-on-surface-variant">
          {u.createdAt ? new Date(u.createdAt).toLocaleDateString('pt-BR') : '—'}
        </span>
      ),
    },
    {
      header: 'Ações',
      align: 'right',
      accessor: (u) => (
        <div className="flex items-center justify-end gap-1.5">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleVerDetalhes(u)}
            title="Ver detalhes"
          >
            <Eye size={15} />
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => handleEditar(u)}
            title="Editar registro e perfis"
          >
            <Pencil size={15} />
          </Button>
          <Button
            variant="danger"
            size="sm"
            onClick={() => setUsuarioParaDesativar(u)}
            disabled={currentUser?.id === u.id}
            title={
              currentUser?.id === u.id
                ? 'Não é permitido desativar a própria conta ativa'
                : 'Desativar usuário'
            }
          >
            <Archive size={15} />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="w-full max-w-[1600px] mx-auto px-gutter lg:px-margin-desktop py-space-lg flex flex-col gap-space-lg">
      <PageHeader
        breadcrumbs={[
          { label: 'Início', to: '/' },
          { label: 'Cadastros' },
          { label: 'Registro de Usuários' },
        ]}
        titulo="Registro e Gestão de Usuários"
        subtitulo="Área restrita ao Administrador do Sistema para criação de novas contas e atribuição de perfis de acesso (RBAC)."
        acoes={
          <>
            <Button
              variant="secondary"
              onClick={carregarUsuarios}
              disabled={isLoading}
              leftIcon={
                <RefreshCw size={16} className={isLoading ? 'animate-spin' : ''} />
              }
            >
              Atualizar
            </Button>
            <Button onClick={handleNovo} leftIcon={<UserPlus size={16} />}>
              Registrar Usuário
            </Button>
          </>
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-space-md">
        <MetricCard
          titulo="Usuários Ativos"
          valor={usuarios.length}
          tom="primary"
          icone={<Users size={20} />}
          loading={isLoading}
          detalhe="Contas habilitadas para login no sistema"
        />
        <MetricCard
          titulo="Administradores (ADMIN)"
          valor={totalAdmins}
          tom="secondary"
          icone={<ShieldCheck size={20} />}
          loading={isLoading}
          detalhe="Contas com permissão administrativa total"
        />
      </div>

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-space-md bg-surface-container-lowest p-space-md rounded-xl border border-outline-variant/40">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-space-sm w-full md:max-w-2xl">
          <div className="flex-1">
            <Input
              placeholder="Buscar por nome, e-mail ou perfil..."
              leftIcon={<Search size={16} />}
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setPage(1);
              }}
            />
          </div>
          <div className="flex items-center gap-1 flex-wrap">
            {(['TODOS', 'ADMIN', 'GESTOR', 'ESTOQUISTA', 'ATENDENTE'] as const).map(
              (filtro) => (
                <button
                  key={filtro}
                  type="button"
                  onClick={() => {
                    setPerfilFilter(filtro);
                    setPage(1);
                  }}
                  className={`px-2.5 py-1.5 rounded-lg font-label-sm text-label-sm transition-colors cursor-pointer ${
                    perfilFilter === filtro
                      ? 'bg-primary text-on-primary font-semibold'
                      : 'bg-surface-container text-on-surface-variant hover:bg-surface-container-high'
                  }`}
                >
                  {filtro === 'TODOS' ? 'Todos' : filtro}
                </button>
              )
            )}
          </div>
        </div>
        <span className="text-body-sm text-outline shrink-0">
          Total de registros:{' '}
          <strong className="font-data-mono text-on-surface">
            {filteredUsuarios.length}
          </strong>
        </span>
      </div>

      {isLoading ? (
        <div className="flex flex-col gap-2 bg-surface-container-lowest p-space-lg rounded-xl border border-outline-variant/40">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
        </div>
      ) : (
        <>
          <Table
            columns={columns}
            data={paginatedUsuarios}
            keyExtractor={(item) => item.id}
            emptyMessage="Nenhum usuário encontrado. Clique em 'Registrar Usuário' para criar uma nova conta."
          />

          <Pagination
            page={page}
            totalPages={totalPages}
            total={filteredUsuarios.length}
            isLoading={isLoading}
            onPageChange={setPage}
            itemLabel="usuários"
          />
        </>
      )}

      {/* Modal de Registro / Edição de Usuário */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={isEditMode ? 'Editar Registro de Usuário' : 'Registrar Novo Usuário'}
        subtitle={
          isEditMode
            ? 'Atualize os dados cadastrais, senha ou perfis de permissão deste usuário.'
            : 'Preencha os dados abaixo para criar uma nova conta de acesso ao sistema.'
        }
      >
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-space-md">
          <Input
            label="Nome Completo *"
            placeholder="Ex: Carlos Estoquista"
            disabled={isSubmitting}
            error={errors.nome?.message}
            {...register('nome')}
          />

          <Input
            label="E-mail de Acesso *"
            type="email"
            placeholder="Ex: carlos@clinica.com"
            autoComplete="off"
            disabled={isSubmitting}
            error={errors.email?.message}
            {...register('email')}
          />

          <Input
            label={isEditMode ? 'Nova Senha (opcional)' : 'Senha Inicial *'}
            type="password"
            placeholder={
              isEditMode
                ? 'Deixe em branco para manter a senha atual'
                : 'Mínimo de 6 caracteres'
            }
            autoComplete="new-password"
            disabled={isSubmitting}
            error={errors.senha?.message}
            {...register('senha')}
          />

          <div className="flex flex-col gap-1.5 text-left">
            <span className="text-label-md font-medium text-on-surface">
              Perfis de Acesso (RBAC) *
            </span>
            <p className="text-body-sm text-outline m-0">
              Selecione um ou mais perfis de permissão para este usuário:
            </p>
            <div className="grid grid-cols-1 gap-2 mt-1">
              {PERFIL_OPTIONS.map((option) => {
                const isChecked = selectedPerfis.includes(option.value);
                return (
                  <label
                    key={option.value}
                    className={`flex items-start gap-3 p-3 rounded-lg border transition-colors cursor-pointer ${
                      isChecked
                        ? 'border-primary bg-primary-fixed/20'
                        : 'border-outline-variant/60 bg-surface-container-lowest hover:bg-surface-container-low'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => togglePerfil(option.value)}
                      disabled={isSubmitting}
                      className="mt-0.5 h-4 w-4 rounded border-outline-variant text-primary focus:ring-primary cursor-pointer"
                    />
                    <div className="flex flex-col">
                      <span className="text-label-md font-semibold text-on-surface leading-tight">
                        {option.label}
                      </span>
                      <span className="text-body-sm text-outline leading-snug mt-0.5">
                        {option.description}
                      </span>
                    </div>
                  </label>
                );
              })}
            </div>
            {errors.perfis?.message && (
              <span className="text-body-sm text-error font-medium">
                {errors.perfis.message}
              </span>
            )}
          </div>

          <div className="flex justify-end gap-space-sm pt-2">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setIsModalOpen(false)}
              disabled={isSubmitting}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              isLoading={isSubmitting}
              leftIcon={<UserPlus size={16} />}
            >
              {isEditMode ? 'Salvar Alterações' : 'Criar Registro'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal Detalhes do Usuário */}
      <Modal
        isOpen={isDetailsOpen}
        onClose={() => setIsDetailsOpen(false)}
        title="Detalhes do Usuário"
      >
        {selectedUsuario && (
          <div className="flex flex-col gap-space-md text-left">
            <div>
              <span className="text-label-sm uppercase tracking-wider text-outline block">
                ID do Usuário
              </span>
              <span className="font-data-mono text-body-md text-on-surface">
                #{selectedUsuario.id}
              </span>
            </div>
            <div>
              <span className="text-label-sm uppercase tracking-wider text-outline block">
                Nome Completo
              </span>
              <strong className="text-body-lg text-on-surface">
                {selectedUsuario.nome}
              </strong>
            </div>
            <div>
              <span className="text-label-sm uppercase tracking-wider text-outline block">
                E-mail
              </span>
              <span className="text-body-md text-on-surface">
                {selectedUsuario.email}
              </span>
            </div>
            <div>
              <span className="text-label-sm uppercase tracking-wider text-outline block mb-1.5">
                Perfis de Acesso
              </span>
              <div className="flex flex-wrap gap-1.5">
                {getPerfisArray(selectedUsuario).map((p) => (
                  <StatusBadge
                    key={p}
                    variant={getPerfilBadgeVariant(p)}
                    label={p}
                  />
                ))}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-space-md">
              <div>
                <span className="text-label-sm uppercase tracking-wider text-outline block mb-1">
                  Status
                </span>
                {selectedUsuario.ativo !== false ? (
                  <StatusBadge variant="conforme" label="Ativo" />
                ) : (
                  <StatusBadge variant="neutro" label="Inativo" />
                )}
              </div>
              <div>
                <span className="text-label-sm uppercase tracking-wider text-outline block">
                  Data de Registro
                </span>
                <span className="font-data-mono text-body-md text-on-surface">
                  {selectedUsuario.createdAt
                    ? new Date(selectedUsuario.createdAt).toLocaleString('pt-BR')
                    : '—'}
                </span>
              </div>
            </div>
            <div className="flex justify-end pt-2">
              <Button variant="secondary" onClick={() => setIsDetailsOpen(false)}>
                Fechar
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Modal Confirmar Desativação */}
      <Modal
        isOpen={Boolean(usuarioParaDesativar)}
        onClose={() => setUsuarioParaDesativar(null)}
        title="Desativar Usuário"
      >
        {usuarioParaDesativar && (
          <div className="flex flex-col gap-space-md">
            <p className="text-body-md text-on-surface-variant">
              Deseja desativar o acesso do usuário{' '}
              <strong className="text-on-surface">{usuarioParaDesativar.nome}</strong> (
              <span className="font-data-mono">{usuarioParaDesativar.email}</span>)? O
              usuário não poderá mais realizar login no sistema.
            </p>
            <div className="flex justify-end gap-space-sm pt-2">
              <Button
                variant="secondary"
                onClick={() => setUsuarioParaDesativar(null)}
                disabled={isDeactivating}
              >
                Cancelar
              </Button>
              <Button
                variant="danger"
                onClick={confirmarDesativacao}
                isLoading={isDeactivating}
                leftIcon={<Archive size={16} />}
              >
                Desativar Acesso
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

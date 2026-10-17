import { useState, useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Plus,
  Pencil,
  Archive,
  Eye,
  UserCheck,
  Search,
  RefreshCw,
} from 'lucide-react';
import { toast } from 'sonner';

import { api } from '../api/api';
import { pacienteSchema } from '../types/paciente';
import type { Paciente, PacienteFormData } from '../types/paciente';
import { calcularIdade } from '../utils/format';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Modal } from '../components/ui/Modal';
import { PageHeader } from '../components/ui/PageHeader';
import { Pagination } from '../components/ui/Pagination';
import { Skeleton } from '../components/ui/Skeleton';
import { StatusBadge } from '../components/ui/StatusBadge';
import { Table, type Column } from '../components/ui/Table';

export function Pacientes() {
  const [pacientes, setPacientes] = useState<Paciente[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const pageSize = 8;

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedPaciente, setSelectedPaciente] = useState<Paciente | null>(null);
  const [pacienteParaDesativar, setPacienteParaDesativar] = useState<Paciente | null>(null);
  const [isDeactivating, setIsDeactivating] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<PacienteFormData>({
    resolver: zodResolver(pacienteSchema),
  });

  async function carregarPacientes() {
    setIsLoading(true);
    try {
      const response = await api.get('/pacientes');
      const data = Array.isArray(response.data) ? response.data : response.data.items || [];
      setPacientes(data);
    } catch {
      toast.error('Erro ao carregar pacientes');
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    carregarPacientes();
  }, []);

  const filteredPacientes = useMemo(() => {
    const term = searchTerm.toLowerCase().trim();
    if (!term) return pacientes;
    return pacientes.filter(
      (p) => p.nome.toLowerCase().includes(term) || (p.cpf && p.cpf.includes(term))
    );
  }, [pacientes, searchTerm]);

  const totalPages = Math.ceil(filteredPacientes.length / pageSize) || 1;
  const paginatedPacientes = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredPacientes.slice(start, start + pageSize);
  }, [filteredPacientes, page, pageSize]);

  function handleNovo() {
    setIsEditMode(false);
    setSelectedPaciente(null);
    reset({ nome: '', cpf: '', dataNascimento: '', contato: '' });
    setIsModalOpen(true);
  }

  function handleEditar(paciente: Paciente) {
    setIsEditMode(true);
    setSelectedPaciente(paciente);
    setValue('nome', paciente.nome);
    setValue('cpf', paciente.cpf);
    setValue('dataNascimento', paciente.dataNascimento ? paciente.dataNascimento.slice(0, 10) : '');
    setValue('contato', paciente.contato || '');
    setIsModalOpen(true);
  }

  function handleVerDetalhes(paciente: Paciente) {
    setSelectedPaciente(paciente);
    setIsDetailsOpen(true);
  }

  async function onSubmit(data: PacienteFormData) {
    try {
      const payload: Record<string, string | undefined> = {
        nome: data.nome.trim(),
        cpf: data.cpf.trim(),
      };
      if (data.dataNascimento) {
        payload.dataNascimento = new Date(data.dataNascimento).toISOString();
      }
      if (data.contato) {
        payload.contato = data.contato.trim();
      }

      if (isEditMode && selectedPaciente) {
        await api.put(`/pacientes/${selectedPaciente.id}`, payload);
        toast.success('Paciente atualizado com sucesso');
      } else {
        await api.post('/pacientes', payload);
        toast.success('Paciente cadastrado com sucesso');
      }
      setIsModalOpen(false);
      reset();
      carregarPacientes();
    } catch (err: unknown) {
      let msg = 'Erro ao salvar paciente';
      if (err && typeof err === 'object' && 'response' in err) {
        const axErr = err as { response?: { data?: { message?: string; error?: string } } };
        msg = axErr.response?.data?.message || axErr.response?.data?.error || msg;
      }
      toast.error(msg);
    }
  }

  async function confirmarDesativacao() {
    if (!pacienteParaDesativar) return;
    setIsDeactivating(true);
    try {
      await api.delete(`/pacientes/${pacienteParaDesativar.id}`);
      toast.success('Paciente desativado com sucesso');
      setPacienteParaDesativar(null);
      carregarPacientes();
    } catch {
      toast.error('Erro ao desativar paciente');
    } finally {
      setIsDeactivating(false);
    }
  }

  const columns: Column<Paciente>[] = [
    {
      header: 'ID',
      accessor: (p) => (
        <span className="font-data-mono text-label-md text-outline">#{p.id}</span>
      ),
    },
    {
      header: 'Nome',
      accessor: (p) => {
        const idade = calcularIdade(p.dataNascimento);
        return (
          <div className="flex flex-col">
            <span className="font-semibold text-on-surface">{p.nome}</span>
            {idade !== null && (
              <span className="text-body-sm text-outline">{idade} anos</span>
            )}
          </div>
        );
      },
    },
    {
      header: 'CPF',
      accessor: (p) => (
        <span className="font-data-mono text-body-md text-on-surface-variant">
          {p.cpf}
        </span>
      ),
    },
    {
      header: 'Contato',
      accessor: (p) => (
        <span className="text-body-md text-on-surface-variant">
          {p.contato || '—'}
        </span>
      ),
    },
    {
      header: 'Ações',
      align: 'right',
      accessor: (p) => (
        <div className="flex items-center justify-end gap-1.5">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleVerDetalhes(p)}
            title="Ver detalhes"
          >
            <Eye size={15} />
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => handleEditar(p)}
            title="Editar"
          >
            <Pencil size={15} />
          </Button>
          <Button
            variant="danger"
            size="sm"
            onClick={() => setPacienteParaDesativar(p)}
            title="Desativar"
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
          { label: 'Pacientes' },
        ]}
        titulo="Pacientes"
        subtitulo="Gestão e cadastro de pacientes atendidos na clínica."
        acoes={
          <>
            <Button
              variant="secondary"
              onClick={carregarPacientes}
              disabled={isLoading}
              leftIcon={
                <RefreshCw size={16} className={isLoading ? 'animate-spin' : ''} />
              }
            >
              Atualizar
            </Button>
            <Button onClick={handleNovo} leftIcon={<Plus size={16} />}>
              Novo Paciente
            </Button>
          </>
        }
      />

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-space-md bg-surface-container-lowest p-space-md rounded-xl border border-outline-variant/40">
        <div className="w-full sm:max-w-sm">
          <Input
            placeholder="Buscar por nome ou CPF..."
            leftIcon={<Search size={16} />}
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setPage(1);
            }}
          />
        </div>
        <span className="text-body-sm text-outline">
          Total de registros:{' '}
          <strong className="font-data-mono text-on-surface">
            {filteredPacientes.length}
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
            data={paginatedPacientes}
            keyExtractor={(item) => item.id}
            emptyMessage="Nenhum paciente cadastrado. Clique em 'Novo Paciente' para iniciar o cadastro."
          />

          <Pagination
            page={page}
            totalPages={totalPages}
            total={filteredPacientes.length}
            isLoading={isLoading}
            onPageChange={setPage}
            itemLabel="pacientes"
          />
        </>
      )}

      {/* Modal Cadastro/Edição */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={isEditMode ? 'Editar Paciente' : 'Novo Paciente'}
      >
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-space-md">
          <Input
            label="Nome Completo *"
            placeholder="Ex: Maria de Souza"
            error={errors.nome?.message}
            {...register('nome')}
          />

          <Input
            label="CPF (11 dígitos numéricos) *"
            placeholder="Ex: 12345678901"
            maxLength={11}
            error={errors.cpf?.message}
            {...register('cpf')}
          />

          <Input
            label="Data de Nascimento"
            type="date"
            error={errors.dataNascimento?.message}
            {...register('dataNascimento')}
          />

          <Input
            label="Contato / Telefone"
            placeholder="Ex: (11) 98765-4321"
            error={errors.contato?.message}
            {...register('contato')}
          />

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
              leftIcon={<UserCheck size={16} />}
            >
              {isEditMode ? 'Salvar Alterações' : 'Cadastrar'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal Detalhes */}
      <Modal
        isOpen={isDetailsOpen}
        onClose={() => setIsDetailsOpen(false)}
        title="Detalhes do Paciente"
      >
        {selectedPaciente && (
          <div className="flex flex-col gap-space-md text-left">
            <div>
              <span className="text-label-sm uppercase tracking-wider text-outline block">
                Nome
              </span>
              <strong className="text-body-lg text-on-surface">
                {selectedPaciente.nome}
              </strong>
            </div>
            <div>
              <span className="text-label-sm uppercase tracking-wider text-outline block">
                CPF
              </span>
              <span className="font-data-mono text-body-md text-on-surface">
                {selectedPaciente.cpf}
              </span>
            </div>
            <div>
              <span className="text-label-sm uppercase tracking-wider text-outline block">
                Contato
              </span>
              <span className="text-body-md text-on-surface">
                {selectedPaciente.contato || 'Não informado'}
              </span>
            </div>
            <div>
              <span className="text-label-sm uppercase tracking-wider text-outline block">
                Data de Nascimento
              </span>
              <span className="text-body-md text-on-surface">
                {selectedPaciente.dataNascimento
                  ? new Date(selectedPaciente.dataNascimento).toLocaleDateString('pt-BR')
                  : 'Não informada'}
              </span>
            </div>
            <div>
              <span className="text-label-sm uppercase tracking-wider text-outline block mb-1">
                Status
              </span>
              {selectedPaciente.ativo ? (
                <StatusBadge variant="conforme" label="Ativo" />
              ) : (
                <StatusBadge variant="neutro" label="Inativo" />
              )}
            </div>
            <div className="flex justify-end pt-2">
              <Button variant="secondary" onClick={() => setIsDetailsOpen(false)}>
                Fechar
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Modal Desativar */}
      <Modal
        isOpen={Boolean(pacienteParaDesativar)}
        onClose={() => setPacienteParaDesativar(null)}
        title="Desativar Paciente"
      >
        {pacienteParaDesativar && (
          <div className="flex flex-col gap-space-md">
            <p className="text-body-md text-on-surface-variant">
              Deseja desativar o cadastro de{' '}
              <strong className="text-on-surface">{pacienteParaDesativar.nome}</strong>?
              O histórico de atendimentos deste paciente será preservado.
            </p>
            <div className="flex justify-end gap-space-sm pt-2">
              <Button
                variant="secondary"
                onClick={() => setPacienteParaDesativar(null)}
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
                Desativar
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

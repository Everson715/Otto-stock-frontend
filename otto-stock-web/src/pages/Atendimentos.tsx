import { useEffect, useState, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import {
  Plus,
  CheckCircle,
  XCircle,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Loader2,
} from 'lucide-react';

import { api } from '../api/api';
import { Button } from '../components/ui/Button';
import { Table } from '../components/ui/Table';
import { Modal } from '../components/ui/Modal';
import { Select } from '../components/ui/Select';
import { Input } from '../components/ui/Input';

const atendimentoFormSchema = z.object({
  pacienteId: z.number({ message: 'Selecione um paciente' }).min(1, 'Selecione um paciente'),
  medicoId: z.number({ message: 'Selecione um médico' }).min(1, 'Selecione um médico'),
  exameId: z.number({ message: 'Selecione um exame' }).min(1, 'Selecione um exame'),
});

type AtendimentoFormDataLocal = z.infer<typeof atendimentoFormSchema>;

interface AtendimentoItem {
  id: number;
  status: 'EM_ATENDIMENTO' | 'FINALIZADO' | 'CANCELADO' | string;
  pacienteId: number;
  medicoId: number;
  exameId: number;
  paciente?: {
    id: number;
    nome: string;
    cpf?: string;
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

export function Atendimentos() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [atendimentos, setAtendimentos] = useState<AtendimentoItem[]>([]);
  const [pacientes, setPacientes] = useState<{ id: number; nome: string; cpf?: string }[]>([]);
  const [medicos, setMedicos] = useState<{ id: number; nome: string }[]>([]);
  const [exames, setExames] = useState<{ id: number; nome: string }[]>([]);

  const [isLoading, setIsLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [confirmAction, setConfirmAction] = useState<{ type: 'finalizar' | 'cancelar'; id: number } | null>(null);
  const [isProcessingAction, setIsProcessingAction] = useState(false);

  // Filtros e Paginação
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [page, setPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [totalCount, setTotalCount] = useState<number>(0);
  const limit = 8;

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<AtendimentoFormDataLocal>({
    resolver: zodResolver(atendimentoFormSchema),
  });

  async function carregarAtendimentos() {
    setIsLoading(true);
    try {
      const params: Record<string, string | number> = {
        page,
        limit,
      };
      if (statusFilter) {
        params.status = statusFilter;
      }

      const response = await api.get('/atendimentos', { params });
      const items: AtendimentoItem[] = response.data?.items ?? (Array.isArray(response.data) ? response.data : []);
      const total = response.data?.total ?? items.length;
      const pages = response.data?.totalPages ?? (Math.ceil(total / limit) || 1);

      setAtendimentos(items);
      setTotalCount(total);
      setTotalPages(pages);
    } catch {
      toast.error('Erro ao carregar atendimentos');
    } finally {
      setIsLoading(false);
    }
  }

  async function carregarDadosForm() {
    try {
      const [resPacientes, resMedicos, resExames] = await Promise.all([
        api.get('/pacientes'),
        api.get('/medicos'),
        api.get('/exames'),
      ]);
      setPacientes(Array.isArray(resPacientes.data) ? resPacientes.data : resPacientes.data.items || []);
      setMedicos(Array.isArray(resMedicos.data) ? resMedicos.data : resMedicos.data.items || []);
      setExames(Array.isArray(resExames.data) ? resExames.data : resExames.data.items || []);
    } catch {
      toast.error('Erro ao carregar opções para o atendimento');
    }
  }

  useEffect(() => {
    carregarAtendimentos();
  }, [page, statusFilter]);

  useEffect(() => {
    carregarDadosForm();
  }, []);

  useEffect(() => {
    if (searchParams.get('novo') === '1') {
      reset();
      setIsModalOpen(true);
      const nextParams = new URLSearchParams(searchParams);
      nextParams.delete('novo');
      setSearchParams(nextParams, { replace: true });
    }
  }, [searchParams, setSearchParams, reset]);

  const filteredAtendimentos = useMemo(() => {
    const term = searchTerm.toLowerCase().trim();
    if (!term) return atendimentos;
    return atendimentos.filter((a) => {
      const pacNome = a.paciente?.nome?.toLowerCase() || '';
      const medNome = a.medico?.nome?.toLowerCase() || '';
      const exaNome = a.exame?.nome?.toLowerCase() || '';
      return pacNome.includes(term) || medNome.includes(term) || exaNome.includes(term);
    });
  }, [atendimentos, searchTerm]);

  async function onSubmit(data: AtendimentoFormDataLocal) {
    try {
      await api.post('/atendimentos', {
        pacienteId: Number(data.pacienteId),
        medicoId: Number(data.medicoId),
        exameId: Number(data.exameId),
      });
      toast.success('Atendimento aberto com sucesso');
      setIsModalOpen(false);
      reset();
      carregarAtendimentos();
    } catch (err: unknown) {
      let msg = 'Erro ao registrar atendimento';
      if (err && typeof err === 'object' && 'response' in err) {
        const axErr = err as { response?: { data?: { message?: string; error?: string } } };
        msg = axErr.response?.data?.message || axErr.response?.data?.error || msg;
      }
      toast.error(msg);
    }
  }

  async function handleConfirmarAcao() {
    if (!confirmAction) return;
    setIsProcessingAction(true);
    try {
      if (confirmAction.type === 'finalizar') {
        await api.patch(`/atendimentos/${confirmAction.id}/finalizar`);
        toast.success(`Atendimento #${confirmAction.id} finalizado e insumos baixados no estoque`);
      } else {
        await api.patch(`/atendimentos/${confirmAction.id}/cancelar`);
        toast.success(`Atendimento #${confirmAction.id} cancelado com sucesso`);
      }
      setConfirmAction(null);
      carregarAtendimentos();
    } catch (err: unknown) {
      let msg = `Erro ao ${confirmAction.type} atendimento`;
      if (err && typeof err === 'object' && 'response' in err) {
        const axErr = err as { response?: { data?: { message?: string; error?: string } } };
        msg = axErr.response?.data?.message || axErr.response?.data?.error || msg;
      }
      toast.error(msg);
    } finally {
      setIsProcessingAction(false);
    }
  }

  const columns = [
    { header: 'ID', accessor: 'id' as keyof AtendimentoItem },
    {
      header: 'Paciente',
      accessor: (a: AtendimentoItem) => (
        <div>
          <strong>{a.paciente?.nome || `Paciente #${a.pacienteId}`}</strong>
          {a.paciente?.cpf && <span className="text-xs text-gray-500 block">CPF: {a.paciente.cpf}</span>}
        </div>
      ),
    },
    {
      header: 'Médico',
      accessor: (a: AtendimentoItem) => a.medico?.nome || `Médico #${a.medicoId}`,
    },
    {
      header: 'Exame',
      accessor: (a: AtendimentoItem) => a.exame?.nome || `Exame #${a.exameId}`,
    },
    {
      header: 'Data / Hora',
      accessor: (a: AtendimentoItem) => (
        <span className="text-xs text-gray-500">
          {a.criadoEm ? new Date(a.criadoEm).toLocaleString('pt-BR') : '-'}
        </span>
      ),
    },
    {
      header: 'Status',
      accessor: (a: AtendimentoItem) => {
        const s = a.status.toUpperCase();
        let badgeClass = 'status-badge status-pendente';
        let label = 'Em Atendimento';

        if (s === 'FINALIZADO') {
          badgeClass = 'status-badge status-finalizado';
          label = 'Finalizado';
        } else if (s === 'CANCELADO') {
          badgeClass = 'status-badge status-cancelado';
          label = 'Cancelado';
        } else if (s === 'PENDENTE' || s === 'EM_ATENDIMENTO') {
          badgeClass = 'status-badge status-pendente';
          label = 'Em Atendimento';
        }

        return <span className={badgeClass}>{label}</span>;
      },
    },
    {
      header: 'Ações',
      accessor: (a: AtendimentoItem) => {
        const podeModificar = a.status === 'EM_ATENDIMENTO' || a.status === 'PENDENTE';
        return (
          <div className="flex gap-2">
            {podeModificar ? (
              <>
                <Button
                  variant="primary"
                  onClick={() => setConfirmAction({ type: 'finalizar', id: a.id })}
                  title="Finalizar atendimento e baixar estoque"
                >
                  <CheckCircle className="size-4" />
                </Button>
                <Button
                  variant="danger"
                  onClick={() => setConfirmAction({ type: 'cancelar', id: a.id })}
                  title="Cancelar atendimento"
                >
                  <XCircle className="size-4" />
                </Button>
              </>
            ) : (
              <span className="text-xs text-gray-400 italic">Concluído</span>
            )}
          </div>
        );
      },
    },
  ];

  return (
    <div className="flex flex-col gap-4 p-4 text-left">
      <div className="flex justify-between items-center flex-wrap gap-2">
        <div>
          <h2>Atendimentos Clínicos</h2>
          <p className="text-sm text-gray-500">
            Registro de exames, acompanhamento e baixa automática de insumos
          </p>
        </div>
        <Button
          onClick={() => {
            reset();
            setIsModalOpen(true);
          }}
          leftIcon={<Plus className="size-4" />}
        >
          Novo Atendimento
        </Button>
      </div>

      {/* Barra de Filtros e Busca */}
      <div className="flex justify-between items-center flex-wrap gap-2 mt-2">
        <div className="flex gap-2 items-center flex-wrap" style={{ flex: 1 }}>
          <div className="search-input-wrapper">
            <Input
              placeholder="Buscar por paciente, médico ou exame..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div style={{ minWidth: 200 }}>
            <Select
              options={[
                { label: 'Em Atendimento (Pendente)', value: 'EM_ATENDIMENTO' },
                { label: 'Finalizado', value: 'FINALIZADO' },
                { label: 'Cancelado', value: 'CANCELADO' },
              ]}
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
            />
          </div>
        </div>

        <span className="text-sm text-gray-500">
          Total de registros: {totalCount}
        </span>
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center p-12 gap-2">
          <Loader2 className="animate-spin size-8 text-blue-500" />
          <span className="text-sm text-gray-500">Carregando atendimentos...</span>
        </div>
      ) : (
        <>
          <Table
            columns={columns}
            data={filteredAtendimentos}
            keyExtractor={(a) => a.id}
            emptyMessage="Nenhum atendimento clínico encontrado. Clique no botão 'Novo Atendimento' acima para registrar."
          />

          {totalPages > 1 && (
            <div className="pagination-container">
              <span className="pagination-info">
                Página {page} de {totalPages} ({totalCount} atendimentos)
              </span>
              <div className="pagination-actions">
                <Button
                  variant="secondary"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  leftIcon={<ChevronLeft className="size-4" />}
                >
                  Anterior
                </Button>
                <Button
                  variant="secondary"
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  rightIcon={<ChevronRight className="size-4" />}
                >
                  Próxima
                </Button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Modal Novo Atendimento */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Abrir Novo Atendimento"
      >
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
          <Select
            label="Paciente *"
            options={pacientes.map((p) => ({
              label: p.cpf ? `${p.nome} (CPF: ${p.cpf})` : p.nome,
              value: p.id,
            }))}
            {...register('pacienteId', { valueAsNumber: true })}
            error={errors.pacienteId?.message}
          />

          <Select
            label="Médico Solicitante / Responsável *"
            options={medicos.map((m) => ({ label: m.nome, value: m.id }))}
            {...register('medicoId', { valueAsNumber: true })}
            error={errors.medicoId?.message}
          />

          <Select
            label="Exame a ser Realizado *"
            options={exames.map((e) => ({ label: e.nome, value: e.id }))}
            {...register('exameId', { valueAsNumber: true })}
            error={errors.exameId?.message}
          />

          <div className="flex justify-end gap-2 mt-4">
            <Button
              variant="secondary"
              type="button"
              onClick={() => setIsModalOpen(false)}
              disabled={isSubmitting}
            >
              Cancelar
            </Button>
            <Button type="submit" isLoading={isSubmitting}>
              Registrar Atendimento
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal de Confirmação de Ação (Substitui confirm() nativo) */}
      <Modal
        isOpen={Boolean(confirmAction)}
        onClose={() => !isProcessingAction && setConfirmAction(null)}
        title={
          confirmAction?.type === 'finalizar'
            ? 'Confirmar Finalização de Atendimento'
            : 'Confirmar Cancelamento de Atendimento'
        }
      >
        {confirmAction && (
          <div className="flex flex-col gap-4 text-left">
            <div className="flex items-start gap-3">
              <AlertTriangle
                className={`size-6 shrink-0 ${
                  confirmAction.type === 'finalizar' ? 'text-blue-500' : 'text-red-500'
                }`}
              />
              <div className="flex flex-col gap-1">
                <strong className="text-gray-900">
                  {confirmAction.type === 'finalizar'
                    ? `Deseja finalizar o atendimento #${confirmAction.id}?`
                    : `Deseja cancelar o atendimento #${confirmAction.id}?`}
                </strong>
                <p className="text-sm text-gray-600">
                  {confirmAction.type === 'finalizar'
                    ? 'Esta ação atualizará o status para FINALIZADO e efetuará a baixa automática dos insumos associados ao exame no estoque.'
                    : 'Esta ação cancelará o atendimento de forma irreversível. Não haverá alterações de saldo no estoque.'}
                </p>
              </div>
            </div>

            <div className="flex justify-end gap-2 mt-4">
              <Button
                variant="secondary"
                type="button"
                onClick={() => setConfirmAction(null)}
                disabled={isProcessingAction}
              >
                Voltar
              </Button>
              <Button
                variant={confirmAction.type === 'finalizar' ? 'primary' : 'danger'}
                onClick={handleConfirmarAcao}
                isLoading={isProcessingAction}
              >
                {confirmAction.type === 'finalizar' ? 'Confirmar Finalização' : 'Confirmar Cancelamento'}
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import {
  AlertTriangle,
  CalendarDays,
  CheckCircle2,
  ClipboardList,
  Clock,
  Plus,
  RefreshCw,
  Search,
  XCircle,
} from 'lucide-react';

import { api } from '../api/api';
import { useAuth } from '../contexts/AuthContext';
import { hasRouteAccess } from '../types/auth';
import type { Atendimento } from '../types/atendimento';
import type { EstoqueSaldoItem } from '../types/estoqueSaldo';
import type { Exame } from '../types/exame';
import type { ExameInsumo } from '../types/exameInsumo';
import type { Insumo } from '../types/insumo';
import type { Medico } from '../types/medico';
import type { Paciente } from '../types/paciente';
import { getNivelEstoque } from '../utils/estoque';
import {
  calcularIdade,
  formatarCrm,
  formatarNumero,
  mascararCpf,
  tempoRelativo,
} from '../utils/format';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { MetricCard } from '../components/ui/MetricCard';
import { Modal } from '../components/ui/Modal';
import { PageHeader } from '../components/ui/PageHeader';
import { Pagination } from '../components/ui/Pagination';
import { Select } from '../components/ui/Select';
import { Skeleton } from '../components/ui/Skeleton';
import { StatusBadge } from '../components/ui/StatusBadge';
import { Table, type Column } from '../components/ui/Table';

const atendimentoFormSchema = z.object({
  pacienteId: z
    .number({ message: 'Selecione um paciente' })
    .min(1, 'Selecione um paciente'),
  medicoId: z
    .number({ message: 'Selecione um médico' })
    .min(1, 'Selecione um médico'),
  exameId: z
    .number({ message: 'Selecione um exame' })
    .min(1, 'Selecione um exame'),
});

type AtendimentoFormDataLocal = z.infer<typeof atendimentoFormSchema>;

export function Atendimentos() {
  const { perfil } = useAuth();
  const canReadSaldo = hasRouteAccess(perfil, '/estoque/saldo');

  const [searchParams, setSearchParams] = useSearchParams();

  const [atendimentos, setAtendimentos] = useState<Atendimento[]>([]);
  const [pacientes, setPacientes] = useState<Paciente[]>([]);
  const [medicos, setMedicos] = useState<Medico[]>([]);
  const [exames, setExames] = useState<Exame[]>([]);
  const [vinculos, setVinculos] = useState<ExameInsumo[]>([]);
  const [insumosMap, setInsumosMap] = useState<Record<number, string>>({});
  const [saldosMap, setSaldosMap] = useState<Record<number, EstoqueSaldoItem>>({});

  const [isLoading, setIsLoading] = useState(false);

  // Filtros
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [medicoFilter, setMedicoFilter] = useState<string>('');
  const [exameFilter, setExameFilter] = useState<string>('');
  const [dataFilter, setDataFilter] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState<string>('');

  // Paginação
  const [page, setPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [totalCount, setTotalCount] = useState<number>(0);
  const limit = 10;

  // Modais
  const [isNovoModalOpen, setIsNovoModalOpen] = useState(false);
  const [buscaPacienteModal, setBuscaPacienteModal] = useState('');
  const [confirmAction, setConfirmAction] = useState<{
    type: 'finalizar' | 'cancelar';
    atendimento: Atendimento;
  } | null>(null);
  const [isProcessingAction, setIsProcessingAction] = useState(false);
  const [erroFinalizacao, setErroFinalizacao] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<AtendimentoFormDataLocal>({
    resolver: zodResolver(atendimentoFormSchema),
    defaultValues: {
      pacienteId: 0,
      medicoId: 0,
      exameId: 0,
    },
  });

  const watchedExameId = watch('exameId');

  const carregarAtendimentos = useCallback(async () => {
    setIsLoading(true);
    try {
      const params: Record<string, string | number> = {
        page,
        limit,
      };
      if (statusFilter) {
        params.status = statusFilter;
      }
      if (medicoFilter) {
        params.medicoId = Number(medicoFilter);
      }
      if (dataFilter) {
        const inicio = new Date(`${dataFilter}T00:00:00`);
        const fim = new Date(`${dataFilter}T23:59:59.999`);
        params.startDate = inicio.toISOString();
        params.endDate = fim.toISOString();
      }

      const response = await api.get('/atendimentos', { params });
      const items: Atendimento[] =
        response.data?.items ??
        (Array.isArray(response.data) ? response.data : []);
      const total = response.data?.total ?? items.length;
      const pages =
        response.data?.totalPages ?? (Math.ceil(total / limit) || 1);

      setAtendimentos(items);
      setTotalCount(total);
      setTotalPages(pages);
    } catch {
      toast.error('Erro ao carregar atendimentos clínicos');
    } finally {
      setIsLoading(false);
    }
  }, [page, limit, statusFilter, medicoFilter, dataFilter]);

  const carregarCatalogosAuxiliares = useCallback(async () => {
    try {
      const requests: Promise<unknown>[] = [
        api.get('/pacientes'),
        api.get('/medicos'),
        api.get('/exames'),
        api.get('/exame-insumos').catch(() => ({ data: [] })),
        api.get('/insumos', { params: { limit: 200 } }).catch(() => ({ data: [] })),
      ];

      // ATENDENTE não pode ler /estoque/saldo (Seção 6 e 7.4)
      if (canReadSaldo) {
        requests.push(api.get('/estoque/saldo').catch(() => ({ data: [] })));
      }

      const results = await Promise.all(requests);
      const resPac = results[0] as { data: Paciente[] | { items?: Paciente[] } };
      const resMed = results[1] as { data: Medico[] | { items?: Medico[] } };
      const resExa = results[2] as { data: Exame[] | { items?: Exame[] } };
      const resVinc = results[3] as {
        data: ExameInsumo[] | { items?: ExameInsumo[] };
      };
      const resIns = results[4] as { data: Insumo[] | { items?: Insumo[] } };

      setPacientes(
        Array.isArray(resPac.data) ? resPac.data : resPac.data?.items || []
      );
      setMedicos(
        Array.isArray(resMed.data) ? resMed.data : resMed.data?.items || []
      );
      setExames(
        Array.isArray(resExa.data) ? resExa.data : resExa.data?.items || []
      );
      setVinculos(
        Array.isArray(resVinc.data) ? resVinc.data : resVinc.data?.items || []
      );

      const listaInsumos = Array.isArray(resIns.data)
        ? resIns.data
        : resIns.data?.items || [];
      const iMap: Record<number, string> = {};
      listaInsumos.forEach((i) => {
        iMap[i.id] = i.nome;
      });
      setInsumosMap(iMap);

      if (canReadSaldo && results[5]) {
        const resSaldo = results[5] as {
          data: EstoqueSaldoItem[] | { items?: EstoqueSaldoItem[] };
        };
        const listaSaldos = Array.isArray(resSaldo.data)
          ? resSaldo.data
          : resSaldo.data?.items || [];
        const sMap: Record<number, EstoqueSaldoItem> = {};
        listaSaldos.forEach((s) => {
          sMap[s.id] = s;
        });
        setSaldosMap(sMap);
      }
    } catch {
      toast.error('Erro ao carregar listas de pacientes, médicos e exames');
    }
  }, [canReadSaldo]);

  useEffect(() => {
    carregarAtendimentos();
  }, [carregarAtendimentos]);

  useEffect(() => {
    carregarCatalogosAuxiliares();
  }, [carregarCatalogosAuxiliares]);

  // Abre modal de Novo Atendimento quando ?novo=1 na URL
  useEffect(() => {
    if (searchParams.get('novo') === '1') {
      reset({ pacienteId: 0, medicoId: 0, exameId: 0 });
      setBuscaPacienteModal('');
      setIsNovoModalOpen(true);
      const nextParams = new URLSearchParams(searchParams);
      nextParams.delete('novo');
      setSearchParams(nextParams, { replace: true });
    }
  }, [searchParams, setSearchParams, reset]);

  // Agrupamento de ExameInsumo por exameId (evita N+1)
  const vinculosPorExame = useMemo(() => {
    const map: Record<number, ExameInsumo[]> = {};
    vinculos.forEach((v) => {
      if (!map[v.exameId]) {
        map[v.exameId] = [];
      }
      map[v.exameId].push(v);
    });
    return map;
  }, [vinculos]);

  const filteredAtendimentos = useMemo(() => {
    const term = searchTerm.toLowerCase().trim();
    return atendimentos.filter((a) => {
      if (exameFilter && a.exameId !== Number(exameFilter)) {
        return false;
      }
      if (!term) return true;
      const pacNome = a.paciente?.nome?.toLowerCase() || '';
      const medNome = a.medico?.nome?.toLowerCase() || '';
      const exaNome = a.exame?.nome?.toLowerCase() || '';
      return (
        pacNome.includes(term) ||
        medNome.includes(term) ||
        exaNome.includes(term) ||
        String(a.id).includes(term)
      );
    });
  }, [atendimentos, exameFilter, searchTerm]);

  // KPIs calculados da lista (Seção 7.4)
  const kpis = useMemo(() => {
    const hojeStr = new Date().toLocaleDateString('pt-BR');
    let emAberto = 0;
    let finalizadosHoje = 0;
    let cancelados = 0;
    let finalizadosTotal = 0;

    atendimentos.forEach((a) => {
      const st = a.status.toUpperCase();
      if (st === 'EM_ATENDIMENTO' || st === 'PENDENTE') {
        emAberto++;
      } else if (st === 'FINALIZADO') {
        finalizadosTotal++;
        if (
          a.criadoEm &&
          new Date(a.criadoEm).toLocaleDateString('pt-BR') === hojeStr
        ) {
          finalizadosHoje++;
        }
      } else if (st === 'CANCELADO') {
        cancelados++;
      }
    });

    const totalLista = atendimentos.length;
    const taxaCancelamento =
      totalLista > 0 ? Math.round((cancelados / totalLista) * 100) : 0;

    return {
      totalLista,
      emAberto,
      finalizadosHoje,
      finalizadosTotal,
      cancelados,
      taxaCancelamento,
    };
  }, [atendimentos]);

  // Exames ativos para o select de Novo Atendimento
  const examesAtivos = useMemo(
    () => exames.filter((e) => e.ativo !== false),
    [exames]
  );

  // Pacientes filtrados pela busca dentro do modal Novo Atendimento
  const pacientesFiltradosModal = useMemo(() => {
    const term = buscaPacienteModal.toLowerCase().trim();
    if (!term) return pacientes;
    return pacientes.filter(
      (p) =>
        p.nome.toLowerCase().includes(term) ||
        (p.cpf && p.cpf.includes(term.replace(/\D/g, '')))
    );
  }, [pacientes, buscaPacienteModal]);

  // Previsão de consumo do exame selecionado no modal Novo Atendimento
  const previsaoConsumoModal = useMemo(() => {
    const exId = Number(watchedExameId);
    if (!exId) return [];
    const lista = vinculosPorExame[exId] || [];
    return lista.map((v) => {
      const nome =
        v.insumo?.nome || insumosMap[v.insumoId] || `Insumo #${v.insumoId}`;
      const saldoInfo = saldosMap[v.insumoId];
      const saldo = saldoInfo?.saldo ?? 0;
      const minimo =
        saldoInfo?.quantidadeMinima ?? v.insumo?.quantidadeMinima ?? 0;
      const insuficiente = canReadSaldo && saldo < v.quantidade;
      const nivel = canReadSaldo ? getNivelEstoque(saldo, minimo) : null;
      return {
        ...v,
        nome,
        saldo,
        minimo,
        insuficiente,
        nivel,
      };
    });
  }, [watchedExameId, vinculosPorExame, insumosMap, saldosMap, canReadSaldo]);

  const temInsumoInsuficienteNoModal = useMemo(
    () => previsaoConsumoModal.some((item) => item.insuficiente),
    [previsaoConsumoModal]
  );

  async function onSubmitNovoAtendimento(data: AtendimentoFormDataLocal) {
    try {
      await api.post('/atendimentos', {
        pacienteId: Number(data.pacienteId),
        medicoId: Number(data.medicoId),
        exameId: Number(data.exameId),
      });
      toast.success('Atendimento aberto com sucesso');
      setIsNovoModalOpen(false);
      reset({ pacienteId: 0, medicoId: 0, exameId: 0 });
      await Promise.all([carregarAtendimentos(), carregarCatalogosAuxiliares()]);
    } catch (err: unknown) {
      let msg = 'Erro ao abrir novo atendimento';
      if (err && typeof err === 'object' && 'response' in err) {
        const axErr = err as { response?: { data?: { message?: string; error?: string } } };
        msg = axErr.response?.data?.message || axErr.response?.data?.error || msg;
      }
      toast.error(msg);
    }
  }

  function handleAbrirConfirmacao(
    type: 'finalizar' | 'cancelar',
    atendimento: Atendimento
  ) {
    setErroFinalizacao(null);
    setConfirmAction({ type, atendimento });
  }

  async function handleConfirmarAcao() {
    if (!confirmAction || isProcessingAction) return;
    setIsProcessingAction(true);
    setErroFinalizacao(null);

    try {
      if (confirmAction.type === 'finalizar') {
        await api.patch(`/atendimentos/${confirmAction.atendimento.id}/finalizar`);
        toast.success(
          `Atendimento #${confirmAction.atendimento.id} finalizado e insumos baixados no estoque.`
        );
      } else {
        await api.patch(`/atendimentos/${confirmAction.atendimento.id}/cancelar`);
        toast.success(
          `Atendimento #${confirmAction.atendimento.id} cancelado com sucesso.`
        );
      }
      setConfirmAction(null);
      await Promise.all([carregarAtendimentos(), carregarCatalogosAuxiliares()]);
    } catch (err: unknown) {
      let msg =
        confirmAction.type === 'finalizar'
          ? 'Erro ao finalizar atendimento'
          : 'Erro ao cancelar atendimento';
      if (err && typeof err === 'object' && 'response' in err) {
        const axErr = err as {
          response?: { status?: number; data?: { message?: string; error?: string } };
        };
        msg = axErr.response?.data?.message || axErr.response?.data?.error || msg;
      }
      // Seção 7.4: em erro 400 de saldo insuficiente ao finalizar, manter o modal aberto e exibir a mensagem do backend
      if (confirmAction.type === 'finalizar') {
        setErroFinalizacao(msg);
      }
      toast.error(msg);
    } finally {
      setIsProcessingAction(false);
    }
  }

  const columns: Column<Atendimento>[] = [
    {
      header: 'Paciente',
      accessor: (a) => {
        const idade = calcularIdade(a.paciente?.dataNascimento);
        return (
          <div className="flex flex-col gap-0.5">
            <div className="flex items-center gap-1.5">
              <span className="font-data-mono text-label-sm text-outline">
                #{a.id}
              </span>
              <strong className="font-semibold text-on-surface">
                {a.paciente?.nome || `Paciente #${a.pacienteId}`}
              </strong>
            </div>
            <div className="flex items-center gap-2 text-body-sm text-outline">
              <span className="font-data-mono tabular-nums">
                CPF: {mascararCpf(a.paciente?.cpf)}
              </span>
              {idade !== null && <span>• {idade} anos</span>}
            </div>
          </div>
        );
      },
    },
    {
      header: 'Médico Solicitante',
      accessor: (a) => (
        <div className="flex flex-col">
          <span className="font-medium text-on-surface">
            {a.medico?.nome || `Médico #${a.medicoId}`}
          </span>
          <span className="font-data-mono text-label-sm text-outline">
            {formatarCrm(a.medico?.crm)}
          </span>
        </div>
      ),
    },
    {
      header: 'Exame',
      accessor: (a) => (
        <div className="flex items-center gap-1.5">
          <span className="font-data-mono text-label-sm text-outline">
            #{a.exameId}
          </span>
          <span className="font-medium text-on-surface">
            {a.exame?.nome || `Exame #${a.exameId}`}
          </span>
        </div>
      ),
    },
    {
      header: 'Insumos Requeridos (Baixa Automática)',
      accessor: (a) => {
        const lista = vinculosPorExame[a.exameId] || [];
        if (lista.length === 0) {
          return (
            <span className="text-body-sm text-outline italic">
              Sem insumos vinculados
            </span>
          );
        }
        const visiveis = lista.slice(0, 2);
        const restantes = lista.length - visiveis.length;
        return (
          <div className="flex flex-wrap items-center gap-1.5">
            {visiveis.map((v) => {
              const nomeInsumo =
                v.insumo?.nome ||
                insumosMap[v.insumoId] ||
                `Insumo #${v.insumoId}`;
              return (
                <span
                  key={v.id}
                  className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-surface-container text-on-surface-variant text-label-sm font-medium"
                >
                  <span>{nomeInsumo}</span>
                  <strong className="font-data-mono text-primary">
                    ×{v.quantidade}
                  </strong>
                </span>
              );
            })}
            {restantes > 0 && (
              <span className="px-2 py-0.5 rounded-full bg-surface-container-high text-primary font-data-mono text-label-sm font-bold">
                +{restantes}
              </span>
            )}
          </div>
        );
      },
    },
    {
      header: 'Horário',
      accessor: (a) => (
        <div className="flex flex-col">
          <span className="font-data-mono text-body-sm text-on-surface">
            {a.criadoEm
              ? new Date(a.criadoEm).toLocaleString('pt-BR', {
                  day: '2-digit',
                  month: '2-digit',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })
              : '—'}
          </span>
          <span className="text-label-sm text-outline">
            {tempoRelativo(a.criadoEm)}
          </span>
        </div>
      ),
    },
    {
      header: 'Status',
      accessor: (a) => {
        const s = a.status.toUpperCase();
        if (s === 'FINALIZADO') {
          return <StatusBadge variant="conforme" label="Finalizado" />;
        }
        if (s === 'CANCELADO') {
          return (
            <StatusBadge
              variant="critico"
              label="Cancelado"
              icon={<XCircle size={14} className="shrink-0" />}
            />
          );
        }
        return <StatusBadge variant="atencao" label="Em Atendimento" />;
      },
    },
    {
      header: 'Ações',
      align: 'right',
      accessor: (a) => {
        const emAtendimento =
          a.status === 'EM_ATENDIMENTO' || a.status === 'PENDENTE';
        if (!emAtendimento) {
          return (
            <span className="text-body-sm text-outline italic">Encerrado</span>
          );
        }
        return (
          <div className="flex items-center justify-end gap-1.5">
            <Button
              variant="primary"
              size="sm"
              onClick={() => handleAbrirConfirmacao('finalizar', a)}
              leftIcon={<CheckCircle2 size={14} />}
            >
              Finalizar
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleAbrirConfirmacao('cancelar', a)}
              title="Cancelar atendimento"
              className="text-error hover:bg-error-container/40 hover:text-error"
              leftIcon={<XCircle size={14} />}
            >
              Cancelar
            </Button>
          </div>
        );
      },
    },
  ];

  const insumosModalFinalizar = useMemo(() => {
    if (!confirmAction || confirmAction.type !== 'finalizar') return [];
    return vinculosPorExame[confirmAction.atendimento.exameId] || [];
  }, [confirmAction, vinculosPorExame]);

  return (
    <div className="w-full max-w-[1600px] mx-auto px-gutter lg:px-margin-desktop py-space-lg flex flex-col gap-space-lg">
      <PageHeader
        breadcrumbs={[
          { label: 'Início', to: '/' },
          { label: 'Atendimentos' },
        ]}
        titulo="Atendimentos Clínicos"
        subtitulo="Fluxo de recepção, execução de exames e baixa automática de insumos ao finalizar."
        acoes={
          <>
            <Button
              variant="secondary"
              onClick={carregarAtendimentos}
              disabled={isLoading}
              leftIcon={
                <RefreshCw
                  size={16}
                  className={isLoading ? 'animate-spin' : ''}
                />
              }
            >
              Atualizar
            </Button>
            <Button
              onClick={() => {
                reset({ pacienteId: 0, medicoId: 0, exameId: 0 });
                setBuscaPacienteModal('');
                setIsNovoModalOpen(true);
              }}
              leftIcon={<Plus size={16} />}
            >
              Novo Atendimento
            </Button>
          </>
        }
      />

      {/* KPIs (Seção 7.4) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-space-md">
        <MetricCard
          titulo="Em Aberto"
          valor={kpis.emAberto}
          tom={kpis.emAberto > 0 ? 'tertiary' : 'primary'}
          icone={<Clock size={20} />}
          loading={isLoading}
          detalhe="Aguardando finalização e baixa"
        />
        <MetricCard
          titulo="Finalizados Hoje"
          valor={kpis.finalizadosHoje}
          tom="secondary"
          icone={<CheckCircle2 size={20} />}
          loading={isLoading}
          detalhe={`${kpis.finalizadosTotal} finalizado(s) na página`}
        />
        <MetricCard
          titulo="Taxa de Cancelamento"
          valor={`${kpis.taxaCancelamento}%`}
          tom={kpis.cancelados > 0 ? 'error' : 'secondary'}
          icone={<XCircle size={20} />}
          loading={isLoading}
          detalhe={`${kpis.cancelados} cancelado(s) no período`}
        />
      </div>

      {/* Abas de Status com Contagem */}
      <div className="flex flex-col gap-space-md bg-surface-container-lowest p-space-md rounded-xl border border-outline-variant/40">
        <div className="flex flex-wrap items-center justify-between gap-space-sm border-b border-outline-variant/30 pb-space-sm">
          <div className="inline-flex flex-wrap items-center gap-1 p-1 rounded-lg bg-surface-container-low">
            {[
              { id: '', label: `Todos (${totalCount})` },
              {
                id: 'EM_ATENDIMENTO',
                label: `Em Atendimento (${kpis.emAberto})`,
              },
              {
                id: 'FINALIZADO',
                label: `Finalizados (${kpis.finalizadosTotal})`,
              },
              { id: 'CANCELADO', label: `Cancelados (${kpis.cancelados})` },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => {
                  setStatusFilter(tab.id);
                  setPage(1);
                }}
                className={`px-3 py-1.5 rounded-md text-label-sm transition-colors cursor-pointer ${
                  statusFilter === tab.id
                    ? 'bg-surface-container-lowest text-primary font-semibold shadow-2xs'
                    : 'text-on-surface-variant hover:text-on-surface'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <span className="text-body-sm text-outline">
            Exibindo{' '}
            <strong className="font-data-mono text-on-surface">
              {filteredAtendimentos.length}
            </strong>{' '}
            de{' '}
            <strong className="font-data-mono text-on-surface">
              {totalCount}
            </strong>
          </span>
        </div>

        {/* Filtros Avançados */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-space-sm items-end">
          <Input
            label="Busca Rápida"
            placeholder="Paciente, médico, exame ou #id..."
            leftIcon={<Search size={16} />}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />

          <Select
            label="Médico"
            placeholder="Todos os médicos"
            options={medicos.map((m) => ({ label: m.nome, value: m.id }))}
            value={medicoFilter}
            onChange={(e) => {
              setMedicoFilter(e.target.value);
              setPage(1);
            }}
          />

          <Select
            label="Exame"
            placeholder="Todos os exames"
            options={exames.map((e) => ({ label: e.nome, value: e.id }))}
            value={exameFilter}
            onChange={(e) => setExameFilter(e.target.value)}
          />

          <Input
            label="Data do Atendimento"
            type="date"
            leftIcon={<CalendarDays size={16} />}
            value={dataFilter}
            onChange={(e) => {
              setDataFilter(e.target.value);
              setPage(1);
            }}
          />
        </div>
      </div>

      {/* Tabela */}
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
            data={filteredAtendimentos}
            keyExtractor={(a) => a.id}
            emptyMessage="Nenhum atendimento clínico encontrado para os filtros aplicados."
          />

          <Pagination
            page={page}
            totalPages={totalPages}
            total={totalCount}
            isLoading={isLoading}
            onPageChange={setPage}
            itemLabel="atendimentos"
          />
        </>
      )}

      {/* Modal Novo Atendimento com Previsão de Consumo em Tempo Real (D2 & Seção 7.4) */}
      <Modal
        isOpen={isNovoModalOpen}
        onClose={() => !isSubmitting && setIsNovoModalOpen(false)}
        title="Novo Atendimento Clínico"
        subtitle="Vincule o paciente, médico solicitante e o procedimento a ser realizado."
        maxWidth="max-w-2xl"
      >
        <form
          onSubmit={handleSubmit(onSubmitNovoAtendimento)}
          className="flex flex-col gap-space-md"
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-space-sm items-end">
            <Input
              label="Filtrar Paciente"
              placeholder="Digite nome ou CPF..."
              leftIcon={<Search size={15} />}
              value={buscaPacienteModal}
              onChange={(e) => setBuscaPacienteModal(e.target.value)}
            />
            <Select
              label="Paciente *"
              placeholder="Selecione o paciente..."
              options={pacientesFiltradosModal.map((p) => ({
                label: p.cpf
                  ? `${p.nome} (${mascararCpf(p.cpf)})`
                  : p.nome,
                value: p.id,
              }))}
              error={errors.pacienteId?.message}
              {...register('pacienteId', { valueAsNumber: true })}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-space-sm">
            <Select
              label="Médico Solicitante *"
              placeholder="Selecione o médico..."
              options={medicos.map((m) => ({
                label: `${m.nome} (${formatarCrm(m.crm)})`,
                value: m.id,
              }))}
              error={errors.medicoId?.message}
              {...register('medicoId', { valueAsNumber: true })}
            />

            <Select
              label="Exame (Ativos) *"
              placeholder="Selecione o exame..."
              options={examesAtivos.map((e) => ({
                label: e.nome,
                value: e.id,
              }))}
              error={errors.exameId?.message}
              {...register('exameId', { valueAsNumber: true })}
            />
          </div>

          {/* Painel: Insumos vinculados / Previsão de Consumo em Tempo Real */}
          {Number(watchedExameId) > 0 && (
            <div className="flex flex-col gap-space-sm p-space-md rounded-xl bg-surface-container-low border border-outline-variant/40">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <div className="flex items-center gap-1.5 text-label-md font-semibold text-on-surface">
                  <ClipboardList size={16} className="text-primary" />
                  <span>
                    {canReadSaldo
                      ? 'Previsão de Consumo em Tempo Real'
                      : 'Insumos Vinculados ao Exame'}
                  </span>
                </div>
                <span className="text-label-sm text-outline">
                  Estes insumos serão baixados ao finalizar o atendimento
                </span>
              </div>

              {previsaoConsumoModal.length === 0 ? (
                <p className="text-body-sm text-outline m-0">
                  Este exame não possui insumos vinculados na ficha técnica. Nenhuma baixa de estoque será realizada ao finalizar.
                </p>
              ) : (
                <div className="flex flex-col gap-1.5">
                  {previsaoConsumoModal.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between gap-2 px-3 py-2 rounded-lg bg-surface-container-lowest border border-outline-variant/30 text-body-sm"
                    >
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-on-surface">
                          {item.nome}
                        </span>
                        <span className="font-data-mono text-primary font-semibold">
                          ×{item.quantidade}
                        </span>
                      </div>

                      {canReadSaldo && (
                        <div className="flex items-center gap-2">
                          <span className="text-outline">
                            Saldo:{' '}
                            <strong className="font-data-mono tabular-nums text-on-surface">
                              {formatarNumero(item.saldo)}
                            </strong>
                          </span>
                          {item.insuficiente ? (
                            <StatusBadge
                              variant="critico"
                              label="Insuficiente"
                            />
                          ) : item.nivel ? (
                            <StatusBadge
                              variant={item.nivel.status}
                              label={item.nivel.label}
                            />
                          ) : null}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {canReadSaldo && temInsumoInsuficienteNoModal && (
                <div className="flex items-start gap-2 p-space-sm rounded-lg bg-error-container text-on-error-container text-body-sm">
                  <AlertTriangle size={16} className="shrink-0 mt-0.5" />
                  <span>
                    Atenção: há insumo(s) com saldo insuficiente para concluir este exame. Você pode abrir o atendimento agora, mas será necessário repor o estoque antes de finalizá-lo.
                  </span>
                </div>
              )}
            </div>
          )}

          <div className="flex justify-end gap-space-sm pt-space-sm border-t border-outline-variant/30">
            <Button
              variant="secondary"
              type="button"
              onClick={() => setIsNovoModalOpen(false)}
              disabled={isSubmitting}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              isLoading={isSubmitting}
              leftIcon={<Plus size={16} />}
            >
              Registrar Atendimento
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal Finalizar / Cancelar Atendimento */}
      <Modal
        isOpen={Boolean(confirmAction)}
        onClose={() => !isProcessingAction && setConfirmAction(null)}
        title={
          confirmAction?.type === 'finalizar'
            ? 'Confirmar Finalização e Baixa de Estoque'
            : 'Confirmar Cancelamento de Atendimento'
        }
        subtitle={
          confirmAction
            ? `Atendimento #${confirmAction.atendimento.id}`
            : undefined
        }
      >
        {confirmAction && (
          <div className="flex flex-col gap-space-md">
            {/* Resumo do Atendimento */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-space-sm p-space-md rounded-xl bg-surface-container-low border border-outline-variant/40 text-body-sm">
              <div>
                <span className="text-label-sm uppercase text-outline block">
                  Paciente
                </span>
                <strong className="text-on-surface">
                  {confirmAction.atendimento.paciente?.nome ||
                    `Paciente #${confirmAction.atendimento.pacienteId}`}
                </strong>
              </div>
              <div>
                <span className="text-label-sm uppercase text-outline block">
                  Exame
                </span>
                <strong className="text-on-surface">
                  {confirmAction.atendimento.exame?.nome ||
                    `Exame #${confirmAction.atendimento.exameId}`}
                </strong>
              </div>
            </div>

            {confirmAction.type === 'finalizar' ? (
              <>
                <div className="flex flex-col gap-space-xs">
                  <span className="text-label-md font-semibold text-on-surface">
                    Insumos a baixar nesta confirmação:
                  </span>
                  {insumosModalFinalizar.length === 0 ? (
                    <p className="text-body-sm text-outline m-0">
                      Este exame não possui insumos vinculados na ficha técnica.
                    </p>
                  ) : (
                    <div className="flex flex-col gap-1.5">
                      {insumosModalFinalizar.map((v) => {
                        const nomeInsumo =
                          v.insumo?.nome ||
                          insumosMap[v.insumoId] ||
                          `Insumo #${v.insumoId}`;
                        return (
                          <div
                            key={v.id}
                            className="flex items-center justify-between px-3 py-2 rounded-lg bg-surface-container-lowest border border-outline-variant/30 text-body-sm"
                          >
                            <span className="font-medium text-on-surface">
                              {nomeInsumo}
                            </span>
                            <strong className="font-data-mono tabular-nums text-error">
                              -{v.quantidade}
                            </strong>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {erroFinalizacao && (
                  <div
                    role="alert"
                    className="flex items-start gap-2.5 p-space-md rounded-xl bg-error-container text-on-error-container text-body-sm border border-error/30"
                  >
                    <AlertTriangle size={18} className="shrink-0 mt-0.5" />
                    <div className="flex flex-col gap-0.5">
                      <strong className="font-semibold">
                        Não foi possível finalizar o atendimento (nenhum insumo foi baixado):
                      </strong>
                      <span>{erroFinalizacao}</span>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <p className="text-body-md text-on-surface-variant m-0">
                Deseja cancelar este atendimento em andamento? Esta ação encerra o ciclo sem gerar movimentações de estoque.
              </p>
            )}

            <div className="flex justify-end gap-space-sm pt-space-sm border-t border-outline-variant/30">
              <Button
                variant="secondary"
                type="button"
                onClick={() => setConfirmAction(null)}
                disabled={isProcessingAction}
              >
                Voltar
              </Button>
              <Button
                variant={
                  confirmAction.type === 'finalizar' ? 'primary' : 'danger'
                }
                onClick={handleConfirmarAcao}
                isLoading={isProcessingAction}
                disabled={isProcessingAction}
                leftIcon={
                  confirmAction.type === 'finalizar' ? (
                    <CheckCircle2 size={16} />
                  ) : (
                    <XCircle size={16} />
                  )
                }
              >
                {confirmAction.type === 'finalizar'
                  ? 'Confirmar Baixa'
                  : 'Confirmar Cancelamento'}
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
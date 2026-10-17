import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  AlertTriangle,
  ArrowDownCircle,
  ArrowRight,
  ArrowUpCircle,
  CheckCircle2,
  ClipboardList,
  Clock,
  History,
  Package,
  PackagePlus,
  PlusCircle,
  RefreshCw,
  Sliders,
} from 'lucide-react';
import { toast } from 'sonner';

import { api } from '../api/api';
import { useAuth } from '../contexts/AuthContext';
import { hasRouteAccess } from '../types/auth';
import type { Atendimento } from '../types/atendimento';
import type { DashboardData } from '../types/dashboard';
import type { EstoqueSaldoItem } from '../types/estoqueSaldo';
import type { Exame } from '../types/exame';
import type { ExameInsumo } from '../types/exameInsumo';
import type { Insumo } from '../types/insumo';
import { getNivelEstoque } from '../utils/estoque';
import {
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
import { ProgressBar } from '../components/ui/ProgressBar';
import { Select } from '../components/ui/Select';
import { Skeleton } from '../components/ui/Skeleton';
import { StatusBadge } from '../components/ui/StatusBadge';
import { Table, type Column } from '../components/ui/Table';

interface MovimentacaoRecente {
  id: number;
  tipo: 'ENTRADA' | 'SAIDA' | 'AJUSTE' | string;
  quantidade: number;
  motivo?: string;
  createdAt: string;
  insumoId?: number;
  insumo?: {
    nome: string;
  };
}

const entradaModalSchema = z.object({
  insumoId: z
    .number({ message: 'Selecione um insumo' })
    .min(1, 'Selecione um insumo'),
  quantidade: z
    .number({ message: 'Informe uma quantidade válida' })
    .int('A quantidade deve ser um número inteiro')
    .min(1, 'A quantidade deve ser maior que zero'),
  motivo: z
    .string()
    .min(3, 'Informe o motivo ou referência (mín. 3 caracteres)'),
});

type EntradaModalFormData = z.infer<typeof entradaModalSchema>;

export function Home() {
  const navigate = useNavigate();
  const { perfil } = useAuth();

  const canReadAtendimentos = hasRouteAccess(perfil, '/atendimentos');
  const canReadSaldo = hasRouteAccess(perfil, '/estoque/saldo');
  const canMovimentar = hasRouteAccess(perfil, '/estoque');

  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [saldos, setSaldos] = useState<EstoqueSaldoItem[]>([]);
  const [atendimentosEmAberto, setAtendimentosEmAberto] = useState<
    Atendimento[]
  >([]);
  const [finalizadosHojeList, setFinalizadosHojeList] = useState<Atendimento[]>(
    []
  );
  const [totalEmAtendimentoCount, setTotalEmAtendimentoCount] =
    useState<number>(0);
  const [totalFinalizadosCount, setTotalFinalizadosCount] = useState<number>(0);
  const [examesMap, setExamesMap] = useState<Record<number, string>>({});
  const [vinculosPorExame, setVinculosPorExame] = useState<
    Record<number, ExameInsumo[]>
  >({});
  const [insumosMap, setInsumosMap] = useState<Record<number, string>>({});
  const [movimentacoesRecentes, setMovimentacoesRecentes] = useState<
    MovimentacaoRecente[]
  >([]);

  const [isLoading, setIsLoading] = useState(false);
  const [lastUpdatedAt, setLastUpdatedAt] = useState<Date | null>(null);
  const [, setTick] = useState(0);

  // Modal de Entrada Rápida (Seção 7.1 / 7.2)
  const [isEntradaModalOpen, setIsEntradaModalOpen] = useState(false);

  // Modal de Finalizar Atendimento (Seção 7.1 / 7.4)
  const [atendimentoParaFinalizar, setAtendimentoParaFinalizar] =
    useState<Atendimento | null>(null);
  const [isFinalizando, setIsFinalizando] = useState(false);
  const [erroFinalizacao, setErroFinalizacao] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<EntradaModalFormData>({
    resolver: zodResolver(entradaModalSchema),
    defaultValues: {
      insumoId: 0,
      quantidade: 1,
      motivo: '',
    },
  });

  // Atualiza o rótulo "Há Xs" a cada 15 segundos
  useEffect(() => {
    const timer = window.setInterval(() => {
      setTick((t) => t + 1);
    }, 15000);
    return () => window.clearInterval(timer);
  }, []);

  const carregarDashboard = useCallback(async () => {
    setIsLoading(true);
    try {
      const resDash = await api.get<DashboardData>('/relatorios/dashboard');
      setDashboard(resDash.data);

      // Bloco de Atendimentos e Exames (somente para perfis com acesso a /atendimentos)
      if (canReadAtendimentos) {
        const hojeInicio = new Date();
        hojeInicio.setHours(0, 0, 0, 0);
        const hojeFim = new Date();
        hojeFim.setHours(23, 59, 59, 999);

        const [
          resExames,
          resVinculos,
          resInsumos,
          resAbertos,
          resFinalizadosTotal,
          resFinalizadosHoje,
        ] = await Promise.all([
          api.get('/exames').catch(() => ({ data: [] })),
          api.get('/exame-insumos').catch(() => ({ data: [] })),
          api
            .get('/insumos', { params: { limit: 200 } })
            .catch(() => ({ data: [] })),
          api
            .get('/atendimentos', {
              params: { status: 'EM_ATENDIMENTO', limit: 6 },
            })
            .catch(() => ({ data: { items: [], total: 0 } })),
          api
            .get('/atendimentos', {
              params: { status: 'FINALIZADO', limit: 1 },
            })
            .catch(() => ({ data: { total: 0 } })),
          api
            .get('/atendimentos', {
              params: {
                status: 'FINALIZADO',
                startDate: hojeInicio.toISOString(),
                endDate: hojeFim.toISOString(),
                limit: 100,
              },
            })
            .catch(() => ({ data: { items: [], total: 0 } })),
        ]);

        const examesList: Exame[] = Array.isArray(resExames.data)
          ? resExames.data
          : resExames.data?.items || [];
        const eMap: Record<number, string> = {};
        examesList.forEach((e) => {
          eMap[e.id] = e.nome;
        });
        setExamesMap(eMap);

        const insumosList: Insumo[] = Array.isArray(resInsumos.data)
          ? resInsumos.data
          : resInsumos.data?.items || [];
        const iMap: Record<number, string> = {};
        insumosList.forEach((i) => {
          iMap[i.id] = i.nome;
        });
        setInsumosMap(iMap);

        const vinculosList: ExameInsumo[] = Array.isArray(resVinculos.data)
          ? resVinculos.data
          : resVinculos.data?.items || [];
        const vMap: Record<number, ExameInsumo[]> = {};
        vinculosList.forEach((v) => {
          if (!vMap[v.exameId]) {
            vMap[v.exameId] = [];
          }
          vMap[v.exameId].push(v);
        });
        setVinculosPorExame(vMap);

        const abertosItems: Atendimento[] =
          resAbertos.data?.items ??
          (Array.isArray(resAbertos.data) ? resAbertos.data : []);
        setAtendimentosEmAberto(abertosItems);
        setTotalEmAtendimentoCount(
          resAbertos.data?.total ?? abertosItems.length
        );

        setTotalFinalizadosCount(
          resFinalizadosTotal.data?.total ??
            resFinalizadosTotal.data?.items?.length ??
            0
        );

        const finHojeItems: Atendimento[] =
          resFinalizadosHoje.data?.items ??
          (Array.isArray(resFinalizadosHoje.data)
            ? resFinalizadosHoje.data
            : []);
        setFinalizadosHojeList(finHojeItems);
      }

      // Bloco de Saldo e Movimentações (somente para perfis com acesso a /estoque/saldo)
      if (canReadSaldo) {
        const [resSaldo, resMov] = await Promise.all([
          api.get('/estoque/saldo').catch(() => ({ data: [] })),
          api
            .get('/estoque/movimentacoes', { params: { limit: 5 } })
            .catch(() => ({ data: [] })),
        ]);

        const saldosItems: EstoqueSaldoItem[] = Array.isArray(resSaldo.data)
          ? resSaldo.data
          : resSaldo.data?.items || [];
        setSaldos(saldosItems);

        const movItems: MovimentacaoRecente[] = Array.isArray(resMov.data)
          ? resMov.data
          : resMov.data?.items || [];
        setMovimentacoesRecentes(movItems);
      }

      setLastUpdatedAt(new Date());
    } catch {
      toast.error('Erro ao carregar métricas do painel geral');
    } finally {
      setIsLoading(false);
    }
  }, [canReadAtendimentos, canReadSaldo]);

  useEffect(() => {
    carregarDashboard();
  }, [carregarDashboard]);

  // Métricas derivadas de Estoque (via getNivelEstoque sobre /estoque/saldo)
  const metricasEstoque = useMemo(() => {
    const total = saldos.length;
    const itensCriticos: EstoqueSaldoItem[] = [];
    let conformes = 0;

    saldos.forEach((s) => {
      const nivel = getNivelEstoque(s.saldo, s.quantidadeMinima);
      if (nivel.status === 'critico') {
        itensCriticos.push(s);
      } else if (nivel.status === 'conforme') {
        conformes++;
      }
    });

    return {
      total,
      criticosCount: itensCriticos.length,
      itensCriticos,
      conformes,
    };
  }, [saldos]);

  // Métricas de Exames Realizados Hoje (FINALIZADO do dia + protocolos distintos)
  const metricasExamesHoje = useMemo(() => {
    const protocolosDistintos = new Set(
      finalizadosHojeList.map((a) => a.exameId)
    ).size;
    return {
      totalHoje: finalizadosHojeList.length,
      protocolosDistintos,
    };
  }, [finalizadosHojeList]);

  const totalExamesNoGrafico = useMemo(
    () =>
      (dashboard?.examesMaisRealizados || []).reduce(
        (acc, curr) => acc + (curr._count?.id || 0),
        0
      ),
    [dashboard]
  );

  function handleAbrirModalEntrada(insumoId?: number) {
    reset({
      insumoId: insumoId ?? (saldos[0]?.id || 0),
      quantidade: 1,
      motivo: '',
    });
    setIsEntradaModalOpen(true);
  }

  async function onSubmitEntrada(data: EntradaModalFormData) {
    try {
      await api.post('/estoque/entrada', {
        insumoId: Number(data.insumoId),
        quantidade: Number(data.quantidade),
        motivo: data.motivo.trim(),
      });
      toast.success('Entrada registrada com sucesso! Saldo recalculado.');
      setIsEntradaModalOpen(false);
      await carregarDashboard();
    } catch (err: unknown) {
      let msg = 'Erro ao registrar entrada de estoque';
      if (err && typeof err === 'object' && 'response' in err) {
        const axErr = err as {
          response?: { data?: { message?: string; error?: string } };
        };
        msg =
          axErr.response?.data?.message || axErr.response?.data?.error || msg;
      }
      toast.error(msg);
    }
  }

  async function handleConfirmarFinalizacao() {
    if (!atendimentoParaFinalizar || isFinalizando) return;
    setIsFinalizando(true);
    setErroFinalizacao(null);
    try {
      await api.patch(
        `/atendimentos/${atendimentoParaFinalizar.id}/finalizar`
      );
      toast.success(
        `Atendimento #${atendimentoParaFinalizar.id} finalizado e insumos baixados no estoque.`
      );
      setAtendimentoParaFinalizar(null);
      await carregarDashboard();
    } catch (err: unknown) {
      let msg = 'Erro ao finalizar atendimento';
      if (err && typeof err === 'object' && 'response' in err) {
        const axErr = err as {
          response?: { data?: { message?: string; error?: string } };
        };
        msg =
          axErr.response?.data?.message || axErr.response?.data?.error || msg;
      }
      setErroFinalizacao(msg);
      toast.error(msg);
    } finally {
      setIsFinalizando(false);
    }
  }

  const colunasAlertasCriticos: Column<EstoqueSaldoItem>[] = [
    {
      header: 'Insumo',
      accessor: (item) => (
        <div className="flex items-center gap-2">
          <span className="font-data-mono text-label-sm text-outline">
            #{item.id}
          </span>
          <span className="font-semibold text-on-surface">{item.nome}</span>
        </div>
      ),
    },
    {
      header: 'Saldo',
      align: 'right',
      accessor: (item) => (
        <strong className="font-data-mono tabular-nums text-error">
          {formatarNumero(item.saldo)}
        </strong>
      ),
    },
    {
      header: 'Mínimo',
      align: 'right',
      accessor: (item) => (
        <span className="font-data-mono tabular-nums text-outline">
          {formatarNumero(item.quantidadeMinima)}
        </span>
      ),
    },
    {
      header: 'Status',
      accessor: (item) => {
        const nivel = getNivelEstoque(item.saldo, item.quantidadeMinima);
        return (
          <div className="flex flex-col gap-1">
            <StatusBadge variant={nivel.status} label={nivel.label} />
            <ProgressBar
              saldo={item.saldo}
              minimo={item.quantidadeMinima}
              className="w-24 h-1.5"
            />
          </div>
        );
      },
    },
    ...(canMovimentar
      ? [
          {
            header: 'Ação',
            align: 'right',
            accessor: (item: EstoqueSaldoItem) => (
              <Button
                variant="secondary"
                size="sm"
                onClick={() => handleAbrirModalEntrada(item.id)}
                leftIcon={<PackagePlus size={14} />}
              >
                + Entrada Rápida
              </Button>
            ),
          } satisfies Column<EstoqueSaldoItem>,
        ]
      : []),
  ];

  const colunasAtendimentosAbertos: Column<Atendimento>[] = [
    {
      header: 'Paciente',
      accessor: (a) => (
        <div className="flex flex-col">
          <span className="font-semibold text-on-surface">
            {a.paciente?.nome || `Paciente #${a.pacienteId}`}
          </span>
          <span className="font-data-mono text-label-sm text-outline">
            CPF: {mascararCpf(a.paciente?.cpf)}
          </span>
        </div>
      ),
    },
    {
      header: 'Médico / Exame',
      accessor: (a) => (
        <div className="flex flex-col">
          <span className="font-medium text-on-surface">
            {a.exame?.nome || examesMap[a.exameId] || `Exame #${a.exameId}`}
          </span>
          <span className="text-body-sm text-outline">
            {a.medico?.nome || `Médico #${a.medicoId}`} •{' '}
            {formatarCrm(a.medico?.crm)}
          </span>
        </div>
      ),
    },
    {
      header: 'Horário',
      accessor: (a) => (
        <span className="font-data-mono text-body-sm text-outline">
          {tempoRelativo(a.criadoEm)}
        </span>
      ),
    },
    {
      header: 'Ação',
      align: 'right',
      accessor: (a) => (
        <Button
          variant="primary"
          size="sm"
          onClick={() => {
            setErroFinalizacao(null);
            setAtendimentoParaFinalizar(a);
          }}
          leftIcon={<CheckCircle2 size={14} />}
        >
          Finalizar
        </Button>
      ),
    },
  ];

  const insumosAtendimentoFinalizar = useMemo(() => {
    if (!atendimentoParaFinalizar) return [];
    return vinculosPorExame[atendimentoParaFinalizar.exameId] || [];
  }, [atendimentoParaFinalizar, vinculosPorExame]);

  return (
    <div className="w-full max-w-[1600px] mx-auto px-gutter lg:px-margin-desktop py-space-lg flex flex-col gap-space-xl">
      <PageHeader
        breadcrumbs={[{ label: 'Início' }, { label: 'Painel Geral' }]}
        titulo="Painel Geral da Clínica"
        subtitulo="Visão consolidada de atendimentos em andamento, controle de suprimentos e alertas de estoque."
        acoes={
          <>
            <Button
              variant="secondary"
              onClick={carregarDashboard}
              disabled={isLoading}
              leftIcon={
                <RefreshCw
                  size={16}
                  className={isLoading ? 'animate-spin' : ''}
                />
              }
            >
              <span className="flex flex-col items-start leading-none">
                <span>Atualizar</span>
                {lastUpdatedAt && (
                  <span className="text-[10px] text-outline font-data-mono font-normal mt-0.5">
                    {tempoRelativo(lastUpdatedAt)}
                  </span>
                )}
              </span>
            </Button>

            {canMovimentar && (
              <Button
                variant="secondary"
                onClick={() => handleAbrirModalEntrada()}
                leftIcon={<PackagePlus size={16} />}
              >
                + Entrada de Estoque
              </Button>
            )}

            {canReadAtendimentos && (
              <Button
                onClick={() => navigate('/atendimentos?novo=1')}
                leftIcon={<PlusCircle size={16} />}
              >
                + Novo Atendimento
              </Button>
            )}
          </>
        }
      />

      {/* Grid de KPIs (filtrados pelo perfil) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-space-md">
        {canReadAtendimentos && (
          <MetricCard
            titulo="Total de Atendimentos"
            valor={
              dashboard?.totalAtendimentos ??
              totalEmAtendimentoCount + totalFinalizadosCount
            }
            tom="primary"
            icone={<ClipboardList size={20} />}
            loading={isLoading}
            detalhe={
              <div className="flex flex-wrap items-center justify-between gap-1 bg-surface-container-low px-space-sm py-1.5 rounded-lg">
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                  <strong className="font-semibold text-on-surface font-data-mono">
                    {totalEmAtendimentoCount}
                  </strong>{' '}
                  em aberto
                </span>
                <span className="font-data-mono text-outline">|</span>
                <span className="text-outline">
                  <strong className="font-semibold text-on-surface font-data-mono">
                    {totalFinalizadosCount}
                  </strong>{' '}
                  finalizados
                </span>
                {Math.max(
                  0,
                  (dashboard?.totalAtendimentos ?? 0) -
                    totalEmAtendimentoCount -
                    totalFinalizadosCount
                ) > 0 && (
                  <>
                    <span className="font-data-mono text-outline">|</span>
                    <span className="text-outline">
                      <strong className="font-semibold text-on-surface font-data-mono">
                        {Math.max(
                          0,
                          (dashboard?.totalAtendimentos ?? 0) -
                            totalEmAtendimentoCount -
                            totalFinalizadosCount
                        )}
                      </strong>{' '}
                      cancelados
                    </span>
                  </>
                )}
              </div>
            }
          />
        )}

        {canReadSaldo && (
          <MetricCard
            titulo="Insumos em Nível Crítico"
            valor={metricasEstoque.criticosCount}
            sufixo={
              metricasEstoque.criticosCount > 0 ? (
                <StatusBadge variant="critico" label="Abaixo do Mínimo" />
              ) : undefined
            }
            tom={metricasEstoque.criticosCount > 0 ? 'error' : 'secondary'}
            icone={<AlertTriangle size={20} />}
            loading={isLoading}
            detalhe={
              <div className="flex items-center justify-between">
                <span className="text-outline">
                  {metricasEstoque.criticosCount > 0
                    ? 'Reposição necessária'
                    : 'Níveis operacionais seguros'}
                </span>
                <Link
                  to="/estoque/saldo"
                  className="text-primary hover:text-primary-container font-label-sm text-label-sm font-bold inline-flex items-center gap-1 no-underline"
                >
                  <span>Ver itens</span>
                  <ArrowRight size={13} />
                </Link>
              </div>
            }
          />
        )}

        {canReadAtendimentos && (
          <MetricCard
            titulo="Exames Realizados Hoje"
            valor={metricasExamesHoje.totalHoje}
            sufixo={
              <span className="px-2 py-0.5 rounded-full bg-surface-container text-on-surface-variant font-label-sm text-label-sm font-semibold">
                {metricasExamesHoje.protocolosDistintos} protocolo(s)
              </span>
            }
            tom="secondary"
            icone={<CheckCircle2 size={20} />}
            loading={isLoading}
            detalhe="Atendimentos finalizados na data de hoje"
          />
        )}

        {canReadSaldo && (
          <MetricCard
            titulo="Insumos em Conformidade"
            valor={`${metricasEstoque.conformes} de ${metricasEstoque.total}`}
            tom="secondary"
            icone={<Package size={20} />}
            loading={isLoading}
            detalhe="Acima da faixa de atenção e estoque mínimo"
          />
        )}
      </div>

      {/* Linha Principal: Alertas de Estoque Crítico & Ranking Exames & Consumo */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-space-lg items-start">
        {canReadSaldo && (
          <div className="xl:col-span-2 bg-surface-container-lowest p-space-lg rounded-xl border border-outline-variant/40 shadow-[0_1px_2px_0_rgb(15_23_42/0.04)] flex flex-col gap-space-md text-left">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <div>
                <h2 className="text-headline-sm font-semibold text-on-surface m-0">
                  Alertas de Estoque Crítico
                </h2>
                <p className="text-body-sm text-outline m-0">
                  Insumos em ruptura ou abaixo da quantidade mínima estipulada.
                </p>
              </div>
              <Link
                to="/estoque/saldo"
                className="text-label-md text-primary hover:underline font-semibold inline-flex items-center gap-1 no-underline"
              >
                <span>Ver posição completa</span>
                <ArrowRight size={14} />
              </Link>
            </div>

            {isLoading ? (
              <div className="flex flex-col gap-2">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-12 w-full" />
              </div>
            ) : (
              <Table
                columns={colunasAlertasCriticos}
                data={metricasEstoque.itensCriticos.slice(0, 6)}
                keyExtractor={(item) => item.id}
                emptyMessage="Nenhum insumo em nível crítico no momento."
              />
            )}
          </div>
        )}

        {canReadAtendimentos && (
          <div
            className={`${
              canReadSaldo ? 'xl:col-span-1' : 'xl:col-span-3'
            } bg-surface-container-lowest p-space-lg rounded-xl border border-outline-variant/40 shadow-[0_1px_2px_0_rgb(15_23_42/0.04)] flex flex-col gap-space-md text-left`}
          >
            <div className="flex items-center justify-between gap-2">
              <div>
                <h2 className="text-headline-sm font-semibold text-on-surface m-0">
                  Exames & Consumo
                </h2>
                <p className="text-body-sm text-outline m-0">
                  Procedimentos mais realizados e ficha técnica associada.
                </p>
              </div>
              <ClipboardList size={18} className="text-primary shrink-0" />
            </div>

            {isLoading ? (
              <div className="flex flex-col gap-3">
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
              </div>
            ) : !dashboard?.examesMaisRealizados ||
              dashboard.examesMaisRealizados.length === 0 ? (
              <div className="p-space-lg rounded-xl bg-surface-container-low/50 text-center text-body-sm text-outline">
                Nenhum atendimento finalizado registrado até o momento.
              </div>
            ) : (
              <div className="flex flex-col gap-space-md">
                {dashboard.examesMaisRealizados.map((item) => {
                  const nome =
                    examesMap[item.exameId] || `Exame #${item.exameId}`;
                  const count = item._count.id;
                  const percent =
                    totalExamesNoGrafico > 0
                      ? Math.round((count / totalExamesNoGrafico) * 100)
                      : 0;
                  const ficha = vinculosPorExame[item.exameId] || [];

                  return (
                    <div
                      key={item.exameId}
                      className="flex flex-col gap-1.5 p-space-sm rounded-xl bg-surface-container-low/60 border border-outline-variant/30"
                    >
                      <div className="flex items-center justify-between text-body-md">
                        <span className="font-semibold text-on-surface">
                          {nome}
                        </span>
                        <span className="font-data-mono tabular-nums text-label-md font-bold text-primary">
                          {count} ({percent}%)
                        </span>
                      </div>

                      <div className="w-full h-2 rounded-full bg-surface-container-high overflow-hidden">
                        <div
                          className="h-full rounded-full bg-primary transition-all duration-300"
                          style={{ width: `${percent}%` }}
                        />
                      </div>

                      <div className="text-body-sm text-outline mt-0.5">
                        {ficha.length === 0 ? (
                          <span className="italic">
                            Sem insumos vinculados na ficha técnica
                          </span>
                        ) : (
                          <span>
                            <strong className="text-on-surface-variant font-medium">
                              Consome:
                            </strong>{' '}
                            {ficha
                              .map((v) => {
                                const nIns =
                                  v.insumo?.nome ||
                                  insumosMap[v.insumoId] ||
                                  `#${v.insumoId}`;
                                return `${nIns} (×${v.quantidade})`;
                              })
                              .join(', ')}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Segunda Linha: Atendimentos em Aberto + Histórico Recente de Movimentações */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-space-lg items-start">
        {canReadAtendimentos && (
          <div
            className={`${
              canReadSaldo ? 'xl:col-span-2' : 'xl:col-span-3'
            } bg-surface-container-lowest p-space-lg rounded-xl border border-outline-variant/40 shadow-[0_1px_2px_0_rgb(15_23_42/0.04)] flex flex-col gap-space-md text-left`}
          >
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <div className="flex items-center gap-2">
                <Clock size={18} className="text-tertiary" />
                <div>
                  <h2 className="text-headline-sm font-semibold text-on-surface m-0">
                    Atendimentos em Aberto
                  </h2>
                  <p className="text-body-sm text-outline m-0">
                    Pacientes aguardando finalização do exame e baixa de estoque.
                  </p>
                </div>
              </div>
              <Link
                to="/atendimentos"
                className="text-label-md text-primary hover:underline font-semibold inline-flex items-center gap-1 no-underline"
              >
                <span>Ver todos</span>
                <ArrowRight size={14} />
              </Link>
            </div>

            {isLoading ? (
              <div className="flex flex-col gap-2">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-12 w-full" />
              </div>
            ) : (
              <Table
                columns={colunasAtendimentosAbertos}
                data={atendimentosEmAberto}
                keyExtractor={(a) => a.id}
                emptyMessage="Nenhum atendimento em aberto no momento."
              />
            )}
          </div>
        )}

        {/* Histórico recente de movimentações (card compacto mantido conforme Seção 7.1) */}
        {canReadSaldo && (
          <div
            className={`${
              canReadAtendimentos ? 'xl:col-span-1' : 'xl:col-span-3'
            } bg-surface-container-lowest p-space-lg rounded-xl border border-outline-variant/40 shadow-[0_1px_2px_0_rgb(15_23_42/0.04)] flex flex-col gap-space-md text-left`}
          >
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <History size={18} className="text-primary" />
                <h2 className="text-headline-sm font-semibold text-on-surface m-0">
                  Últimas Movimentações
                </h2>
              </div>
              <Link
                to="/estoque/movimentacoes"
                className="text-label-sm text-primary hover:underline font-semibold no-underline"
              >
                Extrato Completo
              </Link>
            </div>

            {isLoading ? (
              <div className="flex flex-col gap-2">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
              </div>
            ) : movimentacoesRecentes.length === 0 ? (
              <div className="p-space-lg rounded-xl bg-surface-container-low/50 text-center text-body-sm text-outline">
                Nenhuma movimentação registrada no histórico.
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                {movimentacoesRecentes.map((m) => {
                  const t = m.tipo.toUpperCase();
                  const isNegativo = t === 'SAIDA' || m.quantidade < 0;
                  const absQtd = Math.abs(m.quantidade);
                  return (
                    <div
                      key={m.id}
                      className="flex items-center justify-between gap-2 px-3 py-2.5 rounded-lg bg-surface-container-low/70 border border-outline-variant/25 text-body-sm"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        {t === 'ENTRADA' ? (
                          <ArrowUpCircle
                            size={15}
                            className="text-secondary shrink-0"
                          />
                        ) : t === 'SAIDA' ? (
                          <ArrowDownCircle
                            size={15}
                            className="text-error shrink-0"
                          />
                        ) : (
                          <Sliders
                            size={15}
                            className="text-tertiary shrink-0"
                          />
                        )}
                        <span className="font-medium text-on-surface truncate">
                          {m.insumo?.nome || `Insumo #${m.insumoId ?? m.id}`}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <strong
                          className={`font-data-mono tabular-nums ${
                            isNegativo ? 'text-error' : 'text-secondary'
                          }`}
                        >
                          {isNegativo
                            ? `-${formatarNumero(absQtd)}`
                            : `+${formatarNumero(absQtd)}`}
                        </strong>
                        <span className="text-label-sm text-outline">
                          {tempoRelativo(m.createdAt)}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modal de Entrada de Estoque (7.2) */}
      <Modal
        isOpen={isEntradaModalOpen}
        onClose={() => !isSubmitting && setIsEntradaModalOpen(false)}
        title="Registrar Entrada de Estoque"
        subtitle="Adicione unidades ao saldo físico do insumo selecionado."
      >
        <form
          onSubmit={handleSubmit(onSubmitEntrada)}
          className="flex flex-col gap-space-md"
        >
          <Select
            label="Insumo *"
            options={saldos.map((s) => ({
              label: `${s.nome} (Saldo atual: ${formatarNumero(s.saldo)})`,
              value: s.id,
            }))}
            error={errors.insumoId?.message}
            {...register('insumoId', { valueAsNumber: true })}
          />

          <Input
            label="Quantidade *"
            type="number"
            min={1}
            step={1}
            className="font-data-mono tabular-nums"
            error={errors.quantidade?.message}
            {...register('quantidade', { valueAsNumber: true })}
          />

          <Input
            label="Motivo / Referência *"
            placeholder="Ex: Reposição de estoque - NF 4589"
            error={errors.motivo?.message}
            {...register('motivo')}
          />

          <div className="flex justify-end gap-space-sm mt-space-xs">
            <Button
              variant="secondary"
              type="button"
              onClick={() => setIsEntradaModalOpen(false)}
              disabled={isSubmitting}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              isLoading={isSubmitting}
              leftIcon={<ArrowUpCircle size={16} />}
            >
              Confirmar Entrada
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal de Finalizar Atendimento (7.4) */}
      <Modal
        isOpen={Boolean(atendimentoParaFinalizar)}
        onClose={() => !isFinalizando && setAtendimentoParaFinalizar(null)}
        title="Confirmar Finalização de Atendimento"
        subtitle={
          atendimentoParaFinalizar
            ? `Atendimento #${atendimentoParaFinalizar.id}`
            : undefined
        }
      >
        {atendimentoParaFinalizar && (
          <div className="flex flex-col gap-space-md">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-space-sm p-space-md rounded-xl bg-surface-container-low border border-outline-variant/40 text-body-sm">
              <div>
                <span className="text-label-sm uppercase text-outline block">
                  Paciente
                </span>
                <strong className="text-on-surface">
                  {atendimentoParaFinalizar.paciente?.nome ||
                    `Paciente #${atendimentoParaFinalizar.pacienteId}`}
                </strong>
              </div>
              <div>
                <span className="text-label-sm uppercase text-outline block">
                  Exame
                </span>
                <strong className="text-on-surface">
                  {atendimentoParaFinalizar.exame?.nome ||
                    examesMap[atendimentoParaFinalizar.exameId] ||
                    `Exame #${atendimentoParaFinalizar.exameId}`}
                </strong>
              </div>
            </div>

            <div className="flex flex-col gap-space-xs">
              <span className="text-label-md font-semibold text-on-surface">
                Insumos a baixar ao finalizar:
              </span>
              {insumosAtendimentoFinalizar.length === 0 ? (
                <p className="text-body-sm text-outline m-0">
                  Este exame não possui insumos vinculados na ficha técnica.
                </p>
              ) : (
                <div className="flex flex-col gap-1.5">
                  {insumosAtendimentoFinalizar.map((v) => {
                    const nomeIns =
                      v.insumo?.nome ||
                      insumosMap[v.insumoId] ||
                      `Insumo #${v.insumoId}`;
                    return (
                      <div
                        key={v.id}
                        className="flex items-center justify-between px-3 py-2 rounded-lg bg-surface-container-lowest border border-outline-variant/30 text-body-sm"
                      >
                        <span className="font-medium text-on-surface">
                          {nomeIns}
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

            <div className="flex justify-end gap-space-sm pt-space-sm border-t border-outline-variant/30">
              <Button
                variant="secondary"
                type="button"
                onClick={() => setAtendimentoParaFinalizar(null)}
                disabled={isFinalizando}
              >
                Voltar
              </Button>
              <Button
                onClick={handleConfirmarFinalizacao}
                isLoading={isFinalizando}
                disabled={isFinalizando}
                leftIcon={<CheckCircle2 size={16} />}
              >
                Confirmar Baixa
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  AlertTriangle,
  ArrowDownCircle,
  ArrowUpCircle,
  Clock,
  History,
  Package,
  PackagePlus,
  RefreshCw,
  Search,
  Sliders,
} from 'lucide-react';
import { toast } from 'sonner';

import { api } from '../api/api';
import { useAuth } from '../contexts/AuthContext';
import { hasRouteAccess } from '../types/auth';
import type { EstoqueSaldoItem } from '../types/estoqueSaldo';
import { getNivelEstoque, type NivelEstoqueStatus } from '../utils/estoque';
import { formatarNumero } from '../utils/format';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { MetricCard } from '../components/ui/MetricCard';
import { Modal } from '../components/ui/Modal';
import { PageHeader } from '../components/ui/PageHeader';
import { Pagination } from '../components/ui/Pagination';
import { ProgressBar } from '../components/ui/ProgressBar';
import { Select } from '../components/ui/Select';
import { Skeleton } from '../components/ui/Skeleton';
import { StatusBadge } from '../components/ui/StatusBadge';
import { Table, type Column } from '../components/ui/Table';
import { Tabs, type RouteTabItem } from '../components/ui/Tabs';

const quickMovSchema = z.object({
  insumoId: z.number({ message: 'Selecione um insumo' }).min(1, 'Selecione um insumo'),
  quantidade: z
    .number({ message: 'Informe uma quantidade válida' })
    .int('A quantidade deve ser um número inteiro')
    .min(1, 'A quantidade deve ser maior que zero'),
  motivo: z.string().min(3, 'Informe o motivo ou referência (mín. 3 caracteres)'),
});

type QuickMovFormData = z.infer<typeof quickMovSchema>;

type SortOption = 'criticidade' | 'nome' | 'saldoAsc' | 'saldoDesc';

const CRITICIDADE_PESO: Record<NivelEstoqueStatus, number> = {
  critico: 0,
  atencao: 1,
  conforme: 2,
};

export function EstoqueSaldo() {
  const navigate = useNavigate();
  const { perfil } = useAuth();
  const canMovimentar = hasRouteAccess(perfil, '/estoque');

  const [saldos, setSaldos] = useState<EstoqueSaldoItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'todos' | NivelEstoqueStatus>('todos');
  const [sortBy, setSortBy] = useState<SortOption>('criticidade');
  const [page, setPage] = useState(1);
  const pageSize = 10;

  // Modal rápido de Entrada / Saída
  const [quickModal, setQuickModal] = useState<{
    open: boolean;
    tipo: 'entrada' | 'saida';
    insumo?: EstoqueSaldoItem;
  }>({ open: false, tipo: 'entrada' });

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<QuickMovFormData>({
    resolver: zodResolver(quickMovSchema),
    defaultValues: {
      insumoId: 0,
      quantidade: 1,
      motivo: '',
    },
  });

  const watchedInsumoId = watch('insumoId');
  const watchedQuantidade = watch('quantidade');

  const selectedInsumoSaldo = useMemo(
    () => saldos.find((s) => s.id === Number(watchedInsumoId)),
    [saldos, watchedInsumoId]
  );

  const carregarSaldos = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await api.get('/estoque/saldo');
      const data: EstoqueSaldoItem[] = Array.isArray(response.data)
        ? response.data
        : response.data?.items || [];
      setSaldos(data);
    } catch {
      toast.error('Erro ao carregar posição de saldo consolidado de estoque');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    carregarSaldos();
  }, [carregarSaldos]);

  const tabsItems = useMemo<RouteTabItem[]>(() => {
    const items: RouteTabItem[] = [
      {
        label: 'Saldo Atual de Insumos',
        to: '/estoque/saldo',
        icon: <Package size={15} />,
      },
      {
        label: 'Histórico de Movimentações',
        to: '/estoque/movimentacoes',
        icon: <History size={15} />,
      },
    ];
    if (canMovimentar) {
      items.push({
        label: 'Movimentar (Entrada / Saída / Ajuste)',
        to: '/estoque',
        icon: <Sliders size={15} />,
      });
    }
    return items;
  }, [canMovimentar]);

  const kpis = useMemo(() => {
    let criticos = 0;
    let atencao = 0;
    let conformes = 0;
    saldos.forEach((item) => {
      const st = getNivelEstoque(item.saldo, item.quantidadeMinima).status;
      if (st === 'critico') criticos++;
      else if (st === 'atencao') atencao++;
      else conformes++;
    });
    return {
      total: saldos.length,
      criticos,
      atencao,
      conformes,
    };
  }, [saldos]);

  const filteredAndSortedSaldos = useMemo(() => {
    const term = searchTerm.toLowerCase().trim();
    const list = saldos.filter((item) => {
      const nivel = getNivelEstoque(item.saldo, item.quantidadeMinima);
      if (statusFilter !== 'todos' && nivel.status !== statusFilter) {
        return false;
      }
      if (!term) return true;
      return (
        item.nome.toLowerCase().includes(term) ||
        String(item.id).includes(term)
      );
    });

    return [...list].sort((a, b) => {
      if (sortBy === 'nome') {
        return a.nome.localeCompare(b.nome, 'pt-BR');
      }
      if (sortBy === 'saldoAsc') {
        return a.saldo - b.saldo;
      }
      if (sortBy === 'saldoDesc') {
        return b.saldo - a.saldo;
      }
      // criticidade (padrão)
      const nivA = getNivelEstoque(a.saldo, a.quantidadeMinima);
      const nivB = getNivelEstoque(b.saldo, b.quantidadeMinima);
      const diffPeso =
        CRITICIDADE_PESO[nivA.status] - CRITICIDADE_PESO[nivB.status];
      if (diffPeso !== 0) return diffPeso;
      if (nivA.ratio !== nivB.ratio) return nivA.ratio - nivB.ratio;
      return a.nome.localeCompare(b.nome, 'pt-BR');
    });
  }, [saldos, searchTerm, statusFilter, sortBy]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredAndSortedSaldos.length / pageSize)
  );
  const paginatedSaldos = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredAndSortedSaldos.slice(start, start + pageSize);
  }, [filteredAndSortedSaldos, page, pageSize]);

  function openQuickModal(tipo: 'entrada' | 'saida', item?: EstoqueSaldoItem) {
    reset({
      insumoId: item?.id ?? (saldos[0]?.id || 0),
      quantidade: 1,
      motivo: '',
    });
    setQuickModal({ open: true, tipo, insumo: item });
  }

  async function onSubmitQuickMov(data: QuickMovFormData) {
    if (
      quickModal.tipo === 'saida' &&
      selectedInsumoSaldo &&
      data.quantidade > selectedInsumoSaldo.saldo
    ) {
      setError('quantidade', {
        type: 'manual',
        message: `Saldo disponível insuficiente (${formatarNumero(selectedInsumoSaldo.saldo)}).`,
      });
      return;
    }

    try {
      await api.post(`/estoque/${quickModal.tipo}`, {
        insumoId: Number(data.insumoId),
        quantidade: Number(data.quantidade),
        motivo: data.motivo.trim(),
      });
      toast.success(
        quickModal.tipo === 'entrada'
          ? 'Entrada registrada com sucesso! Saldo recalculado.'
          : 'Saída registrada com sucesso! Saldo recalculado.'
      );
      setQuickModal({ open: false, tipo: 'entrada' });
      await carregarSaldos();
    } catch (err: unknown) {
      let msg = 'Erro ao registrar movimentação de estoque';
      if (err && typeof err === 'object' && 'response' in err) {
        const axErr = err as { response?: { data?: { message?: string; error?: string } } };
        msg = axErr.response?.data?.message || axErr.response?.data?.error || msg;
      }
      toast.error(msg);
    }
  }

  const columns: Column<EstoqueSaldoItem>[] = [
    {
      header: 'Insumo',
      accessor: (item) => {
        const nivel = getNivelEstoque(item.saldo, item.quantidadeMinima);
        return (
          <div className="flex items-center gap-2">
            <span className="font-data-mono text-label-sm text-outline">
              #{item.id}
            </span>
            <span
              className={
                nivel.status === 'critico'
                  ? 'font-semibold text-error'
                  : 'font-semibold text-on-surface'
              }
            >
              {item.nome}
            </span>
          </div>
        );
      },
    },
    {
      header: 'Saldo Atual',
      align: 'right',
      accessor: (item) => {
        const nivel = getNivelEstoque(item.saldo, item.quantidadeMinima);
        return (
          <strong
            className={`text-body-lg font-data-mono tabular-nums ${
              nivel.status === 'critico'
                ? 'text-error'
                : nivel.status === 'atencao'
                ? 'text-tertiary'
                : 'text-on-surface'
            }`}
          >
            {formatarNumero(item.saldo)}
          </strong>
        );
      },
    },
    {
      header: 'Estoque Mínimo',
      align: 'right',
      accessor: (item) => (
        <span className="font-data-mono tabular-nums text-on-surface-variant">
          {formatarNumero(item.quantidadeMinima)}
        </span>
      ),
    },
    {
      header: 'Nível de Cobertura',
      accessor: (item) => (
        <div className="flex items-center gap-2 min-w-[140px] max-w-[200px]">
          <ProgressBar saldo={item.saldo} minimo={item.quantidadeMinima} />
        </div>
      ),
    },
    {
      header: 'Status',
      accessor: (item) => {
        const nivel = getNivelEstoque(item.saldo, item.quantidadeMinima);
        return <StatusBadge variant={nivel.status} label={nivel.label} />;
      },
    },
    ...(canMovimentar
      ? [
          {
            header: 'Ações Rápidas',
            align: 'right',
            accessor: (item: EstoqueSaldoItem) => (
              <div className="flex items-center justify-end gap-1.5">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => openQuickModal('entrada', item)}
                  leftIcon={<ArrowUpCircle size={14} className="text-secondary" />}
                >
                  Entrada
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => openQuickModal('saida', item)}
                  leftIcon={<ArrowDownCircle size={14} className="text-error" />}
                >
                  Saída
                </Button>
              </div>
            ),
          } satisfies Column<EstoqueSaldoItem>,
        ]
      : []),
  ];

  return (
    <div className="w-full max-w-[1600px] mx-auto px-gutter lg:px-margin-desktop py-space-lg flex flex-col gap-space-lg">
      <PageHeader
        breadcrumbs={[
          { label: 'Início', to: '/' },
          { label: 'Estoque' },
          { label: 'Saldo Consolidado' },
        ]}
        titulo="Controle de Estoque"
        subtitulo="Posição física calculada pelo servidor, alertas de estoque mínimo e histórico auditável."
        acoes={
          <>
            <Button
              variant="secondary"
              onClick={carregarSaldos}
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
            {canMovimentar && (
              <>
                <Button
                  variant="secondary"
                  onClick={() => navigate('/estoque')}
                  leftIcon={<Sliders size={16} />}
                >
                  Movimentar / Ajuste
                </Button>
                <Button
                  onClick={() => openQuickModal('entrada')}
                  leftIcon={<PackagePlus size={16} />}
                >
                  Registrar Entrada
                </Button>
              </>
            )}
          </>
        }
      />

      {/* Abas de rota do módulo Estoque */}
      <div className="flex items-center justify-between flex-wrap gap-space-sm">
        <Tabs items={tabsItems} />
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-space-md">
        <MetricCard
          titulo="Insumos Ativos"
          valor={kpis.total}
          tom="primary"
          icone={<Package size={20} />}
          loading={isLoading}
          detalhe={`${kpis.conformes} em conformidade operacional`}
        />
        <MetricCard
          titulo="Abaixo do Mínimo"
          valor={kpis.criticos}
          tom={kpis.criticos > 0 ? 'error' : 'secondary'}
          icone={<AlertTriangle size={20} />}
          loading={isLoading}
          detalhe={
            kpis.criticos > 0
              ? 'Requerem reposição imediata'
              : 'Nenhum insumo em ruptura ou abaixo do mínimo'
          }
        />
        <MetricCard
          titulo="Em Faixa de Atenção"
          valor={kpis.atencao}
          tom={kpis.atencao > 0 ? 'tertiary' : 'secondary'}
          icone={<Clock size={20} />}
          loading={isLoading}
          detalhe="Saldo até 20% acima do mínimo estipulado"
        />
      </div>

      {/* Barra de Filtros e Ordenação */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-space-md bg-surface-container-lowest p-space-md rounded-xl border border-outline-variant/40">
        <div className="flex flex-wrap items-center gap-space-sm flex-1">
          <div className="w-full sm:max-w-xs">
            <Input
              placeholder="Buscar insumo por nome ou #id..."
              leftIcon={<Search size={16} />}
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setPage(1);
              }}
            />
          </div>

          <div className="inline-flex items-center gap-1 p-1 rounded-lg bg-surface-container-low">
            {(
              [
                { id: 'todos', label: `Todos (${kpis.total})` },
                { id: 'critico', label: `Crítico (${kpis.criticos})` },
                { id: 'atencao', label: `Atenção (${kpis.atencao})` },
                { id: 'conforme', label: `Conforme (${kpis.conformes})` },
              ] as const
            ).map((st) => (
              <button
                key={st.id}
                type="button"
                onClick={() => {
                  setStatusFilter(st.id);
                  setPage(1);
                }}
                className={`px-3 py-1.5 rounded-md text-label-sm transition-colors cursor-pointer ${
                  statusFilter === st.id
                    ? 'bg-surface-container-lowest text-primary font-semibold shadow-2xs'
                    : 'text-on-surface-variant hover:text-on-surface'
                }`}
              >
                {st.label}
              </button>
            ))}
          </div>

          <div className="w-52">
            <Select
              placeholder="Ordenar por..."
              options={[
                { label: 'Prioridade: Criticidade', value: 'criticidade' },
                { label: 'Nome (A-Z)', value: 'nome' },
                { label: 'Menor Saldo (↑)', value: 'saldoAsc' },
                { label: 'Maior Saldo (↓)', value: 'saldoDesc' },
              ]}
              value={sortBy}
              onChange={(e) =>
                setSortBy((e.target.value as SortOption) || 'criticidade')
              }
            />
          </div>
        </div>

        <span className="text-body-sm text-outline">
          Exibindo{' '}
          <strong className="font-data-mono text-on-surface">
            {filteredAndSortedSaldos.length}
          </strong>{' '}
          insumo(s)
        </span>
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
            data={paginatedSaldos}
            keyExtractor={(item) => item.id}
            emptyMessage="Nenhum insumo encontrado para os filtros selecionados."
          />

          <Pagination
            page={page}
            totalPages={totalPages}
            total={filteredAndSortedSaldos.length}
            isLoading={isLoading}
            onPageChange={setPage}
            itemLabel="insumos"
          />
        </>
      )}

      {/* Modal Rápido de Entrada / Saída */}
      <Modal
        isOpen={quickModal.open}
        onClose={() =>
          !isSubmitting && setQuickModal((prev) => ({ ...prev, open: false }))
        }
        title={
          quickModal.tipo === 'entrada'
            ? 'Registrar Entrada de Estoque'
            : 'Registrar Saída Manual de Estoque'
        }
        subtitle="A operação recalcula imediatamente o saldo após confirmação do servidor."
      >
        <form
          onSubmit={handleSubmit(onSubmitQuickMov)}
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

          {selectedInsumoSaldo && (
            <div className="flex items-center justify-between p-space-sm px-space-md rounded-lg bg-surface-container-low text-body-sm">
              <span className="text-on-surface-variant">
                Saldo disponível:{' '}
                <strong className="font-data-mono text-on-surface">
                  {formatarNumero(selectedInsumoSaldo.saldo)}
                </strong>
              </span>
              <span className="text-outline">
                Mínimo:{' '}
                <strong className="font-data-mono text-on-surface">
                  {formatarNumero(selectedInsumoSaldo.quantidadeMinima)}
                </strong>
              </span>
            </div>
          )}

          <Input
            label="Quantidade *"
            type="number"
            min={1}
            step={1}
            placeholder="Ex: 50"
            className="font-data-mono tabular-nums"
            error={errors.quantidade?.message}
            hint={
              quickModal.tipo === 'saida' &&
              selectedInsumoSaldo &&
              Number(watchedQuantidade) > selectedInsumoSaldo.saldo
                ? `Atenção: a quantidade informada excede o saldo disponível (${selectedInsumoSaldo.saldo}).`
                : undefined
            }
            {...register('quantidade', { valueAsNumber: true })}
          />

          <Input
            label="Motivo / Observação *"
            placeholder={
              quickModal.tipo === 'entrada'
                ? 'Ex: Reposição mensal - NF 4589'
                : 'Ex: Uso interno ambulatorial / Descarte'
            }
            error={errors.motivo?.message}
            {...register('motivo')}
          />

          <div className="flex justify-end gap-space-sm mt-space-xs">
            <Button
              variant="secondary"
              type="button"
              onClick={() => setQuickModal((prev) => ({ ...prev, open: false }))}
              disabled={isSubmitting}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              variant={quickModal.tipo === 'saida' ? 'danger' : 'primary'}
              isLoading={isSubmitting}
              leftIcon={
                quickModal.tipo === 'entrada' ? (
                  <ArrowUpCircle size={16} />
                ) : (
                  <ArrowDownCircle size={16} />
                )
              }
            >
              {quickModal.tipo === 'entrada'
                ? 'Confirmar Entrada'
                : 'Confirmar Saída'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ArrowDownCircle,
  ArrowUpCircle,
  History,
  Package,
  RefreshCw,
  Sliders,
} from 'lucide-react';
import { toast } from 'sonner';

import { api } from '../api/api';
import { useAuth } from '../contexts/AuthContext';
import { hasRouteAccess } from '../types/auth';
import { formatarNumero, tempoRelativo } from '../utils/format';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { PageHeader } from '../components/ui/PageHeader';
import { Pagination } from '../components/ui/Pagination';
import { Select } from '../components/ui/Select';
import { Skeleton } from '../components/ui/Skeleton';
import { StatusBadge } from '../components/ui/StatusBadge';
import { Table, type Column } from '../components/ui/Table';
import { Tabs, type RouteTabItem } from '../components/ui/Tabs';

interface MovimentacaoItem {
  id: number;
  tipo: 'ENTRADA' | 'SAIDA' | 'AJUSTE' | string;
  quantidade: number;
  motivo?: string;
  createdAt: string;
  insumoId: number;
  usuarioId?: number | null;
  insumo?: {
    id: number;
    nome: string;
  };
  usuario?: {
    nome: string;
    email: string;
  } | null;
}

export function Movimentacoes() {
  const { perfil } = useAuth();
  const canMovimentar = hasRouteAccess(perfil, '/estoque');

  const [movimentacoes, setMovimentacoes] = useState<MovimentacaoItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Filtros
  const [tipoFilter, setTipoFilter] = useState<string>('');
  const [dataInicio, setDataInicio] = useState<string>('');
  const [dataFim, setDataFim] = useState<string>('');

  // Paginação
  const [page, setPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [totalCount, setTotalCount] = useState<number>(0);
  const limit = 10;

  const carregarMovimentacoes = useCallback(async () => {
    setIsLoading(true);
    try {
      const params: Record<string, string | number> = {
        page,
        limit,
      };

      if (tipoFilter) {
        params.tipo = tipoFilter;
      }
      if (dataInicio) {
        const dIni = new Date(`${dataInicio}T00:00:00`);
        params.startDate = dIni.toISOString();
      }
      if (dataFim) {
        const dFim = new Date(`${dataFim}T23:59:59.999`);
        params.endDate = dFim.toISOString();
      }

      const response = await api.get('/estoque/movimentacoes', { params });
      const items: MovimentacaoItem[] =
        response.data?.items ??
        (Array.isArray(response.data) ? response.data : []);
      const total = response.data?.total ?? items.length;
      const pages =
        response.data?.totalPages ?? (Math.ceil(total / limit) || 1);

      setMovimentacoes(items);
      setTotalCount(total);
      setTotalPages(pages);
    } catch {
      toast.error('Erro ao carregar histórico de movimentações');
    } finally {
      setIsLoading(false);
    }
  }, [page, limit, tipoFilter, dataInicio, dataFim]);

  useEffect(() => {
    carregarMovimentacoes();
  }, [carregarMovimentacoes]);

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

  function handleLimparFiltros() {
    setTipoFilter('');
    setDataInicio('');
    setDataFim('');
    setPage(1);
  }

  const columns: Column<MovimentacaoItem>[] = [
    {
      header: 'Data / Hora',
      accessor: (m) => (
        <div className="flex flex-col">
          <span className="font-data-mono text-body-sm text-on-surface">
            {m.createdAt
              ? new Date(m.createdAt).toLocaleString('pt-BR', {
                  day: '2-digit',
                  month: '2-digit',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })
              : '—'}
          </span>
          <span className="text-label-sm text-outline">
            {tempoRelativo(m.createdAt)}
          </span>
        </div>
      ),
    },
    {
      header: 'Tipo',
      accessor: (m) => {
        const t = m.tipo.toUpperCase();
        if (t === 'ENTRADA') {
          return (
            <StatusBadge
              variant="conforme"
              label="ENTRADA"
              icon={<ArrowUpCircle size={14} className="shrink-0" />}
            />
          );
        }
        if (t === 'SAIDA') {
          return (
            <StatusBadge
              variant="critico"
              label="SAÍDA"
              icon={<ArrowDownCircle size={14} className="shrink-0" />}
            />
          );
        }
        return (
          <StatusBadge
            variant="atencao"
            label="AJUSTE"
            icon={<Sliders size={14} className="shrink-0" />}
          />
        );
      },
    },
    {
      header: 'Insumo',
      accessor: (m) => (
        <div className="flex items-center gap-2">
          <span className="font-data-mono text-label-sm text-outline">
            #{m.insumoId}
          </span>
          <strong className="text-on-surface font-semibold">
            {m.insumo?.nome || `Insumo #${m.insumoId}`}
          </strong>
        </div>
      ),
    },
    {
      header: 'Quantidade',
      align: 'right',
      accessor: (m) => {
        const t = m.tipo.toUpperCase();
        const isNegativo = t === 'SAIDA' || m.quantidade < 0;
        const absQtd = Math.abs(m.quantidade);
        return (
          <strong
            className={`font-data-mono tabular-nums ${
              isNegativo ? 'text-error' : 'text-secondary'
            }`}
          >
            {isNegativo
              ? `-${formatarNumero(absQtd)}`
              : `+${formatarNumero(absQtd)}`}
          </strong>
        );
      },
    },
    {
      header: 'Motivo',
      accessor: (m) => (
        <span className="text-body-sm text-on-surface-variant">
          {m.motivo || 'Lançamento manual'}
        </span>
      ),
    },
    {
      header: 'Responsável',
      accessor: (m) => (
        <span
          className="text-body-sm text-on-surface font-medium"
          title={m.usuario?.email || undefined}
        >
          {m.usuario?.nome || 'Sistema'}
        </span>
      ),
    },
  ];

  return (
    <div className="w-full max-w-[1600px] mx-auto px-gutter lg:px-margin-desktop py-space-lg flex flex-col gap-space-lg">
      <PageHeader
        breadcrumbs={[
          { label: 'Início', to: '/' },
          { label: 'Estoque', to: '/estoque/saldo' },
          { label: 'Histórico de Movimentações' },
        ]}
        titulo="Extrato de Movimentações"
        subtitulo="Histórico auditável de entradas, saídas manuais, ajustes e baixas automáticas por atendimento."
        acoes={
          <Button
            variant="secondary"
            onClick={carregarMovimentacoes}
            disabled={isLoading}
            leftIcon={
              <RefreshCw
                size={16}
                className={isLoading ? 'animate-spin' : ''}
              />
            }
          >
            Atualizar Extrato
          </Button>
        }
      />

      <div className="flex items-center justify-between flex-wrap gap-space-sm">
        <Tabs items={tabsItems} />
      </div>

      {/* Painel de Filtros */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-space-md bg-surface-container-lowest p-space-md rounded-xl border border-outline-variant/40 items-end">
        <Select
          label="Tipo de Operação"
          placeholder="Todos os tipos"
          options={[
            { label: 'Entradas', value: 'ENTRADA' },
            { label: 'Saídas', value: 'SAIDA' },
            { label: 'Ajustes de Inventário', value: 'AJUSTE' },
          ]}
          value={tipoFilter}
          onChange={(e) => {
            setTipoFilter(e.target.value);
            setPage(1);
          }}
        />

        <Input
          label="Data Inicial"
          type="date"
          value={dataInicio}
          onChange={(e) => {
            setDataInicio(e.target.value);
            setPage(1);
          }}
        />

        <Input
          label="Data Final"
          type="date"
          value={dataFim}
          onChange={(e) => {
            setDataFim(e.target.value);
            setPage(1);
          }}
        />

        <div className="flex items-center justify-between gap-space-sm">
          <Button
            variant="secondary"
            onClick={handleLimparFiltros}
            className="w-full"
            disabled={!tipoFilter && !dataInicio && !dataFim}
          >
            Limpar Filtros
          </Button>
        </div>
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
            data={movimentacoes}
            keyExtractor={(m) => m.id}
            emptyMessage="Nenhuma movimentação de estoque encontrada para os filtros selecionados."
          />

          <Pagination
            page={page}
            totalPages={totalPages}
            total={totalCount}
            isLoading={isLoading}
            onPageChange={setPage}
            itemLabel="movimentações"
          />
        </>
      )}
    </div>
  );
}

import { useEffect, useState } from 'react';
import {
  ArrowUpCircle,
  ArrowDownCircle,
  Sliders,
  ChevronLeft,
  ChevronRight,
  Loader2,
  RefreshCw,
} from 'lucide-react';
import { toast } from 'sonner';

import { api } from '../api/api';
import { Button } from '../components/ui/Button';
import { Table } from '../components/ui/Table';
import { Select } from '../components/ui/Select';
import { Input } from '../components/ui/Input';

interface MovimentacaoItem {
  id: number;
  tipo: 'ENTRADA' | 'SAIDA' | 'AJUSTE' | string;
  quantidade: number;
  motivo?: string;
  createdAt: string;
  insumoId: number;
  usuarioId?: number;
  insumo?: {
    id: number;
    nome: string;
  };
  usuario?: {
    nome: string;
    email: string;
  };
}

export function Movimentacoes() {
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

  async function carregarMovimentacoes() {
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
        const dIni = new Date(dataInicio);
        dIni.setHours(0, 0, 0, 0);
        params.startDate = dIni.toISOString();
      }
      if (dataFim) {
        const dFim = new Date(dataFim);
        dFim.setHours(23, 59, 59, 999);
        params.endDate = dFim.toISOString();
      }

      const response = await api.get('/estoque/movimentacoes', { params });
      const items: MovimentacaoItem[] =
        response.data?.items ?? (Array.isArray(response.data) ? response.data : []);
      const total = response.data?.total ?? items.length;
      const pages = response.data?.totalPages ?? (Math.ceil(total / limit) || 1);

      setMovimentacoes(items);
      setTotalCount(total);
      setTotalPages(pages);
    } catch {
      toast.error('Erro ao carregar histórico de movimentações');
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    carregarMovimentacoes();
  }, [page, tipoFilter, dataInicio, dataFim]);

  function handleLimparFiltros() {
    setTipoFilter('');
    setDataInicio('');
    setDataFim('');
    setPage(1);
  }

  const columns = [
    { header: 'ID', accessor: 'id' as keyof MovimentacaoItem },
    {
      header: 'Data / Hora',
      accessor: (m: MovimentacaoItem) => (
        <span className="text-xs text-gray-500">
          {m.createdAt ? new Date(m.createdAt).toLocaleString('pt-BR') : '-'}
        </span>
      ),
    },
    {
      header: 'Insumo',
      accessor: (m: MovimentacaoItem) => (
        <strong>{m.insumo?.nome || `Insumo #${m.insumoId}`}</strong>
      ),
    },
    {
      header: 'Tipo',
      accessor: (m: MovimentacaoItem) => {
        const t = m.tipo.toUpperCase();
        if (t === 'ENTRADA') {
          return (
            <div className="flex items-center gap-1 text-green-700">
              <ArrowUpCircle className="size-4" />
              <span className="font-semibold text-xs">ENTRADA</span>
            </div>
          );
        } else if (t === 'SAIDA') {
          return (
            <div className="flex items-center gap-1 text-red-600">
              <ArrowDownCircle className="size-4" />
              <span className="font-semibold text-xs">SAÍDA</span>
            </div>
          );
        }
        return (
          <div className="flex items-center gap-1 text-amber-700">
            <Sliders className="size-4" />
            <span className="font-semibold text-xs">AJUSTE</span>
          </div>
        );
      },
    },
    {
      header: 'Quantidade',
      accessor: (m: MovimentacaoItem) => {
        const isSaida = m.tipo === 'SAIDA';
        return (
          <strong style={{ color: isSaida ? '#dc2626' : '#16a34a' }}>
            {isSaida ? `-${m.quantidade}` : `+${m.quantidade}`}
          </strong>
        );
      },
    },
    {
      header: 'Motivo / Descrição',
      accessor: (m: MovimentacaoItem) => (
        <span className="text-xs text-gray-600">{m.motivo || 'Lançamento manual'}</span>
      ),
    },
    {
      header: 'Responsável',
      accessor: (m: MovimentacaoItem) => (
        <span className="text-xs text-gray-500" title={m.usuario?.email}>
          {m.usuario?.nome || '-'}
        </span>
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-4 p-4 text-left">
      <div className="flex justify-between items-center flex-wrap gap-2">
        <div>
          <h2>Extrato de Movimentações</h2>
          <p className="text-sm text-gray-500">
            Histórico contábil de entradas, saídas e baixas automáticas de estoque
          </p>
        </div>
        <Button
          variant="secondary"
          onClick={carregarMovimentacoes}
          disabled={isLoading}
          leftIcon={<RefreshCw className={`size-4 ${isLoading ? 'animate-spin' : ''}`} />}
        >
          Atualizar Extrato
        </Button>
      </div>

      {/* Painel de Filtros */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: '0.75rem',
          background: 'white',
          padding: '1rem',
          borderRadius: '0.75rem',
          border: '1px solid #e5e7eb',
        }}
      >
        <Select
          label="Filtrar por Tipo"
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

        <div className="flex items-end">
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

      <div className="flex justify-between items-center text-sm text-gray-500 mt-1">
        <span>Total de movimentações registradas: {totalCount}</span>
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center p-12 gap-2">
          <Loader2 className="animate-spin size-8 text-blue-500" />
          <span className="text-sm text-gray-500">Carregando extrato de movimentações...</span>
        </div>
      ) : (
        <>
          <Table
            columns={columns}
            data={movimentacoes}
            keyExtractor={(m) => m.id}
          />

          {totalPages > 1 && (
            <div className="pagination-container">
              <span className="pagination-info">
                Página {page} de {totalPages} ({totalCount} registros)
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
    </div>
  );
}

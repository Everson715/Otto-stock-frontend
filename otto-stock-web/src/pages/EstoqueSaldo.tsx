import { useState, useEffect, useMemo } from 'react';
import { AlertTriangle, CheckCircle, RefreshCw, ChevronLeft, ChevronRight, Loader2, ArrowUpRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';

import { api } from '../api/api';
import type { EstoqueSaldoItem } from '../types/estoqueSaldo';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Table } from '../components/ui/Table';

export function EstoqueSaldo() {
  const [saldos, setSaldos] = useState<EstoqueSaldoItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [apenasCriticos, setApenasCriticos] = useState(false);
  const [page, setPage] = useState(1);
  const pageSize = 10;

  async function carregarSaldos() {
    setIsLoading(true);
    try {
      const response = await api.get('/estoque/saldo');
      const data = Array.isArray(response.data) ? response.data : response.data.items || [];
      setSaldos(data);
    } catch {
      toast.error('Erro ao carregar posição de saldo consolidado de estoque');
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    carregarSaldos();
  }, []);

  const filteredSaldos = useMemo(() => {
    let list = saldos;
    if (apenasCriticos) {
      list = list.filter((item) => item.alerta || item.saldo < item.quantidadeMinima);
    }
    const term = searchTerm.toLowerCase().trim();
    if (term) {
      list = list.filter((item) => item.nome.toLowerCase().includes(term));
    }
    return list;
  }, [saldos, apenasCriticos, searchTerm]);

  const totalPages = Math.ceil(filteredSaldos.length / pageSize) || 1;
  const paginatedSaldos = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredSaldos.slice(start, start + pageSize);
  }, [filteredSaldos, page, pageSize]);

  const totalCriticos = useMemo(() => {
    return saldos.filter((s) => s.alerta || s.saldo < s.quantidadeMinima).length;
  }, [saldos]);

  const columns = [
    { header: 'ID', accessor: 'id' as keyof EstoqueSaldoItem },
    {
      header: 'Insumo',
      accessor: (item: EstoqueSaldoItem) => (
        <span style={{ fontWeight: 500, color: item.alerta ? '#b91c1c' : 'inherit' }}>
          {item.nome}
        </span>
      ),
    },
    {
      header: 'Unidade',
      accessor: () => (
        <span className="text-xs text-gray-400" title="Unidade pendente no backend (ver PENDENCIAS_BACKEND.md)">
          un
        </span>
      ),
    },
    {
      header: 'Saldo Atual',
      accessor: (item: EstoqueSaldoItem) => (
        <strong style={{ fontSize: '1rem', color: item.alerta ? '#b91c1c' : '#047857' }}>
          {item.saldo}
        </strong>
      ),
    },
    {
      header: 'Mínimo Recomendado',
      accessor: (item: EstoqueSaldoItem) => item.quantidadeMinima,
    },
    {
      header: 'Status de Estoque',
      accessor: (item: EstoqueSaldoItem) => {
        const isCritico = item.alerta || item.saldo < item.quantidadeMinima;
        return isCritico ? (
          <span className="badge-alerta" title="Estoque abaixo da quantidade mínima estipulada">
            <AlertTriangle className="size-3" />
            Crítico ({item.saldo - item.quantidadeMinima})
          </span>
        ) : (
          <span className="badge-ok" title="Estoque em nível regular">
            <CheckCircle className="size-3" />
            Regular
          </span>
        );
      },
    },
    {
      header: 'Ação Rápida',
      accessor: () => (
        <Link
          to="/estoque"
          className="btn btn-secondary text-xs"
          style={{ padding: '0.25rem 0.5rem', textDecoration: 'none' }}
        >
          Repor
          <ArrowUpRight className="size-3" />
        </Link>
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-4 p-4 text-left">
      <div className="flex justify-between items-center flex-wrap gap-2">
        <div>
          <h2>Saldo Consolidado de Estoque</h2>
          <p className="text-sm text-gray-500">
            Posição física calculada pelo servidor com sinalização de insumos críticos
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="secondary"
            onClick={carregarSaldos}
            disabled={isLoading}
            leftIcon={<RefreshCw className={`size-4 ${isLoading ? 'animate-spin' : ''}`} />}
          >
            Atualizar
          </Button>
          <Link to="/estoque" className="btn btn-primary" style={{ textDecoration: 'none' }}>
            Movimentar Estoque
          </Link>
        </div>
      </div>

      {/* Cards de Resumo */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginTop: '0.5rem' }}>
        <div style={{ background: 'white', padding: '1rem', borderRadius: '0.75rem', border: '1px solid #e5e7eb' }}>
          <span className="text-xs text-gray-500 block">Total de Insumos Catalogados</span>
          <strong style={{ fontSize: '1.5rem', color: '#111827' }}>{saldos.length}</strong>
        </div>
        <div style={{ background: '#fef2f2', padding: '1rem', borderRadius: '0.75rem', border: '1px solid #fecaca' }}>
          <span className="text-xs text-red-600 font-medium block">Insumos em Nível Crítico</span>
          <strong style={{ fontSize: '1.5rem', color: '#b91c1c' }}>{totalCriticos}</strong>
        </div>
        <div style={{ background: '#f0fdf4', padding: '1rem', borderRadius: '0.75rem', border: '1px solid #bbf7d0' }}>
          <span className="text-xs text-green-700 font-medium block">Insumos Regulares</span>
          <strong style={{ fontSize: '1.5rem', color: '#047857' }}>{saldos.length - totalCriticos}</strong>
        </div>
      </div>

      <div className="flex justify-between items-center flex-wrap gap-2 mt-2">
        <div className="flex gap-2 items-center flex-wrap">
          <div className="search-input-wrapper">
            <Input
              placeholder="Buscar insumo por nome..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setPage(1);
              }}
            />
          </div>
          <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
            <input
              type="checkbox"
              checked={apenasCriticos}
              onChange={(e) => {
                setApenasCriticos(e.target.checked);
                setPage(1);
              }}
            />
            <span>Apenas críticos ({totalCriticos})</span>
          </label>
        </div>
        <span className="text-sm text-gray-500">
          Exibindo {filteredSaldos.length} insumos
        </span>
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center p-12 gap-2">
          <Loader2 className="animate-spin size-8 text-blue-500" />
          <span className="text-sm text-gray-500">Carregando saldo de estoque...</span>
        </div>
      ) : (
        <>
          <Table
            columns={columns}
            data={paginatedSaldos}
            keyExtractor={(item) => item.id}
            emptyMessage="Nenhum insumo encontrado em estoque. Registre entradas no módulo de movimentação para gerar os saldos."
          />

          {filteredSaldos.length > pageSize && (
            <div className="pagination-container">
              <span className="pagination-info">
                Página {page} de {totalPages}
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

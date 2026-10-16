import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  AlertTriangle,
  CheckCircle2,
  ClipboardList,
  Link2,
  RefreshCw,
  Search,
} from 'lucide-react';
import { toast } from 'sonner';

import { api } from '../api/api';
import type { Exame } from '../types/exame';
import type { ExameInsumo } from '../types/exameInsumo';
import type { Insumo } from '../types/insumo';
import { FichaTecnicaDrawer } from '../components/FichaTecnicaDrawer';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { MetricCard } from '../components/ui/MetricCard';
import { PageHeader } from '../components/ui/PageHeader';
import { Pagination } from '../components/ui/Pagination';
import { Skeleton } from '../components/ui/Skeleton';
import { StatusBadge } from '../components/ui/StatusBadge';
import { Table, type Column } from '../components/ui/Table';

export function ExameInsumos() {
  const [searchParams, setSearchParams] = useSearchParams();

  const [exames, setExames] = useState<Exame[]>([]);
  const [vinculos, setVinculos] = useState<ExameInsumo[]>([]);
  const [insumosMap, setInsumosMap] = useState<Record<number, string>>({});
  const [isLoading, setIsLoading] = useState(false);

  const [searchTerm, setSearchTerm] = useState('');
  const [filtroConfiguracao, setFiltroConfiguracao] = useState<
    'todos' | 'parametrizados' | 'pendentes'
  >('todos');
  const [page, setPage] = useState(1);
  const pageSize = 8;

  const selectedExameIdParam = searchParams.get('exameId');
  const selectedExameId = selectedExameIdParam
    ? Number(selectedExameIdParam)
    : null;

  const carregarDados = useCallback(async () => {
    setIsLoading(true);
    try {
      const [resExames, resVinculos, resInsumos] = await Promise.all([
        api.get('/exames'),
        api.get('/exame-insumos'),
        api.get('/insumos', { params: { limit: 200 } }),
      ]);

      const listaExames: Exame[] = Array.isArray(resExames.data)
        ? resExames.data
        : resExames.data?.items || [];
      const listaVinculos: ExameInsumo[] = Array.isArray(resVinculos.data)
        ? resVinculos.data
        : resVinculos.data?.items || [];
      const listaInsumos: Insumo[] = Array.isArray(resInsumos.data)
        ? resInsumos.data
        : resInsumos.data?.items || [];

      const map: Record<number, string> = {};
      listaInsumos.forEach((i) => {
        map[i.id] = i.nome;
      });

      setExames(listaExames);
      setVinculos(listaVinculos);
      setInsumosMap(map);
    } catch {
      toast.error('Erro ao carregar fichas técnicas de exames');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    carregarDados();
  }, [carregarDados]);

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

  const totalExames = exames.length;
  const examesSemInsumos = useMemo(() => {
    return exames.filter((e) => (vinculosPorExame[e.id]?.length ?? 0) === 0)
      .length;
  }, [exames, vinculosPorExame]);
  const examesParametrizados = totalExames - examesSemInsumos;

  const filteredExames = useMemo(() => {
    const term = searchTerm.toLowerCase().trim();
    return exames.filter((e) => {
      const qtdVinculos = vinculosPorExame[e.id]?.length ?? 0;
      if (filtroConfiguracao === 'parametrizados' && qtdVinculos === 0) {
        return false;
      }
      if (filtroConfiguracao === 'pendentes' && qtdVinculos > 0) {
        return false;
      }
      if (!term) return true;
      return (
        e.nome.toLowerCase().includes(term) ||
        String(e.id).includes(term) ||
        (e.descricao && e.descricao.toLowerCase().includes(term))
      );
    });
  }, [exames, vinculosPorExame, filtroConfiguracao, searchTerm]);

  const totalPages = Math.max(1, Math.ceil(filteredExames.length / pageSize));
  const paginatedExames = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredExames.slice(start, start + pageSize);
  }, [filteredExames, page, pageSize]);

  function handleOpenDrawer(exameId: number) {
    const next = new URLSearchParams(searchParams);
    next.set('exameId', String(exameId));
    setSearchParams(next);
  }

  function handleCloseDrawer() {
    const next = new URLSearchParams(searchParams);
    next.delete('exameId');
    setSearchParams(next, { replace: true });
  }

  const selectedExameObj = useMemo(
    () => exames.find((e) => e.id === selectedExameId) || null,
    [exames, selectedExameId]
  );

  const columns: Column<Exame>[] = [
    {
      header: 'Código',
      accessor: (e) => (
        <span className="font-data-mono text-label-md text-outline">
          #{e.id}
        </span>
      ),
    },
    {
      header: 'Exame / Procedimento',
      accessor: (e) => (
        <div className="flex flex-col">
          <span className="font-semibold text-on-surface">{e.nome}</span>
          {e.descricao && (
            <span className="text-body-sm text-outline">{e.descricao}</span>
          )}
        </div>
      ),
    },
    {
      header: 'Insumos Requeridos (Baixa por Exame)',
      accessor: (e) => {
        const lista = vinculosPorExame[e.id] || [];
        if (lista.length === 0) {
          return (
            <span className="text-body-sm text-outline italic">
              Nenhum insumo vinculado
            </span>
          );
        }
        const visiveis = lista.slice(0, 3);
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
      header: 'Status da Ficha',
      accessor: (e) => {
        const qtd = vinculosPorExame[e.id]?.length ?? 0;
        return qtd > 0 ? (
          <StatusBadge
            variant="conforme"
            label={`${qtd} insumo(s)`}
          />
        ) : (
          <StatusBadge variant="atencao" label="Sem insumos" />
        );
      },
    },
    {
      header: 'Ações',
      align: 'right',
      accessor: (e) => (
        <div className="flex items-center justify-end">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => handleOpenDrawer(e.id)}
            leftIcon={<Link2 size={14} />}
          >
            Ficha Técnica
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
          { label: 'Ficha Técnica' },
        ]}
        titulo="Ficha Técnica de Exames"
        subtitulo="Gerencie os insumos e quantidades consumidas automaticamente na finalização de cada exame."
        acoes={
          <Button
            variant="secondary"
            onClick={carregarDados}
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
        }
      />

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-space-md">
        <MetricCard
          titulo="Total de Exames"
          valor={totalExames}
          tom="primary"
          icone={<ClipboardList size={20} />}
          loading={isLoading}
          detalhe="Procedimentos ativos no catálogo"
        />
        <MetricCard
          titulo="Exames Parametrizados"
          valor={examesParametrizados}
          tom="secondary"
          icone={<CheckCircle2 size={20} />}
          loading={isLoading}
          detalhe="Com baixa automática configurada"
        />
        <MetricCard
          titulo="Exames sem Insumos Vinculados"
          valor={examesSemInsumos}
          tom={examesSemInsumos > 0 ? 'tertiary' : 'secondary'}
          icone={<AlertTriangle size={20} />}
          loading={isLoading}
          detalhe={
            examesSemInsumos > 0
              ? 'Não realizam baixa de estoque ao finalizar'
              : 'Todos os exames possuem ficha técnica'
          }
        />
      </div>

      {/* Barra de Filtros */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-space-md bg-surface-container-lowest p-space-md rounded-xl border border-outline-variant/40">
        <div className="flex flex-wrap items-center gap-space-sm flex-1">
          <div className="w-full sm:max-w-xs">
            <Input
              placeholder="Buscar exame por nome ou código..."
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
                { id: 'todos', label: 'Todos' },
                { id: 'parametrizados', label: 'Com Ficha Técnica' },
                { id: 'pendentes', label: 'Sem Insumos' },
              ] as const
            ).map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => {
                  setFiltroConfiguracao(f.id);
                  setPage(1);
                }}
                className={`px-3 py-1.5 rounded-md text-label-sm transition-colors cursor-pointer ${
                  filtroConfiguracao === f.id
                    ? 'bg-surface-container-lowest text-primary font-semibold shadow-2xs'
                    : 'text-on-surface-variant hover:text-on-surface'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        <span className="text-body-sm text-outline">
          Exibindo{' '}
          <strong className="font-data-mono text-on-surface">
            {filteredExames.length}
          </strong>{' '}
          exame(s)
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
            data={paginatedExames}
            keyExtractor={(item) => item.id}
            emptyMessage="Nenhum exame encontrado para configurar a ficha técnica."
          />

          <Pagination
            page={page}
            totalPages={totalPages}
            total={filteredExames.length}
            isLoading={isLoading}
            onPageChange={setPage}
            itemLabel="exames"
          />
        </>
      )}

      {/* Drawer Lateral de Ficha Técnica */}
      <FichaTecnicaDrawer
        exameId={selectedExameId}
        exameNome={selectedExameObj?.nome}
        open={Boolean(selectedExameId)}
        onClose={handleCloseDrawer}
        onUpdated={carregarDados}
      />
    </div>
  );
}

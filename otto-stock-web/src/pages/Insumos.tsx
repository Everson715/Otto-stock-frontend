import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import {
  AlertTriangle,
  Archive,
  ArrowUpCircle,
  Link2,
  Package,
  PackagePlus,
  Pencil,
  Plus,
  RefreshCw,
  Search,
} from 'lucide-react';

import { api } from '../api/api';
import type { EstoqueSaldoItem } from '../types/estoqueSaldo';
import type { Exame } from '../types/exame';
import type { ExameInsumo } from '../types/exameInsumo';
import type { Insumo } from '../types/insumo';
import { getNivelEstoque } from '../utils/estoque';
import { formatarNumero } from '../utils/format';
import { Button } from '../components/ui/Button';
import { Drawer } from '../components/ui/Drawer';
import { Input } from '../components/ui/Input';
import { MetricCard } from '../components/ui/MetricCard';
import { Modal } from '../components/ui/Modal';
import { PageHeader } from '../components/ui/PageHeader';
import { Pagination } from '../components/ui/Pagination';
import { ProgressBar } from '../components/ui/ProgressBar';
import { Skeleton } from '../components/ui/Skeleton';
import { StatusBadge } from '../components/ui/StatusBadge';
import { Table, type Column } from '../components/ui/Table';

const insumoFormSchema = z.object({
  nome: z.string().min(3, 'O nome deve ter no mínimo 3 caracteres'),
  quantidadeMinima: z
    .number({ message: 'Informe a quantidade mínima' })
    .int('A quantidade mínima deve ser um número inteiro')
    .min(0, 'A quantidade mínima deve ser maior ou igual a 0'),
  ativo: z.boolean(),
});

type InsumoFormDataLocal = z.infer<typeof insumoFormSchema>;

const entradaRapidaSchema = z.object({
  quantidade: z
    .number({ message: 'Informe uma quantidade válida' })
    .int('A quantidade deve ser um número inteiro')
    .min(1, 'A quantidade deve ser maior que zero'),
  motivo: z
    .string()
    .min(3, 'Informe o motivo ou referência (mín. 3 caracteres)'),
});

type EntradaRapidaFormData = z.infer<typeof entradaRapidaSchema>;

export function Insumos() {
  const [insumos, setInsumos] = useState<Insumo[]>([]);
  const [saldosMap, setSaldosMap] = useState<Record<number, EstoqueSaldoItem>>({});
  const [vinculos, setVinculos] = useState<ExameInsumo[]>([]);
  const [examesMap, setExamesMap] = useState<Record<number, string>>({});
  const [isLoading, setIsLoading] = useState(false);

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ativos' | 'inativos' | 'todos'>('ativos');
  const [page, setPage] = useState(1);
  const pageSize = 8;

  // Drawer Cadastrar / Editar
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedInsumo, setSelectedInsumo] = useState<Insumo | null>(null);

  // Modal Entrada Rápida (7.2)
  const [insumoEntradaRapida, setInsumoEntradaRapida] = useState<Insumo | null>(null);

  // Modal Desativar (R7)
  const [insumoParaDesativar, setInsumoParaDesativar] = useState<Insumo | null>(null);
  const [isDesativando, setIsDesativando] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<InsumoFormDataLocal>({
    resolver: zodResolver(insumoFormSchema),
    defaultValues: {
      nome: '',
      quantidadeMinima: 0,
      ativo: true,
    },
  });

  const watchedAtivo = watch('ativo');

  const {
    register: registerEntrada,
    handleSubmit: handleSubmitEntrada,
    reset: resetEntrada,
    formState: { errors: errorsEntrada, isSubmitting: isSubmittingEntrada },
  } = useForm<EntradaRapidaFormData>({
    resolver: zodResolver(entradaRapidaSchema),
    defaultValues: {
      quantidade: 1,
      motivo: '',
    },
  });

  const carregarCatalogo = useCallback(async () => {
    setIsLoading(true);
    try {
      const [resInsumos, resSaldos, resVinculos, resExames] = await Promise.all([
        api.get('/insumos', { params: { page: 1, limit: 200 } }),
        api.get('/estoque/saldo').catch(() => ({ data: [] })),
        api.get('/exame-insumos').catch(() => ({ data: [] })),
        api.get('/exames').catch(() => ({ data: [] })),
      ]);

      const listaInsumos: Insumo[] =
        resInsumos.data?.items ??
        (Array.isArray(resInsumos.data) ? resInsumos.data : []);
      const listaSaldos: EstoqueSaldoItem[] = Array.isArray(resSaldos.data)
        ? resSaldos.data
        : resSaldos.data?.items || [];
      const listaVinculos: ExameInsumo[] = Array.isArray(resVinculos.data)
        ? resVinculos.data
        : resVinculos.data?.items || [];
      const listaExames: Exame[] = Array.isArray(resExames.data)
        ? resExames.data
        : resExames.data?.items || [];

      const sMap: Record<number, EstoqueSaldoItem> = {};
      listaSaldos.forEach((s) => {
        sMap[s.id] = s;
      });

      const eMap: Record<number, string> = {};
      listaExames.forEach((e) => {
        eMap[e.id] = e.nome;
      });

      setInsumos(listaInsumos);
      setSaldosMap(sMap);
      setVinculos(listaVinculos);
      setExamesMap(eMap);
    } catch {
      toast.error('Erro ao carregar catálogo de insumos');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    carregarCatalogo();
  }, [carregarCatalogo]);

  // Agrupamento de ExameInsumo por insumoId
  const vinculosPorInsumo = useMemo(() => {
    const map: Record<number, ExameInsumo[]> = {};
    vinculos.forEach((v) => {
      if (!map[v.insumoId]) {
        map[v.insumoId] = [];
      }
      map[v.insumoId].push(v);
    });
    return map;
  }, [vinculos]);

  // KPIs (Seção 7.3)
  const kpis = useMemo(() => {
    const total = insumos.length;
    let criticos = 0;
    let comVinculo = 0;

    insumos.forEach((ins) => {
      const saldoObj = saldosMap[ins.id];
      const saldo = saldoObj?.saldo ?? 0;
      const minimo = ins.quantidadeMinima ?? saldoObj?.quantidadeMinima ?? 0;
      if (getNivelEstoque(saldo, minimo).status === 'critico') {
        criticos++;
      }
      if ((vinculosPorInsumo[ins.id]?.length ?? 0) > 0) {
        comVinculo++;
      }
    });

    const percentualVinculados =
      total > 0 ? Math.round((comVinculo / total) * 100) : 0;

    return {
      total,
      criticos,
      comVinculo,
      percentualVinculados,
    };
  }, [insumos, saldosMap, vinculosPorInsumo]);

  const filteredInsumos = useMemo(() => {
    const term = searchTerm.toLowerCase().trim();
    return insumos.filter((i) => {
      const isAtivo = i.ativo !== false;
      if (statusFilter === 'ativos' && !isAtivo) return false;
      if (statusFilter === 'inativos' && isAtivo) return false;
      if (!term) return true;
      return (
        i.nome.toLowerCase().includes(term) || String(i.id).includes(term)
      );
    });
  }, [insumos, searchTerm, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredInsumos.length / pageSize));
  const paginatedInsumos = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredInsumos.slice(start, start + pageSize);
  }, [filteredInsumos, page, pageSize]);

  function handleNovo() {
    setIsEditMode(false);
    setSelectedInsumo(null);
    reset({
      nome: '',
      quantidadeMinima: 0,
      ativo: true,
    });
    setIsDrawerOpen(true);
  }

  function handleEditar(insumo: Insumo) {
    setIsEditMode(true);
    setSelectedInsumo(insumo);
    setValue('nome', insumo.nome);
    setValue('quantidadeMinima', insumo.quantidadeMinima ?? 0);
    setValue('ativo', insumo.ativo !== false);
    setIsDrawerOpen(true);
  }

  function handleAbrirEntradaRapida(insumo: Insumo) {
    setInsumoEntradaRapida(insumo);
    resetEntrada({
      quantidade: 1,
      motivo: '',
    });
  }

  async function onSubmitInsumo(data: InsumoFormDataLocal) {
    try {
      const payload = {
        nome: data.nome.trim(),
        quantidadeMinima: Number(data.quantidadeMinima),
      };

      if (isEditMode && selectedInsumo) {
        await api.put(`/insumos/${selectedInsumo.id}`, payload);
        if (data.ativo === false && selectedInsumo.ativo !== false) {
          await api.delete(`/insumos/${selectedInsumo.id}`);
        }
        toast.success('Insumo atualizado com sucesso');
      } else {
        await api.post('/insumos', payload);
        toast.success('Insumo cadastrado com sucesso');
      }

      setIsDrawerOpen(false);
      reset();
      await carregarCatalogo();
    } catch (err: unknown) {
      let msg = 'Erro ao salvar insumo';
      if (err && typeof err === 'object' && 'response' in err) {
        const axErr = err as {
          response?: { status?: number; data?: { message?: string; error?: string } };
        };
        msg = axErr.response?.data?.message || axErr.response?.data?.error || msg;
        if (
          axErr.response?.status === 409 ||
          msg.toLowerCase().includes('já existe') ||
          msg.toLowerCase().includes('duplicad') ||
          msg.toLowerCase().includes('unique')
        ) {
          setError('nome', {
            type: 'manual',
            message: 'Já existe um insumo cadastrado com este nome.',
          });
        }
      }
      toast.error(msg);
    }
  }

  async function onSubmitEntradaRapida(data: EntradaRapidaFormData) {
    if (!insumoEntradaRapida) return;
    try {
      await api.post('/estoque/entrada', {
        insumoId: insumoEntradaRapida.id,
        quantidade: Number(data.quantidade),
        motivo: data.motivo.trim(),
      });
      toast.success('Entrada registrada com sucesso! Saldo recalculado.');
      setInsumoEntradaRapida(null);
      await carregarCatalogo();
    } catch (err: unknown) {
      let msg = 'Erro ao registrar entrada de estoque';
      if (err && typeof err === 'object' && 'response' in err) {
        const axErr = err as { response?: { data?: { message?: string; error?: string } } };
        msg = axErr.response?.data?.message || axErr.response?.data?.error || msg;
      }
      toast.error(msg);
    }
  }

  async function handleConfirmarDesativacao() {
    if (!insumoParaDesativar) return;
    setIsDesativando(true);
    try {
      await api.delete(`/insumos/${insumoParaDesativar.id}`);
      toast.success('Insumo desativado com sucesso');
      setInsumoParaDesativar(null);
      await carregarCatalogo();
    } catch (err: unknown) {
      let msg = 'Erro ao desativar insumo';
      if (err && typeof err === 'object' && 'response' in err) {
        const axErr = err as { response?: { data?: { message?: string; error?: string } } };
        msg = axErr.response?.data?.message || axErr.response?.data?.error || msg;
      }
      toast.error(msg);
    } finally {
      setIsDesativando(false);
    }
  }

  const columns: Column<Insumo>[] = [
    {
      header: 'Insumo',
      accessor: (i) => (
        <div className="flex items-center gap-2">
          <span className="font-data-mono text-label-sm text-outline">
            #{i.id}
          </span>
          <span className="font-semibold text-on-surface">{i.nome}</span>
        </div>
      ),
    },
    {
      header: 'Exames Vinculados',
      accessor: (i) => {
        const lista = vinculosPorInsumo[i.id] || [];
        if (lista.length === 0) {
          return (
            <span className="text-body-sm text-outline italic">
              Sem vínculo
            </span>
          );
        }
        const visiveis = lista.slice(0, 2);
        const restantes = lista.length - visiveis.length;
        return (
          <div className="flex flex-wrap items-center gap-1.5">
            {visiveis.map((v) => {
              const nomeExame =
                v.exame?.nome || examesMap[v.exameId] || `Exame #${v.exameId}`;
              return (
                <span
                  key={v.id}
                  className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-surface-container text-on-surface-variant text-label-sm font-medium"
                >
                  <span>{nomeExame}</span>
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
      header: 'Qtd. Mínima',
      align: 'right',
      accessor: (i) => (
        <span className="font-data-mono tabular-nums text-on-surface-variant">
          {formatarNumero(i.quantidadeMinima ?? 0)}
        </span>
      ),
    },
    {
      header: 'Saldo Atual',
      align: 'right',
      accessor: (i) => {
        const saldo = saldosMap[i.id]?.saldo ?? 0;
        const minimo = i.quantidadeMinima ?? saldosMap[i.id]?.quantidadeMinima ?? 0;
        const nivel = getNivelEstoque(saldo, minimo);
        return (
          <div className="flex flex-col items-end gap-1">
            <strong
              className={`font-data-mono tabular-nums ${
                nivel.status === 'critico'
                  ? 'text-error'
                  : nivel.status === 'atencao'
                  ? 'text-tertiary'
                  : 'text-on-surface'
              }`}
            >
              {formatarNumero(saldo)}
            </strong>
            <ProgressBar
              saldo={saldo}
              minimo={minimo}
              className="w-20 h-1.5"
            />
          </div>
        );
      },
    },
    {
      header: 'Status',
      accessor: (i) => {
        if (i.ativo === false) {
          return <StatusBadge variant="neutro" label="Inativo" />;
        }
        const saldo = saldosMap[i.id]?.saldo ?? 0;
        const minimo = i.quantidadeMinima ?? saldosMap[i.id]?.quantidadeMinima ?? 0;
        const nivel = getNivelEstoque(saldo, minimo);
        return <StatusBadge variant={nivel.status} label={nivel.label} />;
      },
    },
    {
      header: 'Ações',
      align: 'right',
      accessor: (insumo) => (
        <div className="flex items-center justify-end gap-1.5">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => handleAbrirEntradaRapida(insumo)}
            title="Entrada rápida de estoque"
            leftIcon={<PackagePlus size={14} />}
          >
            Entrada Rápida
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleEditar(insumo)}
            title="Editar insumo"
            aria-label={`Editar ${insumo.nome}`}
          >
            <Pencil size={15} />
          </Button>
          {insumo.ativo !== false && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setInsumoParaDesativar(insumo)}
              title="Desativar insumo"
              aria-label={`Desativar ${insumo.nome}`}
              className="text-error hover:bg-error-container/40 hover:text-error"
            >
              <Archive size={15} />
            </Button>
          )}
        </div>
      ),
    },
  ];

  const vinculosInsumoSelecionado = useMemo(() => {
    if (!selectedInsumo) return [];
    return vinculosPorInsumo[selectedInsumo.id] || [];
  }, [selectedInsumo, vinculosPorInsumo]);

  return (
    <div className="w-full max-w-[1600px] mx-auto px-gutter lg:px-margin-desktop py-space-lg flex flex-col gap-space-lg">
      <PageHeader
        breadcrumbs={[
          { label: 'Início', to: '/' },
          { label: 'Insumos' },
        ]}
        titulo="Catálogo de Insumos"
        subtitulo="Materiais clínicos e reagentes, parâmetros de estoque mínimo e protocolos vinculados."
        acoes={
          <>
            <Button
              variant="secondary"
              onClick={carregarCatalogo}
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
            <Button onClick={handleNovo} leftIcon={<Plus size={16} />}>
              Novo Insumo
            </Button>
          </>
        }
      />

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-space-md">
        <MetricCard
          titulo="Total de Insumos"
          valor={kpis.total}
          tom="primary"
          icone={<Package size={20} />}
          loading={isLoading}
          detalhe="Itens catalogados no sistema"
        />
        <MetricCard
          titulo="Em Risco Crítico"
          valor={kpis.criticos}
          tom={kpis.criticos > 0 ? 'error' : 'secondary'}
          icone={<AlertTriangle size={20} />}
          loading={isLoading}
          detalhe={
            kpis.criticos > 0
              ? 'Saldo zero ou abaixo do mínimo'
              : 'Todos os itens acima do mínimo'
          }
        />
        <MetricCard
          titulo="Protocolos Vinculados"
          valor={kpis.comVinculo}
          sufixo={
            <span className="px-2 py-0.5 rounded-full bg-surface-container-high text-primary font-label-sm text-label-sm font-bold">
              {kpis.percentualVinculados}% do catálogo
            </span>
          }
          tom="secondary"
          icone={<Link2 size={20} />}
          loading={isLoading}
          detalhe="Insumos associados a ao menos 1 exame"
        />
      </div>

      {/* Filtros */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-space-md bg-surface-container-lowest p-space-md rounded-xl border border-outline-variant/40">
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
                { id: 'ativos', label: 'Todos os Ativos' },
                { id: 'inativos', label: 'Inativos' },
                { id: 'todos', label: 'Todos' },
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
        </div>

        <span className="text-body-sm text-outline">
          Total de registros:{' '}
          <strong className="font-data-mono text-on-surface">
            {filteredInsumos.length}
          </strong>
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
            data={paginatedInsumos}
            keyExtractor={(i) => i.id}
            emptyMessage="Nenhum insumo encontrado para os filtros aplicados."
          />

          <Pagination
            page={page}
            totalPages={totalPages}
            total={filteredInsumos.length}
            isLoading={isLoading}
            onPageChange={setPage}
            itemLabel="insumos"
          />
        </>
      )}

      {/* Drawer Cadastrar / Editar Insumo */}
      <Drawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        title={
          isEditMode
            ? `Editar Insumo #${selectedInsumo?.id}`
            : 'Cadastrar Novo Insumo'
        }
        subtitle="Defina a identificação e o estoque mínimo de segurança."
        footer={
          <div className="flex items-center justify-end gap-space-sm w-full">
            <Button
              variant="secondary"
              type="button"
              onClick={() => setIsDrawerOpen(false)}
              disabled={isSubmitting}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              isLoading={isSubmitting}
              onClick={handleSubmit(onSubmitInsumo)}
              leftIcon={<Package size={15} />}
            >
              {isEditMode ? 'Salvar Alterações' : 'Salvar Insumo'}
            </Button>
          </div>
        }
      >
        <form
          onSubmit={handleSubmit(onSubmitInsumo)}
          className="flex flex-col gap-space-lg"
        >
          <Input
            label="Nome do Insumo *"
            placeholder="Ex: Tubo EDTA 4ml Tampa Roxa"
            error={errors.nome?.message}
            {...register('nome')}
          />

          <Input
            label="Quantidade Mínima de Segurança *"
            type="number"
            min={0}
            step={1}
            placeholder="Ex: 100"
            className="font-data-mono tabular-nums"
            error={errors.quantidadeMinima?.message}
            hint="Quando o saldo ficar abaixo deste número, o insumo será sinalizado como Crítico."
            {...register('quantidadeMinima', { valueAsNumber: true })}
          />

          {/* Switch Ativo */}
          <div className="flex items-center justify-between p-space-md rounded-xl bg-surface-container-low border border-outline-variant/40">
            <div className="flex flex-col">
              <span className="text-label-md font-semibold text-on-surface">
                Status no Catálogo
              </span>
              <span className="text-body-sm text-outline">
                {watchedAtivo
                  ? 'Insumo ativo e disponível para movimentações'
                  : 'Insumo será desativado ao salvar'}
              </span>
            </div>
            <label className="inline-flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                className="w-4 h-4 accent-primary rounded cursor-pointer"
                {...register('ativo')}
              />
              <span className="text-label-sm font-semibold text-on-surface">
                {watchedAtivo ? 'Ativo' : 'Inativo'}
              </span>
            </label>
          </div>

          {/* Seção Exames Vinculados (somente leitura + link para Ficha Técnica) */}
          <div className="flex flex-col gap-space-sm pt-space-sm border-t border-outline-variant/30">
            <div className="flex items-center justify-between">
              <span className="text-label-md uppercase tracking-wider text-outline font-semibold">
                Exames Vinculados
              </span>
              <Link
                to="/exame-insumos"
                onClick={() => setIsDrawerOpen(false)}
                className="inline-flex items-center gap-1 text-label-sm text-primary hover:underline font-semibold no-underline"
              >
                <Link2 size={13} />
                <span>Gerenciar na Ficha Técnica</span>
              </Link>
            </div>

            {!isEditMode ? (
              <p className="text-body-sm text-outline m-0">
                Após salvar o novo insumo, associe-o aos exames correspondentes no módulo Ficha Técnica.
              </p>
            ) : vinculosInsumoSelecionado.length === 0 ? (
              <p className="text-body-sm text-outline m-0">
                Nenhum exame utiliza este insumo atualmente.
              </p>
            ) : (
              <div className="flex flex-col gap-1.5">
                {vinculosInsumoSelecionado.map((v) => {
                  const nomeExame =
                    v.exame?.nome ||
                    examesMap[v.exameId] ||
                    `Exame #${v.exameId}`;
                  return (
                    <div
                      key={v.id}
                      className="flex items-center justify-between px-3 py-2 rounded-lg bg-surface-container-low text-body-sm"
                    >
                      <span className="font-medium text-on-surface">
                        {nomeExame}
                      </span>
                      <span className="font-data-mono text-primary font-semibold">
                        Consumo: ×{v.quantidade}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </form>
      </Drawer>

      {/* Modal de Entrada Rápida (Seção 7.2) */}
      <Modal
        isOpen={Boolean(insumoEntradaRapida)}
        onClose={() => !isSubmittingEntrada && setInsumoEntradaRapida(null)}
        title="Entrada Rápida de Estoque"
        subtitle={
          insumoEntradaRapida
            ? `${insumoEntradaRapida.nome} (#${insumoEntradaRapida.id})`
            : undefined
        }
      >
        {insumoEntradaRapida && (
          <form
            onSubmit={handleSubmitEntrada(onSubmitEntradaRapida)}
            className="flex flex-col gap-space-md"
          >
            <div className="flex items-center justify-between p-space-sm px-space-md rounded-lg bg-surface-container-low text-body-sm">
              <span className="text-on-surface-variant">
                Saldo atual:{' '}
                <strong className="font-data-mono text-on-surface">
                  {formatarNumero(
                    saldosMap[insumoEntradaRapida.id]?.saldo ?? 0
                  )}
                </strong>
              </span>
              <span className="text-outline">
                Mínimo:{' '}
                <strong className="font-data-mono text-on-surface">
                  {formatarNumero(insumoEntradaRapida.quantidadeMinima ?? 0)}
                </strong>
              </span>
            </div>

            <Input
              label="Quantidade de Entrada *"
              type="number"
              min={1}
              step={1}
              className="font-data-mono tabular-nums"
              error={errorsEntrada.quantidade?.message}
              {...registerEntrada('quantidade', { valueAsNumber: true })}
            />

            <Input
              label="Motivo / Referência *"
              placeholder="Ex: Reposição de estoque - NF 4589"
              error={errorsEntrada.motivo?.message}
              {...registerEntrada('motivo')}
            />

            <div className="flex justify-end gap-space-sm mt-space-xs">
              <Button
                variant="secondary"
                type="button"
                onClick={() => setInsumoEntradaRapida(null)}
                disabled={isSubmittingEntrada}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                isLoading={isSubmittingEntrada}
                leftIcon={<ArrowUpCircle size={16} />}
              >
                Confirmar Entrada
              </Button>
            </div>
          </form>
        )}
      </Modal>

      {/* Modal de Confirmação de Desativação (R7: nunca "Excluir") */}
      <Modal
        isOpen={Boolean(insumoParaDesativar)}
        onClose={() => !isDesativando && setInsumoParaDesativar(null)}
        title="Desativar Insumo"
        subtitle="Desativação lógica no catálogo de insumos"
      >
        {insumoParaDesativar && (
          <div className="flex flex-col gap-space-md">
            <p className="text-body-md text-on-surface">
              Confirma a desativação do insumo{' '}
              <strong>{insumoParaDesativar.nome}</strong> (
              <span className="font-data-mono">#{insumoParaDesativar.id}</span>
              )?
            </p>
            <p className="text-body-sm text-outline">
              O insumo será marcado como inativo, preservando todo o extrato histórico de movimentações.
            </p>
            <div className="flex justify-end gap-space-sm mt-space-xs">
              <Button
                variant="secondary"
                onClick={() => setInsumoParaDesativar(null)}
                disabled={isDesativando}
              >
                Cancelar
              </Button>
              <Button
                variant="danger"
                onClick={handleConfirmarDesativacao}
                isLoading={isDesativando}
                leftIcon={<Archive size={15} />}
              >
                Desativar Insumo
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
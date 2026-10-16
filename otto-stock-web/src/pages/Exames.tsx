import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import {
  AlertTriangle,
  Archive,
  CheckCircle2,
  ClipboardList,
  Link2,
  Pencil,
  Plus,
  RefreshCw,
  Search,
} from 'lucide-react';

import { api } from '../api/api';
import type { Exame } from '../types/exame';
import type { ExameInsumo } from '../types/exameInsumo';
import type { Insumo } from '../types/insumo';
import { Button } from '../components/ui/Button';
import { Drawer } from '../components/ui/Drawer';
import { Input } from '../components/ui/Input';
import { MetricCard } from '../components/ui/MetricCard';
import { Modal } from '../components/ui/Modal';
import { PageHeader } from '../components/ui/PageHeader';
import { Pagination } from '../components/ui/Pagination';
import { Select } from '../components/ui/Select';
import { Skeleton } from '../components/ui/Skeleton';
import { StatusBadge } from '../components/ui/StatusBadge';
import { Table, type Column } from '../components/ui/Table';

const exameFormSchema = z.object({
  nome: z.string().min(1, 'O nome do exame é obrigatório'),
  descricao: z.string().optional(),
  ativo: z.boolean().optional(),
});

type ExameFormDataLocal = z.infer<typeof exameFormSchema>;

export function Exames() {
  const navigate = useNavigate();

  const [exames, setExames] = useState<Exame[]>([]);
  const [vinculos, setVinculos] = useState<ExameInsumo[]>([]);
  const [insumosMap, setInsumosMap] = useState<Record<number, string>>({});
  const [executadosHoje, setExecutadosHoje] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(false);

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ativos' | 'inativos' | 'todos'>('ativos');
  const [sortOrder, setSortOrder] = useState<'az' | 'recentes'>('az');
  const [page, setPage] = useState(1);
  const pageSize = 8;

  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedExame, setSelectedExame] = useState<Exame | null>(null);
  const [exameParaDesativar, setExameParaDesativar] = useState<Exame | null>(null);
  const [isDesativando, setIsDesativando] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<ExameFormDataLocal>({
    resolver: zodResolver(exameFormSchema),
    defaultValues: {
      nome: '',
      descricao: '',
      ativo: true,
    },
  });

  const carregarDados = useCallback(async () => {
    setIsLoading(true);
    try {
      const hojeInicio = new Date();
      hojeInicio.setHours(0, 0, 0, 0);
      const hojeFim = new Date();
      hojeFim.setHours(23, 59, 59, 999);

      const [resExames, resVinculos, resInsumos, resAtendHoje] =
        await Promise.all([
          api.get('/exames'),
          api.get('/exame-insumos').catch(() => ({ data: [] })),
          api.get('/insumos', { params: { limit: 200 } }).catch(() => ({ data: [] })),
          api
            .get('/atendimentos', {
              params: {
                status: 'FINALIZADO',
                startDate: hojeInicio.toISOString(),
                endDate: hojeFim.toISOString(),
                limit: 1,
              },
            })
            .catch(() => ({ data: { total: 0 } })),
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
      setExecutadosHoje(
        resAtendHoje.data?.total ?? resAtendHoje.data?.items?.length ?? 0
      );
    } catch {
      toast.error('Erro ao carregar catálogo de exames');
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
  const totalAtivos = useMemo(
    () => exames.filter((e) => e.ativo !== false).length,
    [exames]
  );
  const totalInativos = totalExames - totalAtivos;
  const examesSemInsumos = useMemo(
    () =>
      exames.filter(
        (e) => e.ativo !== false && (vinculosPorExame[e.id]?.length ?? 0) === 0
      ).length,
    [exames, vinculosPorExame]
  );

  const filteredExames = useMemo(() => {
    const term = searchTerm.toLowerCase().trim();
    const list = exames.filter((e) => {
      const ativo = e.ativo !== false;
      if (statusFilter === 'ativos' && !ativo) return false;
      if (statusFilter === 'inativos' && ativo) return false;
      if (!term) return true;
      return (
        e.nome.toLowerCase().includes(term) ||
        String(e.id).includes(term) ||
        (e.descricao && e.descricao.toLowerCase().includes(term))
      );
    });

    return [...list].sort((a, b) => {
      if (sortOrder === 'recentes') {
        return b.id - a.id;
      }
      return a.nome.localeCompare(b.nome, 'pt-BR');
    });
  }, [exames, searchTerm, statusFilter, sortOrder]);

  const totalPages = Math.max(1, Math.ceil(filteredExames.length / pageSize));
  const paginatedExames = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredExames.slice(start, start + pageSize);
  }, [filteredExames, page, pageSize]);

  function handleNovo() {
    setIsEditMode(false);
    setSelectedExame(null);
    reset({ nome: '', descricao: '', ativo: true });
    setIsDrawerOpen(true);
  }

  function handleEditar(exame: Exame) {
    setIsEditMode(true);
    setSelectedExame(exame);
    setValue('nome', exame.nome);
    setValue('descricao', exame.descricao || '');
    setValue('ativo', exame.ativo !== false);
    setIsDrawerOpen(true);
  }

  async function salvarExame(
    data: ExameFormDataLocal,
    irParaFichaTecnica: boolean
  ) {
    try {
      const payload: { nome: string; descricao?: string } = {
        nome: data.nome.trim(),
      };
      if (data.descricao?.trim()) {
        payload.descricao = data.descricao.trim();
      }

      let targetExameId = selectedExame?.id;

      if (isEditMode && selectedExame) {
        await api.put(`/exames/${selectedExame.id}`, payload);
        toast.success('Exame atualizado com sucesso');
      } else {
        const res = await api.post<Exame>('/exames', payload);
        targetExameId = res.data?.id;
        toast.success('Exame cadastrado com sucesso');
      }

      setIsDrawerOpen(false);
      reset();
      await carregarDados();

      if (irParaFichaTecnica && targetExameId) {
        navigate(`/exame-insumos?exameId=${targetExameId}`);
      }
    } catch (err: unknown) {
      let msg = 'Erro ao salvar exame';
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
            message: 'Já existe um exame cadastrado com este nome.',
          });
        }
      }
      toast.error(msg);
    }
  }

  async function handleConfirmarDesativacao() {
    if (!exameParaDesativar) return;
    setIsDesativando(true);
    try {
      await api.delete(`/exames/${exameParaDesativar.id}`);
      toast.success('Exame desativado com sucesso');
      setExameParaDesativar(null);
      await carregarDados();
    } catch (err: unknown) {
      let msg = 'Erro ao desativar exame';
      if (err && typeof err === 'object' && 'response' in err) {
        const axErr = err as { response?: { data?: { message?: string; error?: string } } };
        msg = axErr.response?.data?.message || axErr.response?.data?.error || msg;
      }
      toast.error(msg);
    } finally {
      setIsDesativando(false);
    }
  }

  const columns: Column<Exame>[] = [
    {
      header: 'Exame',
      accessor: (e) => (
        <div className="flex flex-col gap-0.5">
          <div className="flex items-center gap-2">
            <span className="font-data-mono text-label-sm text-outline">
              #{e.id}
            </span>
            <span className="font-semibold text-on-surface">{e.nome}</span>
          </div>
          {e.descricao && (
            <span className="text-body-sm text-outline">{e.descricao}</span>
          )}
        </div>
      ),
    },
    {
      header: 'Insumos Requeridos',
      accessor: (e) => {
        const lista = vinculosPorExame[e.id] || [];
        if (lista.length === 0) {
          return (
            <StatusBadge variant="atencao" label="Sem insumos vinculados" />
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
      header: 'Status',
      accessor: (e) =>
        e.ativo === false ? (
          <StatusBadge variant="neutro" label="Inativo" />
        ) : (
          <StatusBadge variant="conforme" label="Ativo" />
        ),
    },
    {
      header: 'Ações',
      align: 'right',
      accessor: (exame) => (
        <div className="flex items-center justify-end gap-1.5">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => navigate(`/exame-insumos?exameId=${exame.id}`)}
            title="Configurar Ficha Técnica"
            leftIcon={<Link2 size={14} />}
          >
            Ficha Técnica
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleEditar(exame)}
            title="Editar exame"
            aria-label={`Editar ${exame.nome}`}
          >
            <Pencil size={15} />
          </Button>
          {exame.ativo !== false && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setExameParaDesativar(exame)}
              title="Desativar exame"
              aria-label={`Desativar ${exame.nome}`}
              className="text-error hover:bg-error-container/40 hover:text-error"
            >
              <Archive size={15} />
            </Button>
          )}
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
          { label: 'Exames' },
        ]}
        titulo="Gestão de Exames"
        subtitulo="Catálogo de exames laboratoriais e clínicos e vínculo com a ficha técnica de consumo."
        acoes={
          <>
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
            <Button onClick={handleNovo} leftIcon={<Plus size={16} />}>
              Novo Exame
            </Button>
          </>
        }
      />

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-space-md">
        <MetricCard
          titulo="Total de Exames"
          valor={totalExames}
          tom="primary"
          icone={<ClipboardList size={20} />}
          loading={isLoading}
          detalhe="Procedimentos cadastrados"
        />
        <MetricCard
          titulo="Ativos / Inativos"
          valor={`${totalAtivos} / ${totalInativos}`}
          tom="secondary"
          icone={<CheckCircle2 size={20} />}
          loading={isLoading}
          detalhe="Disponíveis para novos atendimentos"
        />
        <MetricCard
          titulo="Executados Hoje"
          valor={executadosHoje}
          tom="primary"
          icone={<ClipboardList size={20} />}
          loading={isLoading}
          detalhe="Atendimentos finalizados hoje"
        />
        <MetricCard
          titulo="Exames sem Insumos Vinculados"
          valor={examesSemInsumos}
          tom={examesSemInsumos > 0 ? 'tertiary' : 'secondary'}
          icone={<AlertTriangle size={20} />}
          loading={isLoading}
          detalhe={
            examesSemInsumos > 0
              ? 'Exames sem ficha não baixam estoque'
              : 'Todos possuem insumos vinculados'
          }
        />
      </div>

      {/* Filtros */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-space-md bg-surface-container-lowest p-space-md rounded-xl border border-outline-variant/40">
        <div className="flex flex-wrap items-center gap-space-sm flex-1">
          <div className="w-full sm:max-w-xs">
            <Input
              placeholder="Buscar exame por nome ou #id..."
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
                { id: 'ativos', label: 'Ativos' },
                { id: 'inativos', label: 'Inativos' },
                { id: 'todos', label: 'Todos' },
              ] as const
            ).map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => {
                  setStatusFilter(s.id);
                  setPage(1);
                }}
                className={`px-3 py-1.5 rounded-md text-label-sm transition-colors cursor-pointer ${
                  statusFilter === s.id
                    ? 'bg-surface-container-lowest text-primary font-semibold shadow-2xs'
                    : 'text-on-surface-variant hover:text-on-surface'
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>

          <div className="w-44">
            <Select
              placeholder="Ordenar por..."
              options={[
                { label: 'Ordem Alfabética (A-Z)', value: 'az' },
                { label: 'Mais Recentes (#ID)', value: 'recentes' },
              ]}
              value={sortOrder}
              onChange={(e) =>
                setSortOrder((e.target.value as 'az' | 'recentes') || 'az')
              }
            />
          </div>
        </div>

        <span className="text-body-sm text-outline">
          Total listado:{' '}
          <strong className="font-data-mono text-on-surface">
            {filteredExames.length}
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
            data={paginatedExames}
            keyExtractor={(e) => e.id}
            emptyMessage="Nenhum exame encontrado para os filtros aplicados."
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

      {/* Drawer Novo / Editar Exame */}
      <Drawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        title={isEditMode ? `Editar Exame #${selectedExame?.id}` : 'Novo Exame'}
        subtitle="Preencha os dados cadastrais do procedimento."
        footer={
          <div className="flex flex-wrap items-center justify-end gap-space-sm w-full">
            <Button
              variant="secondary"
              type="button"
              onClick={() => setIsDrawerOpen(false)}
              disabled={isSubmitting}
            >
              Cancelar
            </Button>
            <Button
              variant="secondary"
              type="button"
              isLoading={isSubmitting}
              onClick={handleSubmit((data) => salvarExame(data, true))}
              leftIcon={<Link2 size={15} />}
            >
              Salvar e configurar ficha técnica
            </Button>
            <Button
              type="button"
              isLoading={isSubmitting}
              onClick={handleSubmit((data) => salvarExame(data, false))}
              leftIcon={<ClipboardList size={15} />}
            >
              {isEditMode ? 'Salvar Alterações' : 'Salvar Exame'}
            </Button>
          </div>
        }
      >
        <form
          onSubmit={handleSubmit((data) => salvarExame(data, false))}
          className="flex flex-col gap-space-md"
        >
          <Input
            label="Nome do Exame *"
            placeholder="Ex: Hemograma Completo"
            error={errors.nome?.message}
            {...register('nome')}
          />

          <Input
            label="Descrição / Preparo (Opcional)"
            placeholder="Ex: Jejum recomendado de 8 horas"
            error={errors.descricao?.message}
            {...register('descricao')}
          />

          <div className="p-space-md rounded-xl bg-surface-container-low border border-outline-variant/40 text-body-sm text-on-surface-variant">
            Após salvar, você poderá vincular os insumos consumidos por este procedimento na Ficha Técnica.
          </div>
        </form>
      </Drawer>

      {/* Modal de Confirmação de Desativação (R7: nunca "Excluir") */}
      <Modal
        isOpen={Boolean(exameParaDesativar)}
        onClose={() => !isDesativando && setExameParaDesativar(null)}
        title="Desativar Exame"
        subtitle="Desativação lógica no catálogo da clínica"
      >
        {exameParaDesativar && (
          <div className="flex flex-col gap-space-md">
            <p className="text-body-md text-on-surface">
              Confirma a desativação do exame{' '}
              <strong>{exameParaDesativar.nome}</strong> (
              <span className="font-data-mono">#{exameParaDesativar.id}</span>)?
            </p>
            <p className="text-body-sm text-outline">
              O exame deixará de aparecer na abertura de novos atendimentos, preservando o histórico de atendimentos já realizados.
            </p>
            <div className="flex justify-end gap-space-sm mt-space-xs">
              <Button
                variant="secondary"
                onClick={() => setExameParaDesativar(null)}
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
                Desativar Exame
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
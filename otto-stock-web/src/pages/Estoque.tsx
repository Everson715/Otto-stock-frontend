import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  ArrowDownCircle,
  ArrowUpCircle,
  History,
  Package,
  Sliders,
} from 'lucide-react';
import { toast } from 'sonner';

import { api } from '../api/api';
import type { EstoqueSaldoItem } from '../types/estoqueSaldo';
import { getNivelEstoque } from '../utils/estoque';
import { formatarNumero } from '../utils/format';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { PageHeader } from '../components/ui/PageHeader';
import { ProgressBar } from '../components/ui/ProgressBar';
import { Select } from '../components/ui/Select';
import { StatusBadge } from '../components/ui/StatusBadge';
import { Tabs, type RouteTabItem } from '../components/ui/Tabs';

const movimentacaoSchema = z.object({
  tipo: z.enum(['entrada', 'saida', 'ajuste']),
  direcaoAjuste: z.enum(['positivo', 'negativo']),
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

type MovimentacaoFormData = z.infer<typeof movimentacaoSchema>;

export function Estoque() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [saldos, setSaldos] = useState<EstoqueSaldoItem[]>([]);
  const [isLoadingSaldos, setIsLoadingSaldos] = useState(false);

  const tipoParam = searchParams.get('tipo');
  const insumoIdParam = searchParams.get('insumoId');

  const initialTipo: 'entrada' | 'saida' | 'ajuste' =
    tipoParam === 'saida' || tipoParam === 'ajuste' ? tipoParam : 'entrada';

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<MovimentacaoFormData>({
    resolver: zodResolver(movimentacaoSchema),
    defaultValues: {
      tipo: initialTipo,
      direcaoAjuste: 'negativo',
      insumoId: insumoIdParam ? Number(insumoIdParam) : 0,
      quantidade: 1,
      motivo: '',
    },
  });

  const watchedTipo = watch('tipo');
  const watchedDirecaoAjuste = watch('direcaoAjuste');
  const watchedInsumoId = watch('insumoId');
  const watchedQuantidade = watch('quantidade');

  const carregarSaldos = useCallback(async () => {
    setIsLoadingSaldos(true);
    try {
      const res = await api.get('/estoque/saldo');
      const data: EstoqueSaldoItem[] = Array.isArray(res.data)
        ? res.data
        : res.data?.items || [];
      setSaldos(data);
    } catch {
      toast.error('Erro ao carregar catálogo de insumos e saldos');
    } finally {
      setIsLoadingSaldos(false);
    }
  }, []);

  useEffect(() => {
    carregarSaldos();
  }, [carregarSaldos]);

  const selectedInsumo = useMemo(
    () => saldos.find((s) => s.id === Number(watchedInsumoId)) || null,
    [saldos, watchedInsumoId]
  );

  const tabsItems: RouteTabItem[] = [
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
    {
      label: 'Movimentar (Entrada / Saída / Ajuste)',
      to: '/estoque',
      icon: <Sliders size={15} />,
    },
  ];

  async function onSubmit(data: MovimentacaoFormData) {
    // Validação auxiliar de UX em saídas/ajustes negativos (o backend decide em definitivo - R6)
    const isReducao =
      data.tipo === 'saida' ||
      (data.tipo === 'ajuste' && data.direcaoAjuste === 'negativo');

    if (isReducao && selectedInsumo && data.quantidade > selectedInsumo.saldo) {
      setError('quantidade', {
        type: 'manual',
        message: `Quantidade superior ao saldo disponível (${formatarNumero(selectedInsumo.saldo)}).`,
      });
      return;
    }

    const quantidadeFinal =
      data.tipo === 'ajuste' && data.direcaoAjuste === 'negativo'
        ? -Math.abs(Number(data.quantidade))
        : Math.abs(Number(data.quantidade));

    try {
      await api.post(`/estoque/${data.tipo}`, {
        insumoId: Number(data.insumoId),
        quantidade: quantidadeFinal,
        motivo: data.motivo.trim(),
      });

      const labelSucesso =
        data.tipo === 'entrada'
          ? 'Entrada registrada com sucesso! Saldo recalculado.'
          : data.tipo === 'saida'
          ? 'Saída registrada com sucesso! Saldo recalculado.'
          : 'Ajuste de inventário registrado com sucesso! Saldo recalculado.';

      toast.success(labelSucesso);
      reset({
        tipo: data.tipo,
        direcaoAjuste: data.direcaoAjuste,
        insumoId: 0,
        quantidade: 1,
        motivo: '',
      });
      await carregarSaldos();
    } catch (err: unknown) {
      let msg = 'Erro ao processar movimentação de estoque';
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

  const nivelSelecionado = selectedInsumo
    ? getNivelEstoque(selectedInsumo.saldo, selectedInsumo.quantidadeMinima)
    : null;

  return (
    <div className="w-full max-w-[1600px] mx-auto px-gutter lg:px-margin-desktop py-space-lg flex flex-col gap-space-lg">
      <PageHeader
        breadcrumbs={[
          { label: 'Início', to: '/' },
          { label: 'Estoque', to: '/estoque/saldo' },
          { label: 'Movimentar' },
        ]}
        titulo="Movimentação de Estoque"
        subtitulo="Registre entradas de reposição, saídas manuais ou ajustes de contagem física."
      />

      <div className="flex items-center justify-between flex-wrap gap-space-sm">
        <Tabs items={tabsItems} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-space-lg items-start">
        {/* Formulário Principal */}
        <div className="lg:col-span-2 bg-surface-container-lowest p-space-lg rounded-xl border border-outline-variant/40 shadow-[0_1px_2px_0_rgb(15_23_42/0.04)] text-left">
          <form
            onSubmit={handleSubmit(onSubmit)}
            className="flex flex-col gap-space-md"
          >
            {/* Seletor de Tipo de Operação */}
            <div className="flex flex-col gap-1.5">
              <span className="text-label-md font-medium text-on-surface">
                Tipo de Movimentação *
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-space-sm">
                <button
                  type="button"
                  onClick={() => setValue('tipo', 'entrada')}
                  className={`flex items-center gap-2.5 p-space-md rounded-xl border text-left transition-all cursor-pointer ${
                    watchedTipo === 'entrada'
                      ? 'border-secondary bg-secondary-container/30 text-on-secondary-container font-semibold'
                      : 'border-outline-variant/50 bg-surface-container-lowest text-on-surface-variant hover:bg-surface-container-low'
                  }`}
                >
                  <ArrowUpCircle size={20} className="text-secondary shrink-0" />
                  <div className="flex flex-col">
                    <span className="text-label-md">Entrada</span>
                    <span className="text-body-sm text-outline font-normal">
                      Compra ou reposição
                    </span>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setValue('tipo', 'saida')}
                  className={`flex items-center gap-2.5 p-space-md rounded-xl border text-left transition-all cursor-pointer ${
                    watchedTipo === 'saida'
                      ? 'border-error bg-error-container/40 text-on-error-container font-semibold'
                      : 'border-outline-variant/50 bg-surface-container-lowest text-on-surface-variant hover:bg-surface-container-low'
                  }`}
                >
                  <ArrowDownCircle size={20} className="text-error shrink-0" />
                  <div className="flex flex-col">
                    <span className="text-label-md">Saída Manual</span>
                    <span className="text-body-sm text-outline font-normal">
                      Consumo avulso / descarte
                    </span>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setValue('tipo', 'ajuste')}
                  className={`flex items-center gap-2.5 p-space-md rounded-xl border text-left transition-all cursor-pointer ${
                    watchedTipo === 'ajuste'
                      ? 'border-tertiary bg-tertiary-fixed/50 text-on-tertiary-fixed-variant font-semibold'
                      : 'border-outline-variant/50 bg-surface-container-lowest text-on-surface-variant hover:bg-surface-container-low'
                  }`}
                >
                  <Sliders size={20} className="text-tertiary shrink-0" />
                  <div className="flex flex-col">
                    <span className="text-label-md">Ajuste</span>
                    <span className="text-body-sm text-outline font-normal">
                      Correção de inventário
                    </span>
                  </div>
                </button>
              </div>
            </div>

            {watchedTipo === 'ajuste' && (
              <Select
                label="Natureza do Ajuste *"
                options={[
                  {
                    label: 'Redução de Saldo (−) — Perda ou diferença a menor',
                    value: 'negativo',
                  },
                  {
                    label: 'Acréscimo de Saldo (+) — Sobra apurada em contagem',
                    value: 'positivo',
                  },
                ]}
                {...register('direcaoAjuste')}
              />
            )}

            <Select
              label="Insumo *"
              placeholder={
                isLoadingSaldos
                  ? 'Carregando insumos...'
                  : 'Selecione o insumo...'
              }
              options={saldos.map((s) => ({
                label: `${s.nome} (Saldo: ${formatarNumero(s.saldo)})`,
                value: s.id,
              }))}
              error={errors.insumoId?.message}
              {...register('insumoId', { valueAsNumber: true })}
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-space-md">
              <Input
                label="Quantidade (inteiro > 0) *"
                type="number"
                min={1}
                step={1}
                placeholder="Ex: 25"
                className="font-data-mono tabular-nums"
                error={errors.quantidade?.message}
                hint={
                  (watchedTipo === 'saida' ||
                    (watchedTipo === 'ajuste' &&
                      watchedDirecaoAjuste === 'negativo')) &&
                  selectedInsumo &&
                  Number(watchedQuantidade) > selectedInsumo.saldo
                    ? `Atenção: a quantidade informada excede o saldo atual (${selectedInsumo.saldo}).`
                    : undefined
                }
                {...register('quantidade', { valueAsNumber: true })}
              />

              <Input
                label="Motivo / Referência *"
                placeholder={
                  watchedTipo === 'entrada'
                    ? 'Ex: Compra mensal - NF 4589'
                    : watchedTipo === 'saida'
                    ? 'Ex: Uso interno / Descarte por avaria'
                    : 'Ex: Ajuste após contagem física'
                }
                error={errors.motivo?.message}
                {...register('motivo')}
              />
            </div>

            <div className="flex items-center justify-end gap-space-sm pt-space-sm border-t border-outline-variant/30">
              <Button
                type="button"
                variant="secondary"
                onClick={() => navigate('/estoque/saldo')}
                disabled={isSubmitting}
              >
                Ver Posição de Saldo
              </Button>
              <Button
                type="submit"
                variant={watchedTipo === 'saida' ? 'danger' : 'primary'}
                isLoading={isSubmitting}
                leftIcon={
                  watchedTipo === 'entrada' ? (
                    <ArrowUpCircle size={16} />
                  ) : watchedTipo === 'saida' ? (
                    <ArrowDownCircle size={16} />
                  ) : (
                    <Sliders size={16} />
                  )
                }
              >
                {watchedTipo === 'entrada'
                  ? 'Registrar Entrada'
                  : watchedTipo === 'saida'
                  ? 'Registrar Saída'
                  : 'Registrar Ajuste'}
              </Button>
            </div>
          </form>
        </div>

        {/* Painel Lateral de Posição do Insumo Selecionado */}
        <div className="bg-surface-container-lowest p-space-lg rounded-xl border border-outline-variant/40 shadow-[0_1px_2px_0_rgb(15_23_42/0.04)] text-left flex flex-col gap-space-md">
          <h3 className="text-headline-sm font-semibold text-on-surface m-0">
            Posição do Insumo
          </h3>

          {!selectedInsumo || !nivelSelecionado ? (
            <p className="text-body-sm text-outline">
              Selecione um insumo no formulário ao lado para consultar seu saldo atual e nível mínimo antes de confirmar a movimentação.
            </p>
          ) : (
            <div className="flex flex-col gap-space-md">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <span className="font-data-mono text-label-sm text-outline">
                    #{selectedInsumo.id}
                  </span>
                  <h4 className="text-body-lg font-semibold text-on-surface m-0">
                    {selectedInsumo.nome}
                  </h4>
                </div>
                <StatusBadge
                  variant={nivelSelecionado.status}
                  label={nivelSelecionado.label}
                />
              </div>

              <div className="grid grid-cols-2 gap-space-sm p-space-md rounded-xl bg-surface-container-low">
                <div className="flex flex-col">
                  <span className="text-label-sm uppercase text-outline">
                    Saldo Atual
                  </span>
                  <strong className="text-headline-lg font-data-mono tabular-nums text-on-surface">
                    {formatarNumero(selectedInsumo.saldo)}
                  </strong>
                </div>
                <div className="flex flex-col">
                  <span className="text-label-sm uppercase text-outline">
                    Estoque Mínimo
                  </span>
                  <strong className="text-headline-lg font-data-mono tabular-nums text-on-surface-variant">
                    {formatarNumero(selectedInsumo.quantidadeMinima)}
                  </strong>
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <span className="text-body-sm text-outline">
                  Cobertura em relação ao mínimo
                </span>
                <ProgressBar
                  saldo={selectedInsumo.saldo}
                  minimo={selectedInsumo.quantidadeMinima}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
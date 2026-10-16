import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  Archive,
  Check,
  Link2,
  Loader2,
  Plus,
  Save,
} from 'lucide-react';
import { toast } from 'sonner';

import { api } from '../api/api';
import { useAuth } from '../contexts/AuthContext';
import { hasRouteAccess } from '../types/auth';
import type { Exame } from '../types/exame';
import type { ExameInsumo } from '../types/exameInsumo';
import type { Insumo } from '../types/insumo';
import type { EstoqueSaldoItem } from '../types/estoqueSaldo';
import { getNivelEstoque } from '../utils/estoque';
import { formatarNumero } from '../utils/format';
import { Drawer } from './ui/Drawer';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { Select } from './ui/Select';
import { StatusBadge } from './ui/StatusBadge';

interface FichaTecnicaDrawerProps {
  exameId: number | null;
  exameNome?: string;
  open: boolean;
  onClose: () => void;
  onUpdated?: () => void;
}

export function FichaTecnicaDrawer({
  exameId,
  exameNome,
  open,
  onClose,
  onUpdated,
}: FichaTecnicaDrawerProps) {
  const { perfil } = useAuth();
  const canReadSaldo = hasRouteAccess(perfil, '/estoque/saldo');

  const [exame, setExame] = useState<Exame | null>(null);
  const [vinculos, setVinculos] = useState<ExameInsumo[]>([]);
  const [insumosCatalogo, setInsumosCatalogo] = useState<Insumo[]>([]);
  const [saldosMap, setSaldosMap] = useState<Record<number, EstoqueSaldoItem>>({});
  const [quantidadesEditadas, setQuantidadesEditadas] = useState<Record<number, number>>({});

  const [novoInsumoId, setNovoInsumoId] = useState<string>('');
  const [novaQuantidade, setNovaQuantidade] = useState<string>('1');

  const [isLoading, setIsLoading] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [isSavingChanges, setIsSavingChanges] = useState(false);
  const [removingId, setRemovingId] = useState<number | null>(null);

  const carregarDados = useCallback(async () => {
    if (!exameId) return;
    setIsLoading(true);
    try {
      const requests: Promise<unknown>[] = [
        api.get(`/exame-insumos/exame/${exameId}`).catch(() => api.get('/exame-insumos')),
        api.get('/insumos', { params: { limit: 200 } }),
      ];

      if (!exameNome) {
        requests.push(api.get(`/exames/${exameId}`).catch(() => null));
      }

      if (canReadSaldo) {
        requests.push(api.get('/estoque/saldo').catch(() => ({ data: [] })));
      }

      const results = await Promise.all(requests);
      const resVinculos = results[0] as { data: ExameInsumo[] | { items?: ExameInsumo[] } };
      const resInsumos = results[1] as { data: Insumo[] | { items?: Insumo[] } };

      const rawVinculos = Array.isArray(resVinculos.data)
        ? resVinculos.data
        : resVinculos.data?.items || [];
      const filtrados = rawVinculos.filter((v) => v.exameId === exameId);
      setVinculos(filtrados);

      const initialQtds: Record<number, number> = {};
      filtrados.forEach((v) => {
        initialQtds[v.id] = v.quantidade;
      });
      setQuantidadesEditadas(initialQtds);

      const rawInsumos = Array.isArray(resInsumos.data)
        ? resInsumos.data
        : resInsumos.data?.items || [];
      setInsumosCatalogo(rawInsumos.filter((i) => i.ativo !== false));

      let resultIdx = 2;
      if (!exameNome) {
        const resExame = results[resultIdx] as { data?: Exame } | null;
        if (resExame?.data) {
          setExame(resExame.data);
        }
        resultIdx++;
      }

      if (canReadSaldo) {
        const resSaldo = results[resultIdx] as {
          data?: EstoqueSaldoItem[] | { items?: EstoqueSaldoItem[] };
        };
        const rawSaldos = Array.isArray(resSaldo?.data)
          ? resSaldo.data
          : resSaldo?.data?.items || [];
        const map: Record<number, EstoqueSaldoItem> = {};
        rawSaldos.forEach((s) => {
          map[s.id] = s;
        });
        setSaldosMap(map);
      }
    } catch {
      toast.error('Erro ao carregar ficha técnica do exame');
    } finally {
      setIsLoading(false);
    }
  }, [exameId, exameNome, canReadSaldo]);

  useEffect(() => {
    if (open && exameId) {
      carregarDados();
    }
  }, [open, exameId, carregarDados]);

  // Filtra insumos ativos que ainda não estão vinculados a este exame ([exameId, insumoId] único)
  const insumosDisponiveis = useMemo(() => {
    const vinculadosIds = new Set(vinculos.map((v) => v.insumoId));
    return insumosCatalogo.filter((i) => !vinculadosIds.has(i.id));
  }, [insumosCatalogo, vinculos]);

  const idsComAlteracaoPendente = useMemo(() => {
    return vinculos
      .filter((v) => {
        const editado = quantidadesEditadas[v.id];
        return (
          typeof editado === 'number' &&
          Number.isInteger(editado) &&
          editado >= 1 &&
          editado !== v.quantidade
        );
      })
      .map((v) => v.id);
  }, [vinculos, quantidadesEditadas]);

  async function handleAdicionarVinculo(e: React.FormEvent) {
    e.preventDefault();
    if (!exameId) return;

    const insumoIdNum = Number(novoInsumoId);
    const qtdNum = Number(novaQuantidade);

    if (!insumoIdNum || !Number.isInteger(qtdNum) || qtdNum < 1) {
      toast.warning('Selecione um insumo disponível e informe uma quantidade inteira maior ou igual a 1.');
      return;
    }

    setIsAdding(true);
    try {
      await api.post('/exame-insumos', {
        exameId,
        insumoId: insumoIdNum,
        quantidade: qtdNum,
      });
      toast.success('Insumo adicionado à ficha técnica');
      setNovoInsumoId('');
      setNovaQuantidade('1');
      await carregarDados();
      onUpdated?.();
    } catch (err: unknown) {
      let msg = 'Erro ao vincular insumo ao exame';
      if (err && typeof err === 'object' && 'response' in err) {
        const axErr = err as { response?: { data?: { message?: string; error?: string } } };
        msg = axErr.response?.data?.message || axErr.response?.data?.error || msg;
      }
      toast.error(msg);
    } finally {
      setIsAdding(false);
    }
  }

  async function handleRemoverVinculo(vinculoId: number) {
    setRemovingId(vinculoId);
    try {
      await api.delete(`/exame-insumos/${vinculoId}`);
      toast.success('Insumo removido da ficha técnica');
      await carregarDados();
      onUpdated?.();
    } catch (err: unknown) {
      let msg = 'Erro ao remover insumo da ficha técnica';
      if (err && typeof err === 'object' && 'response' in err) {
        const axErr = err as { response?: { data?: { message?: string; error?: string } } };
        msg = axErr.response?.data?.message || axErr.response?.data?.error || msg;
      }
      toast.error(msg);
    } finally {
      setRemovingId(null);
    }
  }

  async function handleSalvarAlteracoes() {
    if (idsComAlteracaoPendente.length === 0) return;

    setIsSavingChanges(true);
    let sucessos = 0;
    const falhas: string[] = [];

    for (const vinculoId of idsComAlteracaoPendente) {
      const vinculo = vinculos.find((v) => v.id === vinculoId);
      const novaQtd = quantidadesEditadas[vinculoId];
      const nomeInsumo =
        vinculo?.insumo?.nome ||
        insumosCatalogo.find((i) => i.id === vinculo?.insumoId)?.nome ||
        `#${vinculo?.insumoId}`;

      try {
        await api.put(`/exame-insumos/${vinculoId}`, {
          quantidade: novaQtd,
        });
        sucessos++;
      } catch {
        falhas.push(nomeInsumo);
      }
    }

    await carregarDados();
    onUpdated?.();
    setIsSavingChanges(false);

    if (falhas.length === 0) {
      toast.success(
        sucessos === 1
          ? 'Quantidade atualizada com sucesso.'
          : `${sucessos} quantidades atualizadas com sucesso.`
      );
    } else if (sucessos > 0) {
      toast.warning(
        `Atualização parcial: ${sucessos} salvo(s), mas falhou para: ${falhas.join(', ')}.`
      );
    } else {
      toast.error(
        `Não foi possível salvar as alterações de quantidade (${falhas.join(', ')}).`
      );
    }
  }

  const tituloExame = exameNome || exame?.nome || (exameId ? `Exame #${exameId}` : 'Ficha Técnica');

  return (
    <Drawer
      isOpen={open}
      onClose={onClose}
      title={tituloExame}
      subtitle={
        exameId
          ? `Ficha Técnica de Insumos • Código #${exameId}`
          : 'Configuração de consumo por atendimento'
      }
      widthClass="max-w-xl"
      footer={
        <div className="flex items-center justify-between w-full gap-space-sm">
          <span className="text-body-sm text-outline">
            {idsComAlteracaoPendente.length > 0
              ? `${idsComAlteracaoPendente.length} alteração(ões) pendente(s)`
              : `${vinculos.length} insumo(s) vinculado(s)`}
          </span>
          <div className="flex items-center gap-space-sm">
            <Button variant="secondary" onClick={onClose}>
              Fechar
            </Button>
            {idsComAlteracaoPendente.length > 0 && (
              <Button
                onClick={handleSalvarAlteracoes}
                isLoading={isSavingChanges}
                leftIcon={<Save className="size-4" />}
              >
                Salvar Quantidades
              </Button>
            )}
          </div>
        </div>
      }
    >
      <div className="flex flex-col gap-space-lg">
        {/* Aviso de regra de negócio */}
        <div className="flex items-start gap-2.5 p-space-md rounded-xl bg-surface-container-low border border-outline-variant/40 text-body-sm text-on-surface-variant">
          <AlertCircle size={18} className="text-primary shrink-0 mt-0.5" />
          <span>
            Atendimentos novos deste exame passarão a baixar estes insumos ao finalizar.
          </span>
        </div>

        {/* Formulário de adição de novo insumo */}
        <form
          onSubmit={handleAdicionarVinculo}
          className="flex flex-col gap-space-sm p-space-md rounded-xl bg-surface-container-lowest border border-outline-variant/50 shadow-2xs"
        >
          <div className="flex items-center gap-1.5 text-label-md font-semibold text-on-surface">
            <Link2 size={16} className="text-primary" />
            <span>Adicionar Insumo à Ficha Técnica</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-space-sm items-end">
            <div className="sm:col-span-2">
              <Select
                label="Insumo Ativo Disponível"
                placeholder={
                  insumosDisponiveis.length === 0
                    ? 'Todos os insumos ativos já estão vinculados'
                    : 'Selecione um insumo...'
                }
                options={insumosDisponiveis.map((i) => ({
                  label: i.nome,
                  value: i.id,
                }))}
                value={novoInsumoId}
                onChange={(e) => setNovoInsumoId(e.target.value)}
                disabled={isAdding || insumosDisponiveis.length === 0}
              />
            </div>

            <div>
              <Input
                label="Qtd. Consumida"
                type="number"
                min={1}
                step={1}
                value={novaQuantidade}
                onChange={(e) => setNovaQuantidade(e.target.value)}
                disabled={isAdding || insumosDisponiveis.length === 0}
                className="font-data-mono tabular-nums"
              />
            </div>
          </div>

          <div className="flex justify-end mt-1">
            <Button
              type="submit"
              size="sm"
              isLoading={isAdding}
              disabled={!novoInsumoId || insumosDisponiveis.length === 0}
              leftIcon={<Plus size={16} />}
            >
              Vincular Insumo
            </Button>
          </div>
        </form>

        {/* Lista de Insumos Vinculados */}
        <div className="flex flex-col gap-space-sm">
          <div className="flex items-center justify-between">
            <h3 className="text-label-md uppercase tracking-wider text-outline font-semibold m-0">
              Insumos Vinculados ({vinculos.length})
            </h3>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-10 gap-2 text-outline">
              <Loader2 className="animate-spin size-5 text-primary" />
              <span className="text-body-sm">Carregando insumos do exame...</span>
            </div>
          ) : vinculos.length === 0 ? (
            <div className="p-space-lg rounded-xl bg-surface-container-low/50 border border-dashed border-outline-variant text-center text-body-sm text-outline">
              Nenhum insumo vinculado a este exame. Adicione os materiais acima para configurar a baixa automática.
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {vinculos.map((v) => {
                const insumoCatalogo = insumosCatalogo.find(
                  (i) => i.id === v.insumoId
                );
                const nome =
                  v.insumo?.nome ||
                  insumoCatalogo?.nome ||
                  `Insumo #${v.insumoId}`;
                const saldoInfo = saldosMap[v.insumoId];
                const minimo =
                  saldoInfo?.quantidadeMinima ??
                  v.insumo?.quantidadeMinima ??
                  insumoCatalogo?.quantidadeMinima ??
                  0;
                const saldo = saldoInfo?.saldo ?? 0;
                const nivel = canReadSaldo
                  ? getNivelEstoque(saldo, minimo)
                  : null;
                const qtdAtual = quantidadesEditadas[v.id] ?? v.quantidade;
                const foiAlterado = qtdAtual !== v.quantidade;

                return (
                  <div
                    key={v.id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-space-sm p-space-md rounded-xl bg-surface-container-lowest border border-outline-variant/40 hover:border-outline-variant transition-colors"
                  >
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-body-md font-semibold text-on-surface">
                          {nome}
                        </span>
                        <span className="text-label-sm font-data-mono text-outline">
                          #{v.insumoId}
                        </span>
                      </div>

                      {canReadSaldo && saldoInfo && nivel && (
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-body-sm text-outline">
                            Saldo atual:{' '}
                            <strong className="font-data-mono tabular-nums text-on-surface">
                              {formatarNumero(saldo)}
                            </strong>
                          </span>
                          <StatusBadge
                            variant={nivel.status}
                            label={nivel.label}
                          />
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-space-sm self-end sm:self-center">
                      <div className="flex items-center gap-1.5">
                        <label
                          htmlFor={`qtd-vinculo-${v.id}`}
                          className="text-body-sm text-outline"
                        >
                          Consumo:
                        </label>
                        <input
                          id={`qtd-vinculo-${v.id}`}
                          type="number"
                          min={1}
                          step={1}
                          value={qtdAtual}
                          onChange={(e) => {
                            const val = Math.max(1, parseInt(e.target.value || '1', 10));
                            setQuantidadesEditadas((prev) => ({
                              ...prev,
                              [v.id]: Number.isNaN(val) ? 1 : val,
                            }));
                          }}
                          className={`w-20 h-9 px-2.5 rounded-lg border text-right font-data-mono tabular-nums text-body-md focus:outline-none focus:ring-2 ${
                            foiAlterado
                              ? 'border-primary bg-primary-fixed/20 text-primary font-bold focus:ring-primary/30'
                              : 'border-outline-variant bg-surface-container-lowest text-on-surface focus:ring-primary/25'
                          }`}
                        />
                        {foiAlterado && (
                          <Check
                            size={14}
                            className="text-primary shrink-0"
                            aria-label="Quantidade modificada"
                          />
                        )}
                      </div>

                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoverVinculo(v.id)}
                        isLoading={removingId === v.id}
                        title="Remover insumo da ficha técnica"
                        aria-label={`Remover ${nome} da ficha técnica`}
                        className="text-error hover:bg-error-container/40 hover:text-error"
                      >
                        <Archive size={15} />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </Drawer>
  );
}

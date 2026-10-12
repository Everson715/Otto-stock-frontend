import { useState, useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Plus, Edit, Trash2, Link as LinkIcon, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

import { api } from '../api/api';
import { exameInsumoSchema } from '../types/exameInsumo';
import type { ExameInsumo, ExameInsumoFormData } from '../types/exameInsumo';
import type { Exame } from '../types/exame';
import type { Insumo } from '../types/insumo';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { Modal } from '../components/ui/Modal';
import { Table } from '../components/ui/Table';

export function ExameInsumos() {
  const [vinculos, setVinculos] = useState<ExameInsumo[]>([]);
  const [exames, setExames] = useState<Exame[]>([]);
  const [insumos, setInsumos] = useState<Insumo[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const [filtroExameId, setFiltroExameId] = useState<string>('');
  const [page, setPage] = useState(1);
  const pageSize = 8;

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedVinculo, setSelectedVinculo] = useState<ExameInsumo | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<ExameInsumoFormData>({
    resolver: zodResolver(exameInsumoSchema),
  });

  async function carregarDados() {
    setIsLoading(true);
    try {
      const [resVinculos, resExames, resInsumos] = await Promise.all([
        api.get('/exame-insumos'),
        api.get('/exames'),
        api.get('/insumos'),
      ]);

      const listaVinculos = Array.isArray(resVinculos.data) ? resVinculos.data : resVinculos.data.items || [];
      const listaExames = Array.isArray(resExames.data) ? resExames.data : resExames.data.items || [];
      const listaInsumos = Array.isArray(resInsumos.data) ? resInsumos.data : resInsumos.data.items || [];

      setVinculos(listaVinculos);
      setExames(listaExames);
      setInsumos(listaInsumos);
    } catch {
      toast.error('Erro ao carregar fichas técnicas (vínculos exame-insumo)');
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    carregarDados();
  }, []);

  const filteredVinculos = useMemo(() => {
    if (!filtroExameId) return vinculos;
    const examId = Number(filtroExameId);
    return vinculos.filter((v) => v.exameId === examId);
  }, [vinculos, filtroExameId]);

  const totalPages = Math.ceil(filteredVinculos.length / pageSize) || 1;
  const paginatedVinculos = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredVinculos.slice(start, start + pageSize);
  }, [filteredVinculos, page, pageSize]);

  function handleNovo() {
    setIsEditMode(false);
    setSelectedVinculo(null);
    reset({
      exameId: filtroExameId ? Number(filtroExameId) : ('' as unknown as number),
      insumoId: '' as unknown as number,
      quantidade: 1,
    });
    setIsModalOpen(true);
  }

  function handleEditar(vinculo: ExameInsumo) {
    setIsEditMode(true);
    setSelectedVinculo(vinculo);
    setValue('exameId', vinculo.exameId);
    setValue('insumoId', vinculo.insumoId);
    setValue('quantidade', vinculo.quantidade);
    setIsModalOpen(true);
  }

  async function onSubmit(data: ExameInsumoFormData) {
    try {
      if (isEditMode && selectedVinculo) {
        await api.put(`/exame-insumos/${selectedVinculo.id}`, {
          quantidade: Number(data.quantidade),
        });
        toast.success('Quantidade do insumo atualizada com sucesso');
      } else {
        await api.post('/exame-insumos', {
          exameId: Number(data.exameId),
          insumoId: Number(data.insumoId),
          quantidade: Number(data.quantidade),
        });
        toast.success('Vínculo criado na ficha técnica com sucesso');
      }
      setIsModalOpen(false);
      reset();
      carregarDados();
    } catch (err: unknown) {
      let msg = 'Erro ao salvar vínculo na ficha técnica';
      if (err && typeof err === 'object' && 'response' in err) {
        const axErr = err as { response?: { data?: { message?: string; error?: string } } };
        msg = axErr.response?.data?.message || axErr.response?.data?.error || msg;
      }
      toast.error(msg);
    }
  }

  async function handleDeletar(id: number) {
    if (confirm('Tem certeza que deseja remover este insumo da ficha técnica?')) {
      try {
        await api.delete(`/exame-insumos/${id}`);
        toast.success('Vínculo removido com sucesso');
        carregarDados();
      } catch {
        toast.error('Erro ao remover vínculo');
      }
    }
  }

  const columns = [
    { header: 'ID', accessor: 'id' as keyof ExameInsumo },
    {
      header: 'Exame',
      accessor: (v: ExameInsumo) => v.exame?.nome || `Exame #${v.exameId}`,
    },
    {
      header: 'Insumo Consumido',
      accessor: (v: ExameInsumo) => v.insumo?.nome || `Insumo #${v.insumoId}`,
    },
    {
      header: 'Qtd. Consumida',
      accessor: (v: ExameInsumo) => <strong>{v.quantidade}</strong>,
    },
    {
      header: 'Ações',
      accessor: (v: ExameInsumo) => (
        <div className="flex gap-2">
          <Button variant="secondary" onClick={() => handleEditar(v)} title="Editar quantidade">
            <Edit className="size-4" />
          </Button>
          <Button variant="danger" onClick={() => handleDeletar(v.id)} title="Remover vínculo">
            <Trash2 className="size-4" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-4 p-4 text-left">
      <div className="flex justify-between items-center flex-wrap gap-2">
        <div>
          <h2>Ficha Técnica (Exame - Insumos)</h2>
          <p className="text-sm text-gray-500">
            Associação dos insumos e quantidades que sofrem baixa automática por exame
          </p>
        </div>
        <Button onClick={handleNovo} leftIcon={<Plus className="size-4" />}>
          Vincular Insumo
        </Button>
      </div>

      <div className="flex justify-between items-center flex-wrap gap-2 mt-2">
        <div style={{ maxWidth: 300, width: '100%' }}>
          <Select
            options={exames.map((e) => ({ label: e.nome, value: e.id }))}
            value={filtroExameId}
            onChange={(e) => {
              setFiltroExameId(e.target.value);
              setPage(1);
            }}
          />
        </div>
        <span className="text-sm text-gray-500">
          Total de vínculos: {filteredVinculos.length}
        </span>
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center p-12 gap-2">
          <Loader2 className="animate-spin size-8 text-blue-500" />
          <span className="text-sm text-gray-500">Carregando fichas técnicas...</span>
        </div>
      ) : (
        <>
          <Table
            columns={columns}
            data={paginatedVinculos}
            keyExtractor={(item) => item.id}
          />

          {filteredVinculos.length > pageSize && (
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

      {/* Modal Adicionar / Editar */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={isEditMode ? 'Editar Quantidade do Vínculo' : 'Novo Vínculo de Insumo'}
      >
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-3">
          <Select
            label="Exame *"
            options={exames.map((e) => ({ label: e.nome, value: e.id }))}
            disabled={isEditMode || isSubmitting}
            error={errors.exameId?.message}
            {...register('exameId', { valueAsNumber: true })}
          />

          <Select
            label="Insumo Necessário *"
            options={insumos.map((i) => ({ label: i.nome, value: i.id }))}
            disabled={isEditMode || isSubmitting}
            error={errors.insumoId?.message}
            {...register('insumoId', { valueAsNumber: true })}
          />

          <Input
            label="Quantidade Consumida por Exame *"
            type="number"
            min={1}
            error={errors.quantidade?.message}
            {...register('quantidade', { valueAsNumber: true })}
          />

          <div className="flex justify-end gap-2 mt-4">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setIsModalOpen(false)}
              disabled={isSubmitting}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              isLoading={isSubmitting}
              leftIcon={<LinkIcon className="size-4" />}
            >
              {isEditMode ? 'Atualizar Quantidade' : 'Vincular'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

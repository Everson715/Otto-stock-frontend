import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import {
  Plus,
  Edit,
  Trash2,
  Eye,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Info,
  Package,
} from 'lucide-react';

import { api } from '../api/api';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Table } from '../components/ui/Table';
import { Modal } from '../components/ui/Modal';

const insumoFormSchema = z.object({
  nome: z.string().min(3, 'O nome deve ter no mínimo 3 caracteres'),
  quantidadeMinima: z
    .number({ message: 'Informe a quantidade mínima' })
    .min(0, 'A quantidade mínima deve ser maior ou igual a 0'),
  unidade: z.string().optional(),
});

type InsumoFormDataLocal = z.infer<typeof insumoFormSchema>;

interface InsumoItem {
  id: number;
  nome: string;
  quantidadeMinima?: number;
  ativo?: boolean;
  createdAt?: string;
}

export function Insumos() {
  const [insumos, setInsumos] = useState<InsumoItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const limit = 8;

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedInsumo, setSelectedInsumo] = useState<InsumoItem | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<InsumoFormDataLocal>({
    resolver: zodResolver(insumoFormSchema),
    defaultValues: {
      nome: '',
      quantidadeMinima: 0,
      unidade: 'un',
    },
  });

  async function carregarInsumos() {
    setIsLoading(true);
    try {
      const params: Record<string, string | number> = {
        page,
        limit,
      };
      if (searchTerm.trim()) {
        params.nome = searchTerm.trim();
      }

      const response = await api.get('/insumos', { params });
      const items: InsumoItem[] = response.data?.items ?? (Array.isArray(response.data) ? response.data : []);
      const total = response.data?.total ?? items.length;
      const pages = response.data?.totalPages ?? (Math.ceil(total / limit) || 1);

      setInsumos(items);
      setTotalCount(total);
      setTotalPages(pages);
    } catch {
      toast.error('Erro ao carregar insumos');
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    carregarInsumos();
  }, [page, searchTerm]);

  function handleNovo() {
    setIsEditMode(false);
    setSelectedInsumo(null);
    reset({ nome: '', quantidadeMinima: 0, unidade: 'un' });
    setIsModalOpen(true);
  }

  function handleEditar(insumo: InsumoItem) {
    setIsEditMode(true);
    setSelectedInsumo(insumo);
    setValue('nome', insumo.nome);
    setValue('quantidadeMinima', insumo.quantidadeMinima ?? 0);
    setValue('unidade', 'un');
    setIsModalOpen(true);
  }

  function handleVerDetalhes(insumo: InsumoItem) {
    setSelectedInsumo(insumo);
    setIsDetailsOpen(true);
  }

  async function onSubmit(data: InsumoFormDataLocal) {
    try {
      const payload = {
        nome: data.nome.trim(),
        quantidadeMinima: Number(data.quantidadeMinima),
      };

      if (isEditMode && selectedInsumo) {
        await api.put(`/insumos/${selectedInsumo.id}`, payload);
        toast.success('Insumo atualizado com sucesso');
      } else {
        await api.post('/insumos', payload);
        toast.success('Insumo cadastrado com sucesso');
      }
      setIsModalOpen(false);
      reset();
      carregarInsumos();
    } catch (err: unknown) {
      let msg = 'Erro ao salvar insumo';
      if (err && typeof err === 'object' && 'response' in err) {
        const axErr = err as { response?: { data?: { message?: string; error?: string } } };
        msg = axErr.response?.data?.message || axErr.response?.data?.error || msg;
      }
      toast.error(msg);
    }
  }

  async function handleDeletar(id: number) {
    if (confirm('Tem certeza que deseja desativar este insumo?')) {
      try {
        await api.delete(`/insumos/${id}`);
        toast.success('Insumo desativado com sucesso');
        carregarInsumos();
      } catch {
        toast.error('Erro ao excluir insumo');
      }
    }
  }

  const columns = [
    { header: 'ID', accessor: 'id' as keyof InsumoItem },
    { header: 'Nome', accessor: 'nome' as keyof InsumoItem },
    {
      header: 'Estoque Mínimo',
      accessor: (i: InsumoItem) => <strong>{i.quantidadeMinima ?? 0}</strong>,
    },
    {
      header: 'Unidade',
      accessor: () => (
        <span className="text-xs text-gray-400" title="Campo pendente no backend (ver PENDENCIAS_BACKEND.md)">
          un
        </span>
      ),
    },
    {
      header: 'Ações',
      accessor: (insumo: InsumoItem) => (
        <div className="flex gap-2">
          <Button variant="ghost" onClick={() => handleVerDetalhes(insumo)} title="Ver detalhes">
            <Eye className="size-4" />
          </Button>
          <Button variant="secondary" onClick={() => handleEditar(insumo)} title="Editar">
            <Edit className="size-4" />
          </Button>
          <Button variant="danger" onClick={() => handleDeletar(insumo.id)} title="Desativar">
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
          <h2>Cadastro de Insumos</h2>
          <p className="text-sm text-gray-500">
            Catálogo de materiais e medicamentos com controle de estoque mínimo
          </p>
        </div>
        <Button onClick={handleNovo} leftIcon={<Plus className="size-4" />}>
          Novo Insumo
        </Button>
      </div>

      <div className="flex justify-between items-center flex-wrap gap-2 mt-2">
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
        <span className="text-sm text-gray-500">
          Total de registros: {totalCount}
        </span>
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center p-12 gap-2">
          <Loader2 className="animate-spin size-8 text-blue-500" />
          <span className="text-sm text-gray-500">Carregando insumos...</span>
        </div>
      ) : (
        <>
          <Table columns={columns} data={insumos} keyExtractor={(i) => i.id} />

          {totalPages > 1 && (
            <div className="pagination-container">
              <span className="pagination-info">
                Página {page} de {totalPages} ({totalCount} insumos)
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

      {/* Modal de Criação/Edição */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={isEditMode ? 'Editar Insumo' : 'Novo Insumo'}
      >
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-3">
          <Input
            label="Nome do Insumo *"
            placeholder="Ex: Luvas descartáveis M"
            error={errors.nome?.message}
            {...register('nome')}
          />

          <Input
            label="Estoque Mínimo (quantidadeMinima) *"
            type="number"
            min={0}
            placeholder="Ex: 50"
            error={errors.quantidadeMinima?.message}
            {...register('quantidadeMinima', { valueAsNumber: true })}
          />

          <div className="flex flex-col gap-1 w-full opacity-75">
            <Input
              label="Unidade de Medida (Indisponível no backend)"
              placeholder="Ex: un, cx, ampola"
              disabled
              {...register('unidade')}
            />
            <span className="text-xs text-amber-600 flex items-center gap-1 mt-1">
              <Info className="size-3" />
              O campo de unidade física aguarda inclusão no modelo do backend (PENDENCIAS_BACKEND.md).
            </span>
          </div>

          <div className="flex justify-end gap-2 mt-4">
            <Button variant="secondary" type="button" onClick={() => setIsModalOpen(false)} disabled={isSubmitting}>
              Cancelar
            </Button>
            <Button type="submit" isLoading={isSubmitting} leftIcon={<Package className="size-4" />}>
              {isEditMode ? 'Atualizar Insumo' : 'Salvar Insumo'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal de Detalhes */}
      <Modal
        isOpen={isDetailsOpen}
        onClose={() => setIsDetailsOpen(false)}
        title="Detalhes do Insumo"
      >
        {selectedInsumo && (
          <div className="flex flex-col gap-3 text-left">
            <div>
              <span className="text-xs text-gray-500 block">ID</span>
              <strong>#{selectedInsumo.id}</strong>
            </div>
            <div>
              <span className="text-xs text-gray-500 block">Nome do Insumo</span>
              <span>{selectedInsumo.nome}</span>
            </div>
            <div>
              <span className="text-xs text-gray-500 block">Estoque Mínimo Recomendado</span>
              <strong>{selectedInsumo.quantidadeMinima ?? 0} un</strong>
            </div>
            <div>
              <span className="text-xs text-gray-500 block">Unidade de Medida</span>
              <span className="text-sm text-gray-400 italic">Pendente no backend (padrão un)</span>
            </div>
            <div className="flex justify-end mt-4">
              <Button variant="secondary" onClick={() => setIsDetailsOpen(false)}>
                Fechar
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
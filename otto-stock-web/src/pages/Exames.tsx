import { useEffect, useState, useMemo } from 'react';
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
  ClipboardList,
} from 'lucide-react';

import { api } from '../api/api';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Table } from '../components/ui/Table';
import { Modal } from '../components/ui/Modal';

const exameFormSchema = z.object({
  nome: z.string().min(1, 'O nome do exame é obrigatório'),
  descricao: z.string().optional(),
});

type ExameFormDataLocal = z.infer<typeof exameFormSchema>;

interface ExameItem {
  id: number;
  nome: string;
  descricao?: string;
  ativo?: boolean;
}

export function Exames() {
  const [exames, setExames] = useState<ExameItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const pageSize = 8;

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedExame, setSelectedExame] = useState<ExameItem | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<ExameFormDataLocal>({
    resolver: zodResolver(exameFormSchema),
  });

  async function carregarExames() {
    setIsLoading(true);
    try {
      const response = await api.get('/exames');
      const data = Array.isArray(response.data) ? response.data : response.data.items || [];
      setExames(data);
    } catch {
      toast.error('Erro ao carregar exames');
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    carregarExames();
  }, []);

  const filteredExames = useMemo(() => {
    const term = searchTerm.toLowerCase().trim();
    if (!term) return exames;
    return exames.filter(
      (e) => e.nome.toLowerCase().includes(term) || (e.descricao && e.descricao.toLowerCase().includes(term))
    );
  }, [exames, searchTerm]);

  const totalPages = Math.ceil(filteredExames.length / pageSize) || 1;
  const paginatedExames = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredExames.slice(start, start + pageSize);
  }, [filteredExames, page, pageSize]);

  function handleNovo() {
    setIsEditMode(false);
    setSelectedExame(null);
    reset({ nome: '', descricao: '' });
    setIsModalOpen(true);
  }

  function handleEditar(exame: ExameItem) {
    setIsEditMode(true);
    setSelectedExame(exame);
    setValue('nome', exame.nome);
    setValue('descricao', exame.descricao || '');
    setIsModalOpen(true);
  }

  function handleVerDetalhes(exame: ExameItem) {
    setSelectedExame(exame);
    setIsDetailsOpen(true);
  }

  async function onSubmit(data: ExameFormDataLocal) {
    try {
      const payload: { nome: string; descricao?: string } = {
        nome: data.nome.trim(),
      };
      if (data.descricao?.trim()) {
        payload.descricao = data.descricao.trim();
      }

      if (isEditMode && selectedExame) {
        await api.put(`/exames/${selectedExame.id}`, payload);
        toast.success('Exame atualizado com sucesso');
      } else {
        await api.post('/exames', payload);
        toast.success('Exame cadastrado com sucesso');
      }
      setIsModalOpen(false);
      reset();
      carregarExames();
    } catch (err: unknown) {
      let msg = 'Erro ao salvar exame';
      if (err && typeof err === 'object' && 'response' in err) {
        const axErr = err as { response?: { data?: { message?: string; error?: string } } };
        msg = axErr.response?.data?.message || axErr.response?.data?.error || msg;
      }
      toast.error(msg);
    }
  }

  async function handleDeletar(id: number) {
    if (confirm('Tem certeza que deseja desativar este exame?')) {
      try {
        await api.delete(`/exames/${id}`);
        toast.success('Exame excluído com sucesso');
        carregarExames();
      } catch {
        toast.error('Erro ao excluir exame');
      }
    }
  }

  const columns = [
    { header: 'ID', accessor: 'id' as keyof ExameItem },
    { header: 'Nome do Exame', accessor: 'nome' as keyof ExameItem },
    {
      header: 'Descrição / Observação',
      accessor: (e: ExameItem) => e.descricao || <span className="text-xs text-gray-400">-</span>,
    },
    {
      header: 'Ações',
      accessor: (exame: ExameItem) => (
        <div className="flex gap-2">
          <Button variant="ghost" onClick={() => handleVerDetalhes(exame)} title="Ver detalhes">
            <Eye className="size-4" />
          </Button>
          <Button variant="secondary" onClick={() => handleEditar(exame)} title="Editar">
            <Edit className="size-4" />
          </Button>
          <Button variant="danger" onClick={() => handleDeletar(exame.id)} title="Excluir">
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
          <h2>Cadastro de Exames</h2>
          <p className="text-sm text-gray-500">
            Catálogo de procedimentos e exames laboratoriais da clínica
          </p>
        </div>
        <Button onClick={handleNovo} leftIcon={<Plus className="size-4" />}>
          Novo Exame
        </Button>
      </div>

      <div className="flex justify-between items-center flex-wrap gap-2 mt-2">
        <div className="search-input-wrapper">
          <Input
            placeholder="Buscar exame por nome ou descrição..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setPage(1);
            }}
          />
        </div>
        <span className="text-sm text-gray-500">
          Total de registros: {filteredExames.length}
        </span>
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center p-12 gap-2">
          <Loader2 className="animate-spin size-8 text-blue-500" />
          <span className="text-sm text-gray-500">Carregando exames...</span>
        </div>
      ) : (
        <>
          <Table
            columns={columns}
            data={paginatedExames}
            keyExtractor={(e) => e.id}
            emptyMessage="Nenhum exame cadastrado. Clique no botão 'Novo Exame' acima para cadastrar procedimentos."
          />

          {filteredExames.length > pageSize && (
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

      {/* Modal de Criação/Edição */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={isEditMode ? 'Editar Exame' : 'Novo Exame'}
      >
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-3">
          <Input
            label="Nome do Exame *"
            placeholder="Ex: Hemograma Completo"
            error={errors.nome?.message}
            {...register('nome')}
          />

          <Input
            label="Descrição / Preparo (Opcional)"
            placeholder="Ex: Jejum obrigatório de 8 horas"
            error={errors.descricao?.message}
            {...register('descricao')}
          />

          <div className="flex justify-end gap-2 mt-4">
            <Button variant="secondary" type="button" onClick={() => setIsModalOpen(false)} disabled={isSubmitting}>
              Cancelar
            </Button>
            <Button type="submit" isLoading={isSubmitting} leftIcon={<ClipboardList className="size-4" />}>
              {isEditMode ? 'Atualizar Exame' : 'Salvar Exame'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal de Detalhes */}
      <Modal
        isOpen={isDetailsOpen}
        onClose={() => setIsDetailsOpen(false)}
        title="Detalhes do Exame"
      >
        {selectedExame && (
          <div className="flex flex-col gap-3 text-left">
            <div>
              <span className="text-xs text-gray-500 block">ID</span>
              <strong>#{selectedExame.id}</strong>
            </div>
            <div>
              <span className="text-xs text-gray-500 block">Nome do Exame</span>
              <span>{selectedExame.nome}</span>
            </div>
            <div>
              <span className="text-xs text-gray-500 block">Descrição / Preparo</span>
              <span>{selectedExame.descricao || 'Sem descrição cadastrada'}</span>
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
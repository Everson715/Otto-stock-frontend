import { useState, useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Plus, Edit, Trash2, Eye, Stethoscope, ChevronLeft, ChevronRight, Loader2, Info } from 'lucide-react';
import { toast } from 'sonner';

import { api } from '../api/api';
import { medicoSchema } from '../types/medico';
import type { Medico, MedicoFormData } from '../types/medico';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Modal } from '../components/ui/Modal';
import { Table } from '../components/ui/Table';

export function Medicos() {
  const [medicos, setMedicos] = useState<Medico[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const pageSize = 8;

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedMedico, setSelectedMedico] = useState<Medico | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<MedicoFormData>({
    resolver: zodResolver(medicoSchema),
  });

  async function carregarMedicos() {
    setIsLoading(true);
    try {
      const response = await api.get('/medicos');
      const data = Array.isArray(response.data) ? response.data : response.data.items || [];
      setMedicos(data);
    } catch {
      toast.error('Erro ao carregar médicos');
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    carregarMedicos();
  }, []);

  const filteredMedicos = useMemo(() => {
    const term = searchTerm.toLowerCase().trim();
    if (!term) return medicos;
    return medicos.filter(
      (m) => m.nome.toLowerCase().includes(term) || (m.crm && m.crm.toLowerCase().includes(term))
    );
  }, [medicos, searchTerm]);

  const totalPages = Math.ceil(filteredMedicos.length / pageSize) || 1;
  const paginatedMedicos = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredMedicos.slice(start, start + pageSize);
  }, [filteredMedicos, page, pageSize]);

  function handleNovo() {
    setIsEditMode(false);
    setSelectedMedico(null);
    reset({ nome: '', crm: '', especialidade: '' });
    setIsModalOpen(true);
  }

  function handleEditar(medico: Medico) {
    setIsEditMode(true);
    setSelectedMedico(medico);
    setValue('nome', medico.nome);
    setValue('crm', medico.crm || '');
    setValue('especialidade', '');
    setIsModalOpen(true);
  }

  function handleVerDetalhes(medico: Medico) {
    setSelectedMedico(medico);
    setIsDetailsOpen(true);
  }

  async function onSubmit(data: MedicoFormData) {
    try {
      const payload: Record<string, string | undefined> = {
        nome: data.nome.trim(),
      };
      if (data.crm) {
        payload.crm = data.crm.trim();
      }

      if (isEditMode && selectedMedico) {
        await api.put(`/medicos/${selectedMedico.id}`, payload);
        toast.success('Médico atualizado com sucesso');
      } else {
        await api.post('/medicos', payload);
        toast.success('Médico cadastrado com sucesso');
      }
      setIsModalOpen(false);
      reset();
      carregarMedicos();
    } catch (err: unknown) {
      let msg = 'Erro ao salvar médico';
      if (err && typeof err === 'object' && 'response' in err) {
        const axErr = err as { response?: { data?: { message?: string; error?: string } } };
        msg = axErr.response?.data?.message || axErr.response?.data?.error || msg;
      }
      toast.error(msg);
    }
  }

  async function handleDeletar(id: number) {
    if (confirm('Tem certeza que deseja desativar este médico?')) {
      try {
        await api.delete(`/medicos/${id}`);
        toast.success('Médico desativado com sucesso');
        carregarMedicos();
      } catch {
        toast.error('Erro ao desativar médico');
      }
    }
  }

  const columns = [
    { header: 'ID', accessor: 'id' as keyof Medico },
    { header: 'Nome', accessor: 'nome' as keyof Medico },
    {
      header: 'CRM',
      accessor: (m: Medico) => m.crm || '-',
    },
    {
      header: 'Especialidade',
      accessor: () => (
        <span className="text-xs text-gray-400 italic" title="Campo pendente no backend (ver PENDENCIAS_BACKEND.md)">
          Não cadastrada no backend
        </span>
      ),
    },
    {
      header: 'Status',
      accessor: (m: Medico) => (
        <span className={m.ativo ? 'badge-ok' : 'badge-alerta'}>
          {m.ativo ? 'Ativo' : 'Inativo'}
        </span>
      ),
    },
    {
      header: 'Ações',
      accessor: (m: Medico) => (
        <div className="flex gap-2">
          <Button variant="ghost" onClick={() => handleVerDetalhes(m)} title="Ver detalhes">
            <Eye className="size-4" />
          </Button>
          <Button variant="secondary" onClick={() => handleEditar(m)} title="Editar">
            <Edit className="size-4" />
          </Button>
          <Button variant="danger" onClick={() => handleDeletar(m.id)} title="Desativar">
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
          <h2>Corpo Clínico (Médicos)</h2>
          <p className="text-sm text-gray-500">Gestão de médicos credenciados da clínica</p>
        </div>
        <Button onClick={handleNovo} leftIcon={<Plus className="size-4" />}>
          Novo Médico
        </Button>
      </div>

      <div className="flex justify-between items-center flex-wrap gap-2 mt-2">
        <div className="search-input-wrapper">
          <Input
            placeholder="Buscar por nome ou CRM..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setPage(1);
            }}
          />
        </div>
        <span className="text-sm text-gray-500">
          Total de registros: {filteredMedicos.length}
        </span>
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center p-12 gap-2">
          <Loader2 className="animate-spin size-8 text-blue-500" />
          <span className="text-sm text-gray-500">Carregando médicos...</span>
        </div>
      ) : (
        <>
          <Table
            columns={columns}
            data={paginatedMedicos}
            keyExtractor={(item) => item.id}
          />

          {filteredMedicos.length > pageSize && (
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

      {/* Modal Cadastro/Edição */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={isEditMode ? 'Editar Médico' : 'Novo Médico'}
      >
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-3">
          <Input
            label="Nome Completo *"
            placeholder="Ex: Dr. Fernando Rocha"
            error={errors.nome?.message}
            {...register('nome')}
          />

          <Input
            label="CRM (Registro do Conselho)"
            placeholder="Ex: 123456/SP"
            error={errors.crm?.message}
            {...register('crm')}
          />

          <div className="flex flex-col gap-1 w-full opacity-75">
            <Input
              label="Especialidade (Indisponível no backend atual)"
              placeholder="Ex: Cardiologia, Clínica Geral"
              disabled
              {...register('especialidade')}
            />
            <span className="text-xs text-amber-600 flex items-center gap-1 mt-1">
              <Info className="size-3" />
              O campo de especialidade médica aguarda inclusão no banco de dados do backend.
            </span>
          </div>

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
              leftIcon={<Stethoscope className="size-4" />}
            >
              {isEditMode ? 'Salvar Alterações' : 'Cadastrar'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal Detalhes */}
      <Modal
        isOpen={isDetailsOpen}
        onClose={() => setIsDetailsOpen(false)}
        title="Detalhes do Médico"
      >
        {selectedMedico && (
          <div className="flex flex-col gap-3 text-left">
            <div>
              <span className="text-xs text-gray-500 block">Nome</span>
              <strong>{selectedMedico.nome}</strong>
            </div>
            <div>
              <span className="text-xs text-gray-500 block">CRM</span>
              <span>{selectedMedico.crm || 'Não informado'}</span>
            </div>
            <div>
              <span className="text-xs text-gray-500 block">Especialidade</span>
              <span className="text-sm text-gray-400 italic">Pendente no backend</span>
            </div>
            <div>
              <span className="text-xs text-gray-500 block">Status</span>
              <span className={selectedMedico.ativo ? 'badge-ok' : 'badge-alerta'}>
                {selectedMedico.ativo ? 'Ativo' : 'Inativo'}
              </span>
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

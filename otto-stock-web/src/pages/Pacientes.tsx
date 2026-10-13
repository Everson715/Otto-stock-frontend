import { useState, useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Plus, Edit, Trash2, Eye, UserCheck, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

import { api } from '../api/api';
import { pacienteSchema } from '../types/paciente';
import type { Paciente, PacienteFormData } from '../types/paciente';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Modal } from '../components/ui/Modal';
import { Table } from '../components/ui/Table';

export function Pacientes() {
  const [pacientes, setPacientes] = useState<Paciente[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const pageSize = 8;

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedPaciente, setSelectedPaciente] = useState<Paciente | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<PacienteFormData>({
    resolver: zodResolver(pacienteSchema),
  });

  async function carregarPacientes() {
    setIsLoading(true);
    try {
      const response = await api.get('/pacientes');
      const data = Array.isArray(response.data) ? response.data : response.data.items || [];
      setPacientes(data);
    } catch {
      toast.error('Erro ao carregar pacientes');
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    carregarPacientes();
  }, []);

  const filteredPacientes = useMemo(() => {
    const term = searchTerm.toLowerCase().trim();
    if (!term) return pacientes;
    return pacientes.filter(
      (p) => p.nome.toLowerCase().includes(term) || (p.cpf && p.cpf.includes(term))
    );
  }, [pacientes, searchTerm]);

  const totalPages = Math.ceil(filteredPacientes.length / pageSize) || 1;
  const paginatedPacientes = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredPacientes.slice(start, start + pageSize);
  }, [filteredPacientes, page, pageSize]);

  function handleNovo() {
    setIsEditMode(false);
    setSelectedPaciente(null);
    reset({ nome: '', cpf: '', dataNascimento: '', contato: '' });
    setIsModalOpen(true);
  }

  function handleEditar(paciente: Paciente) {
    setIsEditMode(true);
    setSelectedPaciente(paciente);
    setValue('nome', paciente.nome);
    setValue('cpf', paciente.cpf);
    setValue('dataNascimento', paciente.dataNascimento ? paciente.dataNascimento.slice(0, 10) : '');
    setValue('contato', paciente.contato || '');
    setIsModalOpen(true);
  }

  function handleVerDetalhes(paciente: Paciente) {
    setSelectedPaciente(paciente);
    setIsDetailsOpen(true);
  }

  async function onSubmit(data: PacienteFormData) {
    try {
      const payload: Record<string, string | undefined> = {
        nome: data.nome.trim(),
        cpf: data.cpf.trim(),
      };
      if (data.dataNascimento) {
        payload.dataNascimento = new Date(data.dataNascimento).toISOString();
      }
      if (data.contato) {
        payload.contato = data.contato.trim();
      }

      if (isEditMode && selectedPaciente) {
        await api.put(`/pacientes/${selectedPaciente.id}`, payload);
        toast.success('Paciente atualizado com sucesso');
      } else {
        await api.post('/pacientes', payload);
        toast.success('Paciente cadastrado com sucesso');
      }
      setIsModalOpen(false);
      reset();
      carregarPacientes();
    } catch (err: unknown) {
      let msg = 'Erro ao salvar paciente';
      if (err && typeof err === 'object' && 'response' in err) {
        const axErr = err as { response?: { data?: { message?: string; error?: string } } };
        msg = axErr.response?.data?.message || axErr.response?.data?.error || msg;
      }
      toast.error(msg);
    }
  }

  async function handleDeletar(id: number) {
    if (confirm('Tem certeza que deseja desativar este paciente?')) {
      try {
        await api.delete(`/pacientes/${id}`);
        toast.success('Paciente desativado com sucesso');
        carregarPacientes();
      } catch {
        toast.error('Erro ao desativar paciente');
      }
    }
  }

  const columns = [
    { header: 'ID', accessor: 'id' as keyof Paciente },
    { header: 'Nome', accessor: 'nome' as keyof Paciente },
    { header: 'CPF', accessor: 'cpf' as keyof Paciente },
    {
      header: 'Contato',
      accessor: (p: Paciente) => p.contato || '-',
    },
    {
      header: 'Ações',
      accessor: (p: Paciente) => (
        <div className="flex gap-2">
          <Button variant="ghost" onClick={() => handleVerDetalhes(p)} title="Ver detalhes">
            <Eye className="size-4" />
          </Button>
          <Button variant="secondary" onClick={() => handleEditar(p)} title="Editar">
            <Edit className="size-4" />
          </Button>
          <Button variant="danger" onClick={() => handleDeletar(p.id)} title="Desativar">
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
          <h2>Pacientes</h2>
          <p className="text-sm text-gray-500">Gestão e cadastro de pacientes da clínica</p>
        </div>
        <Button onClick={handleNovo} leftIcon={<Plus className="size-4" />}>
          Novo Paciente
        </Button>
      </div>

      <div className="flex justify-between items-center flex-wrap gap-2 mt-2">
        <div className="search-input-wrapper">
          <Input
            placeholder="Buscar por nome ou CPF..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setPage(1);
            }}
          />
        </div>
        <span className="text-sm text-gray-500">
          Total de registros: {filteredPacientes.length}
        </span>
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center p-12 gap-2">
          <Loader2 className="animate-spin size-8 text-blue-500" />
          <span className="text-sm text-gray-500">Carregando pacientes...</span>
        </div>
      ) : (
        <>
          <Table
            columns={columns}
            data={paginatedPacientes}
            keyExtractor={(item) => item.id}
            emptyMessage="Nenhum paciente cadastrado. Clique no botão 'Novo Paciente' acima para iniciar o cadastro."
          />

          {filteredPacientes.length > pageSize && (
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
        title={isEditMode ? 'Editar Paciente' : 'Novo Paciente'}
      >
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-3">
          <Input
            label="Nome Completo *"
            placeholder="Ex: Maria de Souza"
            error={errors.nome?.message}
            {...register('nome')}
          />

          <Input
            label="CPF (11 dígitos numéricos) *"
            placeholder="Ex: 12345678901"
            maxLength={11}
            error={errors.cpf?.message}
            {...register('cpf')}
          />

          <Input
            label="Data de Nascimento"
            type="date"
            error={errors.dataNascimento?.message}
            {...register('dataNascimento')}
          />

          <Input
            label="Contato / Telefone"
            placeholder="Ex: (11) 98765-4321"
            error={errors.contato?.message}
            {...register('contato')}
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
              leftIcon={<UserCheck className="size-4" />}
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
        title="Detalhes do Paciente"
      >
        {selectedPaciente && (
          <div className="flex flex-col gap-3 text-left">
            <div>
              <span className="text-xs text-gray-500 block">Nome</span>
              <strong>{selectedPaciente.nome}</strong>
            </div>
            <div>
              <span className="text-xs text-gray-500 block">CPF</span>
              <span>{selectedPaciente.cpf}</span>
            </div>
            <div>
              <span className="text-xs text-gray-500 block">Contato</span>
              <span>{selectedPaciente.contato || 'Não informado'}</span>
            </div>
            <div>
              <span className="text-xs text-gray-500 block">Data de Nascimento</span>
              <span>
                {selectedPaciente.dataNascimento
                  ? new Date(selectedPaciente.dataNascimento).toLocaleDateString('pt-BR')
                  : 'Não informada'}
              </span>
            </div>
            <div>
              <span className="text-xs text-gray-500 block">Status</span>
              <span className={selectedPaciente.ativo ? 'badge-ok' : 'badge-alerta'}>
                {selectedPaciente.ativo ? 'Ativo' : 'Inativo'}
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

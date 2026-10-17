import { useState, useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Plus,
  Pencil,
  Archive,
  Eye,
  Stethoscope,
  Search,
  RefreshCw,
  CheckCircle2,
} from 'lucide-react';
import { toast } from 'sonner';

import { api } from '../api/api';
import { medicoSchema } from '../types/medico';
import type { Medico, MedicoFormData } from '../types/medico';
import { formatarCrm } from '../utils/format';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Modal } from '../components/ui/Modal';
import { MetricCard } from '../components/ui/MetricCard';
import { PageHeader } from '../components/ui/PageHeader';
import { Pagination } from '../components/ui/Pagination';
import { Skeleton } from '../components/ui/Skeleton';
import { StatusBadge } from '../components/ui/StatusBadge';
import { Table, type Column } from '../components/ui/Table';

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
  const [medicoParaDesativar, setMedicoParaDesativar] = useState<Medico | null>(null);
  const [isDeactivating, setIsDeactivating] = useState(false);

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
    reset({ nome: '', crm: '' });
    setIsModalOpen(true);
  }

  function handleEditar(medico: Medico) {
    setIsEditMode(true);
    setSelectedMedico(medico);
    setValue('nome', medico.nome);
    setValue('crm', medico.crm || '');
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

  async function confirmarDesativacao() {
    if (!medicoParaDesativar) return;
    setIsDeactivating(true);
    try {
      await api.delete(`/medicos/${medicoParaDesativar.id}`);
      toast.success('Médico desativado com sucesso');
      setMedicoParaDesativar(null);
      carregarMedicos();
    } catch {
      toast.error('Erro ao desativar médico');
    } finally {
      setIsDeactivating(false);
    }
  }

  const columns: Column<Medico>[] = [
    {
      header: 'ID',
      accessor: (m) => (
        <span className="font-data-mono text-label-md text-outline">#{m.id}</span>
      ),
    },
    {
      header: 'Profissional',
      accessor: (m) => (
        <span className="font-semibold text-on-surface">{m.nome}</span>
      ),
    },
    {
      header: 'Registro (CRM)',
      accessor: (m) => (
        <span className="font-data-mono text-body-md text-on-surface-variant">
          {formatarCrm(m.crm)}
        </span>
      ),
    },
    {
      header: 'Status',
      accessor: (m) =>
        m.ativo ? (
          <StatusBadge variant="conforme" label="Ativo" />
        ) : (
          <StatusBadge variant="neutro" label="Inativo" />
        ),
    },
    {
      header: 'Ações',
      align: 'right',
      accessor: (m) => (
        <div className="flex items-center justify-end gap-1.5">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleVerDetalhes(m)}
            title="Ver detalhes"
          >
            <Eye size={15} />
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => handleEditar(m)}
            title="Editar"
          >
            <Pencil size={15} />
          </Button>
          <Button
            variant="danger"
            size="sm"
            onClick={() => setMedicoParaDesativar(m)}
            title="Desativar"
          >
            <Archive size={15} />
          </Button>
        </div>
      ),
    },
  ];

  const medicosComCrm = useMemo(
    () => medicos.filter((m) => Boolean(m.crm && m.crm.trim())).length,
    [medicos]
  );

  return (
    <div className="w-full max-w-[1600px] mx-auto px-gutter lg:px-margin-desktop py-space-lg flex flex-col gap-space-lg">
      <PageHeader
        breadcrumbs={[
          { label: 'Início', to: '/' },
          { label: 'Cadastros' },
          { label: 'Médicos' },
        ]}
        titulo="Corpo Clínico (Médicos)"
        subtitulo="Gestão dos profissionais médicos credenciados para solicitação e acompanhamento de exames."
        acoes={
          <>
            <Button
              variant="secondary"
              onClick={carregarMedicos}
              disabled={isLoading}
              leftIcon={
                <RefreshCw size={16} className={isLoading ? 'animate-spin' : ''} />
              }
            >
              Atualizar
            </Button>
            <Button onClick={handleNovo} leftIcon={<Plus size={16} />}>
              Novo Médico
            </Button>
          </>
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-space-md">
        <MetricCard
          titulo="Profissionais Ativos"
          valor={medicos.length}
          tom="primary"
          icone={<Stethoscope size={20} />}
          loading={isLoading}
          detalhe="Credenciados no corpo clínico"
        />
        <MetricCard
          titulo="Com CRM Informado"
          valor={medicosComCrm}
          tom="secondary"
          icone={<CheckCircle2 size={20} />}
          loading={isLoading}
          detalhe="Registro regional preenchido"
        />
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-space-md bg-surface-container-lowest p-space-md rounded-xl border border-outline-variant/40">
        <div className="w-full sm:max-w-sm">
          <Input
            placeholder="Buscar por nome ou CRM..."
            leftIcon={<Search size={16} />}
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setPage(1);
            }}
          />
        </div>
        <span className="text-body-sm text-outline">
          Total de registros:{' '}
          <strong className="font-data-mono text-on-surface">
            {filteredMedicos.length}
          </strong>
        </span>
      </div>

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
            data={paginatedMedicos}
            keyExtractor={(item) => item.id}
            emptyMessage="Nenhum médico cadastrado. Clique em 'Novo Médico' para adicionar ao corpo clínico."
          />

          <Pagination
            page={page}
            totalPages={totalPages}
            total={filteredMedicos.length}
            isLoading={isLoading}
            onPageChange={setPage}
            itemLabel="médicos"
          />
        </>
      )}

      {/* Modal Cadastro/Edição */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={isEditMode ? 'Editar Médico' : 'Novo Médico'}
      >
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-space-md">
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

          <div className="flex justify-end gap-space-sm pt-2">
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
              leftIcon={<Stethoscope size={16} />}
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
          <div className="flex flex-col gap-space-md text-left">
            <div>
              <span className="text-label-sm uppercase tracking-wider text-outline block">
                Nome
              </span>
              <strong className="text-body-lg text-on-surface">
                {selectedMedico.nome}
              </strong>
            </div>
            <div>
              <span className="text-label-sm uppercase tracking-wider text-outline block">
                Registro (CRM)
              </span>
              <span className="font-data-mono text-body-md text-on-surface">
                {formatarCrm(selectedMedico.crm)}
              </span>
            </div>
            <div>
              <span className="text-label-sm uppercase tracking-wider text-outline block mb-1">
                Status
              </span>
              {selectedMedico.ativo ? (
                <StatusBadge variant="conforme" label="Ativo" />
              ) : (
                <StatusBadge variant="neutro" label="Inativo" />
              )}
            </div>
            <div className="flex justify-end pt-2">
              <Button variant="secondary" onClick={() => setIsDetailsOpen(false)}>
                Fechar
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Modal Desativar */}
      <Modal
        isOpen={Boolean(medicoParaDesativar)}
        onClose={() => setMedicoParaDesativar(null)}
        title="Desativar Médico"
      >
        {medicoParaDesativar && (
          <div className="flex flex-col gap-space-md">
            <p className="text-body-md text-on-surface-variant">
              Deseja desativar o cadastro de{' '}
              <strong className="text-on-surface">{medicoParaDesativar.nome}</strong>?
              O histórico de atendimentos realizados será preservado.
            </p>
            <div className="flex justify-end gap-space-sm pt-2">
              <Button
                variant="secondary"
                onClick={() => setMedicoParaDesativar(null)}
                disabled={isDeactivating}
              >
                Cancelar
              </Button>
              <Button
                variant="danger"
                onClick={confirmarDesativacao}
                isLoading={isDeactivating}
                leftIcon={<Archive size={16} />}
              >
                Desativar
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

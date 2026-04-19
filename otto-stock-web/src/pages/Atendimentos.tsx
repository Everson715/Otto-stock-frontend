import { useEffect, useState } from "react"
import { api } from "../api/api"
import { Button } from "../components/ui/Button"
import { Table } from "../components/ui/Table"
import { Modal } from "../components/ui/Modal"
import { Select } from "../components/ui/Select"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { atendimentoSchema } from "../types/atendimento"
import type { AtendimentoFormData, Atendimento } from "../types/atendimento"
import { toast } from "sonner"
import { Plus, XCircle, CheckCircle } from "lucide-react"

export function Atendimentos() {
  const [atendimentos, setAtendimentos] = useState<Atendimento[]>([])
  const [medicos, setMedicos] = useState<{ id: number; nome: string }[]>([])
  const [exames, setExames] = useState<{ id: number; nome: string }[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isModalOpen, setIsModalOpen] = useState(false)

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<AtendimentoFormData>({
    resolver: zodResolver(atendimentoSchema)
  })

  async function carregar() {
    setIsLoading(true)
    try {
      const response = await api.get("/atendimentos")
      // A API retorna um objeto com { items, total, ... }
      setAtendimentos(response.data.items || [])
    } catch (error) {
      toast.error("Erro ao carregar atendimentos")
    } finally {
      setIsLoading(false)
    }
  }

  async function carregarDadosForm() {
    try {
      const [resMedicos, resExames] = await Promise.all([
        api.get("/medicos"),
        api.get("/exames")
      ])
      setMedicos(resMedicos.data)
      setExames(resExames.data)
    } catch (error) {
      toast.error("Erro ao carregar dados para o formulário")
    }
  }

  async function onSubmit(data: AtendimentoFormData) {
    try {
      await api.post("/atendimentos", {
        medicoId: Number(data.medicoId),
        exameId: Number(data.exameId)
      })
      toast.success("Atendimento registrado com sucesso")
      setIsModalOpen(false)
      reset()
      carregar()
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Erro ao registrar atendimento")
    }
  }

  async function handleFinalizar(id: number) {
    try {
      await api.patch(`/atendimentos/${id}/finalizar`)
      toast.success("Atendimento finalizado com sucesso")
      carregar()
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Erro ao finalizar atendimento")
    }
  }

  async function handleCancelar(id: number) {
    if (confirm("Deseja realmente cancelar este atendimento?")) {
      try {
        await api.patch(`/atendimentos/${id}/cancelar`)
        toast.success("Atendimento cancelado")
        carregar()
      } catch (error: any) {
        toast.error("Erro ao cancelar atendimento")
      }
    }
  }

  useEffect(() => {
    carregar()
    carregarDadosForm()
  }, [])

  const columns = [
    { header: "ID", accessor: "id" as keyof Atendimento },
    { header: "Médico", accessor: (a: Atendimento) => a.medico?.nome || "N/A" },
    { header: "Exame", accessor: (a: Atendimento) => a.exame?.nome || "N/A" },
    { 
      header: "Status", 
      accessor: (a: Atendimento) => (
        <span className={`status-badge status-${a.status.toLowerCase()}`}>
          {a.status}
        </span>
      ) 
    },
    {
      header: "Ações",
      accessor: (a: Atendimento) => (
        <div className="flex gap-2">
          {a.status === "PENDENTE" && (
            <>
              <Button variant="primary" onClick={() => handleFinalizar(a.id)} title="Finalizar">
                <CheckCircle className="size-4" />
              </Button>
              <Button variant="danger" onClick={() => handleCancelar(a.id)} title="Cancelar">
                <XCircle className="size-4" />
              </Button>
            </>
          )}
        </div>
      )
    }
  ]

  return (
    <div className="flex flex-col gap-4 p-4">
      <div className="flex justify-between items-center">
        <h2>Atendimentos</h2>
        <Button onClick={() => setIsModalOpen(true)} leftIcon={<Plus className="size-4" />}>
          Novo Atendimento
        </Button>
      </div>

      {isLoading ? (
        <p>Carregando atendimentos...</p>
      ) : (
        <Table columns={columns} data={atendimentos} keyExtractor={(a) => a.id} />
      )}

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Novo Atendimento">
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
          <Select 
            label="Médico"
            options={medicos.map(m => ({ label: m.nome, value: m.id }))}
            {...register("medicoId", { valueAsNumber: true })}
            error={errors.medicoId?.message}
          />
          <Select 
            label="Exame"
            options={exames.map(e => ({ label: e.nome, value: e.id }))}
            {...register("exameId", { valueAsNumber: true })}
            error={errors.exameId?.message}
          />
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="secondary" type="button" onClick={() => setIsModalOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" isLoading={isSubmitting}>
              Registrar
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
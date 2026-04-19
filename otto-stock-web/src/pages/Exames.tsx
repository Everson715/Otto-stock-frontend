import { useEffect, useState } from "react"
import { api } from "../api/api"
import { Button } from "../components/ui/Button"
import { Input } from "../components/ui/Input"
import { Table } from "../components/ui/Table"
import { Modal } from "../components/ui/Modal"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { exameSchema } from "../types/exame"
import type { ExameFormData, Exame } from "../types/exame"
import { toast } from "sonner"
import { Edit, Trash2, Eye, Plus } from "lucide-react"

export function Exames() {
  const [exames, setExames] = useState<Exame[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isEditMode, setIsEditMode] = useState(false)
  const [selectedExame, setSelectedExame] = useState<Exame | null>(null)
  const [isDetailsOpen, setIsDetailsOpen] = useState(false)

  const { register, handleSubmit, reset, setValue, formState: { errors, isSubmitting } } = useForm<ExameFormData>({
    resolver: zodResolver(exameSchema)
  })

  async function carregar() {
    setIsLoading(true)
    try {
      const response = await api.get("/exames")
      setExames(response.data)
    } catch (error) {
      toast.error("Erro ao carregar exames")
    } finally {
      setIsLoading(false)
    }
  }

  async function onSubmit(data: ExameFormData) {
    try {
      if (isEditMode && selectedExame) {
        await api.put(`/exames/${selectedExame.id}`, data)
        toast.success("Exame atualizado com sucesso")
      } else {
        await api.post("/exames", data)
        toast.success("Exame criado com sucesso")
      }
      setIsModalOpen(false)
      reset()
      carregar()
    } catch (error) {
      toast.error("Erro ao salvar exame")
    }
  }

  async function handleDeletar(id: number) {
    if (confirm("Tem certeza que deseja excluir este exame?")) {
      try {
        await api.delete(`/exames/${id}`)
        toast.success("Exame excluído com sucesso")
        carregar()
      } catch (error) {
        toast.error("Erro ao excluir exame")
      }
    }
  }

  function handleEditar(exame: Exame) {
    setIsEditMode(true)
    setSelectedExame(exame)
    setValue("nome", exame.nome)
    setIsModalOpen(true)
  }

  function handleVerDetalhes(exame: Exame) {
    setSelectedExame(exame)
    setIsDetailsOpen(true)
  }

  function handleNovo() {
    setIsEditMode(false)
    setSelectedExame(null)
    reset()
    setIsModalOpen(true)
  }

  useEffect(() => {
    carregar()
  }, [])

  const columns = [
    { header: "ID", accessor: "id" as keyof Exame },
    { header: "Nome", accessor: "nome" as keyof Exame },
    {
      header: "Ações",
      accessor: (exame: Exame) => (
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
      )
    }
  ]

  return (
    <div className="flex flex-col gap-4 p-4">
      <div className="flex justify-between items-center">
        <h2>Exames</h2>
        <Button onClick={handleNovo} leftIcon={<Plus className="size-4" />}>
          Novo Exame
        </Button>
      </div>

      {isLoading ? (
        <p>Carregando...</p>
      ) : (
        <Table columns={columns} data={exames} keyExtractor={(e) => e.id} />
      )}

      {/* Modal de Criação/Edição */}
      <Modal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        title={isEditMode ? "Editar Exame" : "Novo Exame"}
      >
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
          <Input 
            label="Nome do Exame"
            placeholder="Ex: Hemograma"
            {...register("nome")}
            error={errors.nome?.message}
          />
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="secondary" type="button" onClick={() => setIsModalOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" isLoading={isSubmitting}>
              {isEditMode ? "Atualizar" : "Salvar"}
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
          <div className="flex flex-col gap-2">
            <p><strong>ID:</strong> {selectedExame.id}</p>
            <p><strong>Nome:</strong> {selectedExame.nome}</p>
          </div>
        )}
        <div className="flex justify-end mt-4">
          <Button variant="secondary" onClick={() => setIsDetailsOpen(false)}>
            Fechar
          </Button>
        </div>
      </Modal>
    </div>
  )
}
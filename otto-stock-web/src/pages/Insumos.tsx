import { useEffect, useState } from "react"
import { api } from "../api/api"
import { Button } from "../components/ui/Button"
import { Input } from "../components/ui/Input"
import { Table } from "../components/ui/Table"
import { Modal } from "../components/ui/Modal"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { insumoSchema } from "../types/insumo"
import type { InsumoFormData, Insumo } from "../types/insumo"
import { toast } from "sonner"
import { Edit, Trash2, Eye, Plus } from "lucide-react"

export function Insumos() {
  const [insumos, setInsumos] = useState<Insumo[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isEditMode, setIsEditMode] = useState(false)
  const [selectedInsumo, setSelectedInsumo] = useState<Insumo | null>(null)
  const [isDetailsOpen, setIsDetailsOpen] = useState(false)

  const { register, handleSubmit, reset, setValue, formState: { errors, isSubmitting } } = useForm<InsumoFormData>({
    resolver: zodResolver(insumoSchema)
  })

  async function carregar() {
    setIsLoading(true)
    try {
      const response = await api.get("/insumos")
      setInsumos(response.data)
    } catch (error) {
      toast.error("Erro ao carregar insumos")
    } finally {
      setIsLoading(false)
    }
  }

  async function onSubmit(data: InsumoFormData) {
    try {
      if (isEditMode && selectedInsumo) {
        await api.put(`/insumos/${selectedInsumo.id}`, data)
        toast.success("Insumo atualizado com sucesso")
      } else {
        await api.post("/insumos", data)
        toast.success("Insumo criado com sucesso")
      }
      setIsModalOpen(false)
      reset()
      carregar()
    } catch (error) {
      toast.error("Erro ao salvar insumo")
    }
  }

  async function handleDeletar(id: number) {
    if (confirm("Tem certeza que deseja excluir este insumo?")) {
      try {
        await api.delete(`/insumos/${id}`)
        toast.success("Insumo excluído com sucesso")
        carregar()
      } catch (error) {
        toast.error("Erro ao excluir insumo")
      }
    }
  }

  function handleEditar(insumo: Insumo) {
    setIsEditMode(true)
    setSelectedInsumo(insumo)
    setValue("nome", insumo.nome)
    setIsModalOpen(true)
  }

  function handleVerDetalhes(insumo: Insumo) {
    setSelectedInsumo(insumo)
    setIsDetailsOpen(true)
  }

  function handleNovo() {
    setIsEditMode(false)
    setSelectedInsumo(null)
    reset()
    setIsModalOpen(true)
  }

  useEffect(() => {
    carregar()
  }, [])

  const columns = [
    { header: "ID", accessor: "id" as keyof Insumo },
    { header: "Nome", accessor: "nome" as keyof Insumo },
    {
      header: "Ações",
      accessor: (insumo: Insumo) => (
        <div className="flex gap-2">
          <Button variant="ghost" onClick={() => handleVerDetalhes(insumo)} title="Ver detalhes">
            <Eye className="size-4" />
          </Button>
          <Button variant="secondary" onClick={() => handleEditar(insumo)} title="Editar">
            <Edit className="size-4" />
          </Button>
          <Button variant="danger" onClick={() => handleDeletar(insumo.id)} title="Excluir">
            <Trash2 className="size-4" />
          </Button>
        </div>
      )
    }
  ]

  return (
    <div className="flex flex-col gap-4 p-4">
      <div className="flex justify-between items-center">
        <h2>Insumos</h2>
        <Button onClick={handleNovo} leftIcon={<Plus className="size-4" />}>
          Novo Insumo
        </Button>
      </div>

      {isLoading ? (
        <p>Carregando...</p>
      ) : (
        <Table columns={columns} data={insumos} keyExtractor={(i) => i.id} />
      )}

      {/* Modal de Criação/Edição */}
      <Modal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        title={isEditMode ? "Editar Insumo" : "Novo Insumo"}
      >
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
          <Input 
            label="Nome do Insumo"
            placeholder="Ex: Luvas descartáveis"
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
        title="Detalhes do Insumo"
      >
        {selectedInsumo && (
          <div className="flex flex-col gap-2">
            <p><strong>ID:</strong> {selectedInsumo.id}</p>
            <p><strong>Nome:</strong> {selectedInsumo.nome}</p>
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
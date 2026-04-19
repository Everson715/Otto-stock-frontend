import { useEffect, useState } from "react"
import { api } from "../api/api"
import { Button } from "../components/ui/Button"
import { Input } from "../components/ui/Input"
import { Select } from "../components/ui/Select"
import { toast } from "sonner"
import { ArrowUpCircle, ArrowDownCircle } from "lucide-react"

export function Estoque() {
  const [insumos, setInsumos] = useState<{ id: number; nome: string }[]>([])
  const [insumoId, setInsumoId] = useState("")
  const [quantidade, setQuantidade] = useState("")
  const [isPending, setIsPending] = useState(false)

  async function carregarInsumos() {
    try {
      const res = await api.get("/insumos")
      setInsumos(res.data)
    } catch (error) {
      toast.error("Erro ao carregar insumos")
    }
  }

  async function handleMovimentacao(tipo: "entrada" | "saida") {
    if (!insumoId || !quantidade) {
      toast.warning("Preencha todos os campos")
      return
    }

    setIsPending(true)
    try {
      await api.post(`/estoque/${tipo}`, {
        insumoId: Number(insumoId),
        quantidade: Number(quantidade)
      })
      toast.success(`Movimentação de ${tipo} realizada com sucesso`)
      setInsumoId("")
      setQuantidade("")
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Erro ao processar movimentação")
    } finally {
      setIsPending(false)
    }
  }

  useEffect(() => {
    carregarInsumos()
  }, [])

  return (
    <div className="flex flex-col items-center justify-center p-8 gap-6 max-w-md mx-auto">
      <div className="text-center">
        <h2>Movimentação de Estoque</h2>
        <p className="text-gray-700">Registre entradas ou saídas manuais de insumos.</p>
      </div>

      <div className="flex flex-col gap-4 w-full bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <Select 
          label="Insumo"
          options={insumos.map(i => ({ label: i.nome, value: i.id }))}
          value={insumoId}
          onChange={(e) => setInsumoId(e.target.value)}
        />

        <Input 
          label="Quantidade"
          type="number"
          placeholder="0"
          value={quantidade}
          onChange={(e) => setQuantidade(e.target.value)}
        />

        <div className="flex gap-4 mt-2">
          <Button 
            className="w-full" 
            onClick={() => handleMovimentacao("entrada")}
            isLoading={isPending}
            leftIcon={<ArrowUpCircle size={18} />}
          >
            Entrada
          </Button>
          <Button 
            variant="secondary" 
            className="w-full" 
            onClick={() => handleMovimentacao("saida")}
            isLoading={isPending}
            leftIcon={<ArrowDownCircle size={18} />}
          >
            Saída
          </Button>
        </div>
      </div>
    </div>
  )
}
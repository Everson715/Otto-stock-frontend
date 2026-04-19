import { useEffect, useState } from "react"
import { api } from "../api/api"
import { Table } from "../components/ui/Table"
import { toast } from "sonner"
import { ArrowUpCircle, ArrowDownCircle } from "lucide-react"

interface Movimentacao {
  id: number
  tipo: "ENTRADA" | "SAIDA"
  quantidade: number
  createdAt: string
  insumo: {
    nome: string
  }
}

export function Movimentacoes() {
  const [movimentacoes, setMovimentacoes] = useState<Movimentacao[]>([])
  const [isLoading, setIsLoading] = useState(false)

  async function carregar() {
    setIsLoading(true)
    try {
      const response = await api.get("/estoque/movimentacoes")
      setMovimentacoes(response.data)
    } catch (error) {
      toast.error("Erro ao carregar histórico de movimentações")
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    carregar()
  }, [])

  const columns = [
    { header: "Data", accessor: (m: Movimentacao) => new Date(m.createdAt).toLocaleString() },
    { header: "Insumo", accessor: (m: Movimentacao) => m.insumo.nome },
    { 
      header: "Tipo", 
      accessor: (m: Movimentacao) => (
        <div className="flex items-center gap-1">
          {m.tipo === "ENTRADA" ? (
            <>
              <ArrowUpCircle className="size-4 text-green-500" />
              <span className="text-green-500 font-medium">Entrada</span>
            </>
          ) : (
            <>
              <ArrowDownCircle className="size-4 text-red-500" />
              <span className="text-red-500 font-medium">Saída</span>
            </>
          )}
        </div>
      )
    },
    { header: "Quantidade", accessor: "quantidade" as keyof Movimentacao },
  ]

  return (
    <div className="flex flex-col gap-4 p-4">
      <h2>Extrato de Estoque</h2>
      
      {isLoading ? (
        <p>Carregando histórico...</p>
      ) : (
        <Table columns={columns} data={movimentacoes} keyExtractor={(m) => m.id} />
      )}
    </div>
  )
}

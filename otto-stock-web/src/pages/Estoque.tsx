import { useState } from "react"
import { api } from "../api/api"

export function Estoque() {

  const [insumoId, setInsumoId] = useState("")
  const [quantidade, setQuantidade] = useState("")

  async function entrada() {
    await api.post("/estoque/entrada", {
      insumoId: Number(insumoId),
      quantidade: Number(quantidade)
    })
  }

  async function saida() {
    await api.post("/estoque/saida", {
      insumoId: Number(insumoId),
      quantidade: Number(quantidade)
    })
  }

  return (
    <div>

      <h2>Movimentação de estoque</h2>

      <input
        placeholder="ID insumo"
        onChange={(e)=>setInsumoId(e.target.value)}
      />

      <input
        placeholder="Quantidade"
        onChange={(e)=>setQuantidade(e.target.value)}
      />

      <button onClick={entrada}>
        Entrada
      </button>

      <button onClick={saida}>
        Saída
      </button>

    </div>
  )
}
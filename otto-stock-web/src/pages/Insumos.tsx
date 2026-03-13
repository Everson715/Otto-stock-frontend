import { useEffect, useState } from "react"
import { api } from "../api/api";

export function Insumos() {

  const [insumos, setInsumos] = useState([])
  const [nome, setNome] = useState("")

  async function carregar() {
    const response = await api.get("/insumos")
    setInsumos(response.data)
  }

  async function criar() {
    await api.post("/insumos", { nome })
    setNome("")
    carregar()
  }

  useEffect(() => {
    carregar()
  }, [])

  return (
    <div>

      <h2>Insumos</h2>

      <input
        value={nome}
        onChange={(e) => setNome(e.target.value)}
        placeholder="Nome do insumo"
      />

      <button onClick={criar}>
        Criar
      </button>

      <ul>
        {insumos.map((i: any) => (
          <li key={i.id}>{i.nome}</li>
        ))}
      </ul>

    </div>
  )
}
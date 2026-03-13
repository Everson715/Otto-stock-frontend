import { useEffect, useState } from "react"
import { api } from "../api/api"

export function Exames() {

  const [exames, setExames] = useState([])
  const [nome, setNome] = useState("")

  async function carregar() {
    const res = await api.get("/exames")
    setExames(res.data)
  }

  async function criar() {
    await api.post("/exames", { nome })
    setNome("")
    carregar()
  }

  useEffect(() => {
    carregar()
  }, [])

  return (
    <div>

      <h2>Exames</h2>

      <input
        value={nome}
        onChange={(e) => setNome(e.target.value)}
      />

      <button onClick={criar}>
        Criar exame
      </button>

      <ul>
        {exames.map((e: any) => (
          <li key={e.id}>{e.nome}</li>
        ))}
      </ul>

    </div>
  )
}
import { useEffect, useState } from "react"
import { api } from "../api/api"

export function Atendimentos() {

  const [atendimentos, setAtendimentos] = useState([])

  async function carregar() {
    const res = await api.get("/atendimentos")
    setAtendimentos(res.data)
  }

  async function finalizar(id: number) {
    await api.patch(`/atendimentos/${id}/finalizar`)
    carregar()
  }

  useEffect(()=>{
    carregar()
  },[])

  return (
    <div>

      <h2>Atendimentos</h2>

      <ul>
        {atendimentos.map((a:any)=>(
          <li key={a.id}>
            Exame: {a.exame.nome} |
            Status: {a.status}

            <button onClick={()=>finalizar(a.id)}>
              Finalizar
            </button>

          </li>
        ))}
      </ul>

    </div>
  )
}
import { Link } from "react-router-dom"

export function Navbar() {
  return (
    <nav style={{ display: "flex", gap: "20px", padding: "10px", background: "#eee" }}>
      <Link to="/">Home</Link>
      <Link to="/insumos">Insumos</Link>
      <Link to="/exames">Exames</Link>
      <Link to="/estoque">Estoque</Link>
      <Link to="/atendimentos">Atendimentos</Link>
    </nav>
  )
}
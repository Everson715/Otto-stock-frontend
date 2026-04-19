import { Link, useLocation } from "react-router-dom"
import './Navbar.css'
import { LayoutDashboard, Beaker, ClipboardList, Box, History, Users } from 'lucide-react'

export function Navbar() {
  const location = useLocation()

  const links = [
    { to: "/", label: "Home", icon: <LayoutDashboard size={18} /> },
    { to: "/insumos", label: "Insumos", icon: <Beaker size={18} /> },
    { to: "/exames", label: "Exames", icon: <ClipboardList size={18} /> },
    { to: "/estoque", label: "Movimentar", icon: <Box size={18} /> },
    { to: "/estoque/movimentacoes", label: "Extrato", icon: <History size={18} /> },
    { to: "/atendimentos", label: "Atendimentos", icon: <Users size={18} /> },
  ]

  return (
    <nav className="navbar">
      <div className="navbar-logo">
        <strong>Otto</strong>Stock
      </div>
      <div className="navbar-links">
        {links.map((link) => (
          <Link 
            key={link.to} 
            to={link.to} 
            className={`navbar-link ${location.pathname === link.to ? 'active' : ''}`}
          >
            {link.icon}
            {link.label}
          </Link>
        ))}
      </div>
    </nav>
  )
}
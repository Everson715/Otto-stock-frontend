import { BrowserRouter, Routes, Route } from "react-router-dom"
import { Toaster } from 'sonner'

import { Navbar } from "./components/Navbar"

import { Home } from "./pages/Home"
import { Insumos } from "./pages/Insumos"
import { Exames } from "./pages/Exames"
import { Estoque } from "./pages/Estoque"
import { Atendimentos } from "./pages/Atendimentos"
import { Movimentacoes } from "./pages/Movimentacoes"

export default function App() {

  return (
    <BrowserRouter>
      <Toaster richColors position="top-right" />
      <Navbar />

      <Routes>

        <Route path="/" element={<Home />} />
        <Route path="/insumos" element={<Insumos />} />
        <Route path="/exames" element={<Exames />} />
        <Route path="/estoque" element={<Estoque />} />
        <Route path="/estoque/movimentacoes" element={<Movimentacoes />} />
        <Route path="/atendimentos" element={<Atendimentos />} />

      </Routes>

    </BrowserRouter>
  )
}
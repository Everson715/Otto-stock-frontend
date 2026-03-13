import { BrowserRouter, Routes, Route } from "react-router-dom"

import { Navbar } from "./components/Navbar"

import { Home } from "./pages/Home"
import { Insumos } from "./pages/Insumos"
import { Exames } from "./pages/Exames"
import { Estoque } from "./pages/Estoque"
import { Atendimentos } from "./pages/Atendimentos"

export default function App() {

  return (
    <BrowserRouter>

      <Navbar />

      <Routes>

        <Route path="/" element={<Home />} />
        <Route path="/insumos" element={<Insumos />} />
        <Route path="/exames" element={<Exames />} />
        <Route path="/estoque" element={<Estoque />} />
        <Route path="/atendimentos" element={<Atendimentos />} />

      </Routes>

    </BrowserRouter>
  )
}
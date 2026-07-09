import { Routes, Route } from 'react-router-dom'
import { Layout } from './components/layout/Layout'
import { ProtectedRoute } from './components/ProtectedRoute'
import { Login } from './pages/Login'
import { Dashboard } from './pages/Dashboard'
import { Financeiro } from './pages/Financeiro'
import { Investimentos } from './pages/Investimentos'
import { Tarefas } from './pages/Tarefas'
import { Habitos } from './pages/Habitos'
import { Notas } from './pages/Notas'
import { Metas } from './pages/Metas'
import { Relatorios } from './pages/Relatorios'

export default function App() {
  return (
    <Routes>
      <Route path="login" element={<Login />} />
      <Route element={<ProtectedRoute />}>
        <Route element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="financeiro" element={<Financeiro />} />
          <Route path="investimentos" element={<Investimentos />} />
          <Route path="tarefas" element={<Tarefas />} />
          <Route path="habitos" element={<Habitos />} />
          <Route path="notas" element={<Notas />} />
          <Route path="metas" element={<Metas />} />
          <Route path="relatorios" element={<Relatorios />} />
        </Route>
      </Route>
    </Routes>
  )
}

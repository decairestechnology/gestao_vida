import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, Pin } from 'lucide-react'
import { PageHeader } from '../components/layout/PageHeader'
import { Button } from '../components/ui/Button'
import { notas as notasIniciais } from '../data/mockData'

export function Notas() {
  const navigate = useNavigate()
  const [notas, setNotas] = useState(notasIniciais)
  const [busca, setBusca] = useState('')
  const [filtro, setFiltro] = useState('Todas')

  const togglePin = (id: number) =>
    setNotas((prev) => prev.map((n) => (n.id === id ? { ...n, pinned: !n.pinned } : n)))

  const visiveis = notas
    .filter((n) => (n.titulo + n.corpo).toLowerCase().includes(busca.toLowerCase()))
    .filter((n) => (filtro === 'Todas' ? true : filtro === 'Fixadas' ? n.pinned : n.tag === filtro.toLowerCase()))
    .sort((a, b) => Number(b.pinned) - Number(a.pinned))

  return (
    <div>
      <PageHeader
        eyebrow="Módulo"
        title="Notas"
        subtitle="Ideias e lembretes soltos, capturados rápido."
        action={<Button variant="gradient">+ Nova nota</Button>}
      />

      <div className="flex gap-2 flex-wrap items-center mb-4">
        <div className="flex items-center gap-2 bg-muted border border-border rounded-lg px-3 py-2 flex-1 min-w-[160px]">
          <Search size={14} className="text-muted-foreground" />
          <input
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Buscar nota..."
            className="bg-transparent outline-none text-[13px] flex-1"
          />
        </div>
        {['Todas', 'Fixadas', 'Financeiro', 'Pessoal'].map((f) => (
          <button
            key={f}
            onClick={() => setFiltro(f)}
            className={`text-[11.5px] font-semibold px-3 py-1.5 rounded-full border transition-colors ${
              filtro === f ? 'bg-accent text-primary border-primary' : 'bg-muted text-muted-foreground border-border'
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-3 gap-3.5">
        {visiveis.map((n) => (
          <div
            key={n.id}
            className="border rounded-xl p-3.5 min-h-[110px] shadow-sm flex flex-col"
            style={{
              background: n.pinned ? 'var(--accent)' : 'var(--card)',
              borderColor: 'var(--border)',
              borderLeft: '3px solid var(--secondary)',
            }}
          >
            <div className="flex justify-between items-start gap-2 mb-1.5">
              <div className="text-[13px] font-bold">{n.titulo}</div>
              <button onClick={() => togglePin(n.id)} className="flex-shrink-0">
                <Pin
                  size={14}
                  className={n.pinned ? 'text-primary fill-primary' : 'text-muted-foreground'}
                />
              </button>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed flex-1">{n.corpo}</p>
            <div className="flex justify-between items-center mt-2.5">
              <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                {n.tag}
              </span>
              <div className="text-[10.5px] text-muted-foreground font-semibold">{n.data}</div>
            </div>
            <button
              onClick={() => navigate('/tarefas')}
              className="mt-2.5 text-left text-[11px] font-bold text-primary"
            >
              → transformar em tarefa
            </button>
          </div>
        ))}
        {visiveis.length === 0 && (
          <div className="text-sm text-muted-foreground py-6 col-span-3 text-center">Nenhuma nota encontrada.</div>
        )}
      </div>
    </div>
  )
}

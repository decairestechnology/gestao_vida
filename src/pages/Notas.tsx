import { useEffect, useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, Pin, Pencil, Trash2 } from 'lucide-react'
import { PageHeader } from '../components/layout/PageHeader'
import { Button } from '../components/ui/Button'
import { Modal } from '../components/ui/Modal'
import { DeleteConfirmBar } from '../components/ui/DeleteConfirmBar'
import { apiGet, apiPost, apiPatch, apiDelete } from '../lib/api'

interface Nota {
  id: string
  titulo: string
  corpo: string
  tag: string | null
  pinned: boolean
  created_at: string
}

const CAMPOS_VAZIOS = { titulo: '', corpo: '', tag: '' }

export function Notas() {
  const navigate = useNavigate()
  const [notas, setNotas] = useState<Nota[]>([])
  const [carregando, setCarregando] = useState(true)
  const [busca, setBusca] = useState('')
  const [filtro, setFiltro] = useState('Todas')

  const [modalAberto, setModalAberto] = useState(false)
  const [editando, setEditando] = useState<Nota | null>(null)
  const [form, setForm] = useState(CAMPOS_VAZIOS)
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)
  const [confirmandoExclusao, setConfirmandoExclusao] = useState<string | null>(null)

  async function carregar() {
    setCarregando(true)
    try {
      const rows = await apiGet<Nota[]>('/api/notas')
      setNotas(rows)
    } catch {
      setNotas([])
    } finally {
      setCarregando(false)
    }
  }

  useEffect(() => {
    carregar()
  }, [])

  function abrirCriar() {
    setEditando(null)
    setForm(CAMPOS_VAZIOS)
    setErro(null)
    setModalAberto(true)
  }

  function abrirEditar(n: Nota) {
    setEditando(n)
    setForm({ titulo: n.titulo, corpo: n.corpo, tag: n.tag ?? '' })
    setErro(null)
    setModalAberto(true)
  }

  async function salvar(e: FormEvent) {
    e.preventDefault()
    setSalvando(true)
    setErro(null)
    try {
      const payload = { titulo: form.titulo, corpo: form.corpo, tag: form.tag || null }
      if (editando) {
        await apiPatch('/api/notas', { id: editando.id, ...payload })
      } else {
        await apiPost('/api/notas', payload)
      }
      setModalAberto(false)
      await carregar()
    } catch (err) {
      setErro(err instanceof Error ? err.message : 'Não foi possível salvar.')
    } finally {
      setSalvando(false)
    }
  }

  async function excluir(id: string) {
    await apiDelete('/api/notas', { id })
    setConfirmandoExclusao(null)
    await carregar()
  }

  async function alternarPin(n: Nota) {
    await apiPatch('/api/notas', { id: n.id, pinned: !n.pinned })
    await carregar()
  }

  const visiveis = notas
    .filter((n) => (n.titulo + n.corpo).toLowerCase().includes(busca.toLowerCase()))
    .filter((n) => (filtro === 'Todas' ? true : filtro === 'Fixadas' ? n.pinned : n.tag?.toLowerCase() === filtro.toLowerCase()))

  return (
    <div>
      <PageHeader
        eyebrow="Módulo"
        title="Notas"
        subtitle="Ideias e lembretes soltos, capturados rápido."
        action={<Button variant="gradient" onClick={abrirCriar}>+ Nova nota</Button>}
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
        {['Todas', 'Fixadas'].map((f) => (
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

      {carregando && <div className="text-sm text-muted-foreground py-4">Carregando...</div>}

      <div className="grid grid-cols-3 gap-3.5">
        {!carregando && visiveis.length === 0 && (
          <div className="text-sm text-muted-foreground py-6 col-span-3 text-center">Nenhuma nota encontrada.</div>
        )}
        {visiveis.map((n) => (
          <div
            key={n.id}
            className="border rounded-xl p-3.5 min-h-[110px] shadow-sm flex flex-col group"
            style={{
              background: n.pinned ? 'var(--accent)' : 'var(--card)',
              borderColor: 'var(--border)',
              borderLeft: '3px solid var(--secondary)',
            }}
          >
            <div className="flex justify-between items-start gap-2 mb-1.5">
              <div className="text-[13px] font-bold">{n.titulo}</div>
              <div className="flex items-center gap-1.5 flex-shrink-0">
                <button onClick={() => alternarPin(n)}>
                  <Pin size={14} className={n.pinned ? 'text-primary fill-primary' : 'text-muted-foreground'} />
                </button>
                <button onClick={() => abrirEditar(n)} className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-primary">
                  <Pencil size={13} />
                </button>
                <button onClick={() => setConfirmandoExclusao(n.id)} className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive">
                  <Trash2 size={13} />
                </button>
              </div>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed flex-1">{n.corpo}</p>
            {confirmandoExclusao === n.id && (
              <DeleteConfirmBar label="Excluir nota?" onCancel={() => setConfirmandoExclusao(null)} onConfirm={() => excluir(n.id)} />
            )}
            <div className="flex justify-between items-center mt-2.5">
              {n.tag && (
                <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-muted text-muted-foreground">{n.tag}</span>
              )}
              <div className="text-[10.5px] text-muted-foreground font-semibold ml-auto">
                {new Date(n.created_at).toLocaleDateString('pt-BR')}
              </div>
            </div>
            <button onClick={() => navigate('/tarefas')} className="mt-2.5 text-left text-[11px] font-bold text-primary">
              → transformar em tarefa
            </button>
          </div>
        ))}
      </div>

      <Modal open={modalAberto} title={editando ? 'Editar nota' : 'Nova nota'} onClose={() => setModalAberto(false)}>
        <form onSubmit={salvar} className="flex flex-col gap-3">
          <input
            required
            placeholder="Título"
            value={form.titulo}
            onChange={(e) => setForm({ ...form, titulo: e.target.value })}
            className="bg-muted border border-border rounded-lg px-3 py-2.5 text-sm outline-none focus:border-primary"
          />
          <textarea
            required
            placeholder="Conteúdo"
            value={form.corpo}
            onChange={(e) => setForm({ ...form, corpo: e.target.value })}
            rows={4}
            className="bg-muted border border-border rounded-lg px-3 py-2.5 text-sm outline-none focus:border-primary resize-none"
          />
          <input
            placeholder="Tag (opcional, ex: financeiro)"
            value={form.tag}
            onChange={(e) => setForm({ ...form, tag: e.target.value })}
            className="bg-muted border border-border rounded-lg px-3 py-2.5 text-sm outline-none focus:border-primary"
          />
          {erro && <div className="text-xs text-destructive font-semibold break-words">{erro}</div>}
          <Button type="submit" disabled={salvando}>
            {salvando ? 'Salvando...' : editando ? 'Salvar alterações' : 'Criar nota'}
          </Button>
        </form>
      </Modal>
    </div>
  )
}

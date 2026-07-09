import { useEffect, useState, type FormEvent } from 'react'
import { Pencil, Trash2, Check } from 'lucide-react'
import { PageHeader } from '../components/layout/PageHeader'
import { Card, CardTitle } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Badge } from '../components/ui/Badge'
import { ProgressBar } from '../components/ui/ProgressBar'
import { Modal } from '../components/ui/Modal'
import { DeleteConfirmBar } from '../components/ui/DeleteConfirmBar'
import { apiGet, apiPost, apiPatch, apiDelete } from '../lib/api'

interface Meta {
  id: string
  nome: string
  valor_atual: string | number
  valor_alvo: string | number
  prazo: string | null
  concluida: boolean
  ativo_nome: string | null
}

const CAMPOS_VAZIOS = { nome: '', valor_atual: '0', valor_alvo: '', prazo: '' }
const CORES = ['var(--primary)', 'var(--secondary)', '#F59E0B', '#10B981', 'var(--destructive)']

export function Metas() {
  const [metas, setMetas] = useState<Meta[]>([])
  const [carregando, setCarregando] = useState(true)
  const [modalAberto, setModalAberto] = useState(false)
  const [editando, setEditando] = useState<Meta | null>(null)
  const [form, setForm] = useState(CAMPOS_VAZIOS)
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)
  const [confirmandoExclusao, setConfirmandoExclusao] = useState<string | null>(null)

  async function carregar() {
    setCarregando(true)
    try {
      const rows = await apiGet<Meta[]>('/api/metas')
      setMetas(rows)
    } catch {
      setMetas([])
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

  function abrirEditar(m: Meta) {
    setEditando(m)
    setForm({ nome: m.nome, valor_atual: String(m.valor_atual), valor_alvo: String(m.valor_alvo), prazo: m.prazo?.slice(0, 10) ?? '' })
    setErro(null)
    setModalAberto(true)
  }

  async function salvar(e: FormEvent) {
    e.preventDefault()
    setSalvando(true)
    setErro(null)
    try {
      const payload = {
        nome: form.nome,
        valor_atual: Number(form.valor_atual),
        valor_alvo: Number(form.valor_alvo),
        prazo: form.prazo || null,
      }
      if (editando) {
        await apiPatch('/api/metas', { id: editando.id, ...payload })
      } else {
        await apiPost('/api/metas', payload)
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
    await apiDelete('/api/metas', { id })
    setConfirmandoExclusao(null)
    await carregar()
  }

  async function marcarConcluida(m: Meta) {
    await apiPatch('/api/metas', { id: m.id, concluida: true })
    await carregar()
  }

  return (
    <div>
      <PageHeader
        eyebrow="Módulo"
        title="Metas"
        subtitle="Onde você quer chegar, e o quanto falta."
        action={<Button variant="gradient" onClick={abrirCriar}>+ Nova meta</Button>}
      />

      <div className="grid grid-cols-3 gap-4">
        {carregando && <div className="text-sm text-muted-foreground py-4 col-span-3 text-center">Carregando...</div>}
        {!carregando && metas.length === 0 && (
          <div className="text-sm text-muted-foreground py-4 col-span-3 text-center">Nenhuma meta cadastrada ainda.</div>
        )}
        {metas.map((m, i) => {
          const atual = Number(m.valor_atual)
          const alvo = Number(m.valor_alvo)
          const ritmo = m.prazo && !m.concluida
            ? Math.max(0, Math.ceil((alvo - atual) / Math.max(1, Math.ceil((new Date(m.prazo).getTime() - Date.now()) / (30 * 86400000)))))
            : null
          return (
            <Card key={m.id} className={`group ${m.concluida ? 'opacity-85' : ''}`}>
              <div className="flex justify-between items-start">
                <CardTitle>{m.nome}</CardTitle>
                <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 flex-shrink-0">
                  <button onClick={() => abrirEditar(m)} className="text-muted-foreground hover:text-primary"><Pencil size={13} /></button>
                  <button onClick={() => setConfirmandoExclusao(m.id)} className="text-muted-foreground hover:text-destructive"><Trash2 size={13} /></button>
                </div>
              </div>
              <div className="text-2xl font-extrabold">R$ {atual.toLocaleString('pt-BR')}</div>
              <div className="text-[11.5px] text-muted-foreground mt-1 mb-2.5">
                {m.concluida ? 'meta concluída' : m.prazo ? `meta: R$ ${alvo.toLocaleString('pt-BR')} até ${new Date(m.prazo).toLocaleDateString('pt-BR')}` : `meta: R$ ${alvo.toLocaleString('pt-BR')}`}
              </div>
              <ProgressBar percent={(atual / alvo) * 100} color={m.concluida ? '#10B981' : CORES[i % CORES.length]} />
              <div className="flex justify-between items-center mt-3 flex-wrap gap-1.5">
                {m.concluida ? (
                  <Badge variant="success">concluída ✓</Badge>
                ) : m.ativo_nome ? (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-accent text-primary">{m.ativo_nome}</span>
                ) : (
                  <Badge variant="neutral">sem vínculo</Badge>
                )}
                {!m.concluida && ritmo !== null && ritmo > 0 && (
                  <span className="text-[11px] font-semibold text-muted-foreground">ritmo: R$ {ritmo}/mês</span>
                )}
                {!m.concluida && atual >= alvo && (
                  <button onClick={() => marcarConcluida(m)} className="flex items-center gap-1 text-[11px] font-bold text-[#10B981]">
                    <Check size={12} /> marcar concluída
                  </button>
                )}
              </div>
              {confirmandoExclusao === m.id && (
                <div className="mt-2">
                  <DeleteConfirmBar label={`Excluir "${m.nome}"?`} onCancel={() => setConfirmandoExclusao(null)} onConfirm={() => excluir(m.id)} />
                </div>
              )}
            </Card>
          )
        })}
      </div>

      <Modal open={modalAberto} title={editando ? 'Editar meta' : 'Nova meta'} onClose={() => setModalAberto(false)}>
        <form onSubmit={salvar} className="flex flex-col gap-3">
          <input
            required
            placeholder="Nome (ex: Reserva de emergência)"
            value={form.nome}
            onChange={(e) => setForm({ ...form, nome: e.target.value })}
            className="bg-muted border border-border rounded-lg px-3 py-2.5 text-sm outline-none focus:border-primary"
          />
          <input
            required
            type="number"
            step="0.01"
            placeholder="Valor já guardado"
            value={form.valor_atual}
            onChange={(e) => setForm({ ...form, valor_atual: e.target.value })}
            className="bg-muted border border-border rounded-lg px-3 py-2.5 text-sm outline-none focus:border-primary"
          />
          <input
            required
            type="number"
            step="0.01"
            placeholder="Valor alvo"
            value={form.valor_alvo}
            onChange={(e) => setForm({ ...form, valor_alvo: e.target.value })}
            className="bg-muted border border-border rounded-lg px-3 py-2.5 text-sm outline-none focus:border-primary"
          />
          <input
            type="date"
            value={form.prazo}
            onChange={(e) => setForm({ ...form, prazo: e.target.value })}
            className="bg-muted border border-border rounded-lg px-3 py-2.5 text-sm outline-none focus:border-primary"
          />
          {erro && <div className="text-xs text-destructive font-semibold break-words">{erro}</div>}
          <Button type="submit" disabled={salvando}>
            {salvando ? 'Salvando...' : editando ? 'Salvar alterações' : 'Criar meta'}
          </Button>
        </form>
      </Modal>
    </div>
  )
}

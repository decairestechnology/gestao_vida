import { useEffect, useState, type FormEvent } from 'react'
import { ChevronDown, Repeat, Pencil, Trash2, Plus, X } from 'lucide-react'
import { PageHeader } from '../components/layout/PageHeader'
import { Card } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Badge } from '../components/ui/Badge'
import { Modal } from '../components/ui/Modal'
import { DeleteConfirmBar } from '../components/ui/DeleteConfirmBar'
import { apiGet, apiPost, apiPatch, apiDelete } from '../lib/api'
import { hojeBrasilia, deslocarDias, formatarDataBR } from '../lib/date'

interface Tarefa {
  id: string
  titulo: string
  status: 'pendente' | 'concluida'
  prioridade: 'alta' | 'media' | 'baixa'
  tag: string | null
  vencimento: string | null
  recorrente: boolean
  parent_id: string | null
}

const TABS = [
  { id: 'hoje', label: 'Hoje' },
  { id: 'semana', label: 'Essa semana' },
  { id: 'semprazo', label: 'Sem prazo' },
  { id: 'concluida', label: 'Concluídas' },
]

const PRIORIDADE_BADGE = { alta: 'error', media: 'warning', baixa: 'neutral' } as const

const CAMPOS_VAZIOS = { titulo: '', tag: '', vencimento: '', prioridade: 'media' as Tarefa['prioridade'], recorrente: false, intervalo: '30' }

function calcularAba(t: Tarefa): string {
  if (t.status === 'concluida') return 'concluida'
  if (!t.vencimento) return 'semprazo'
  const hoje = hojeBrasilia()
  const emSeteDias = deslocarDias(hoje, 7)
  const venc = t.vencimento.slice(0, 10)
  if (venc <= hoje) return 'hoje'
  if (venc <= emSeteDias) return 'semana'
  return 'semprazo'
}

export function Tarefas() {
  const [tarefas, setTarefas] = useState<Tarefa[]>([])
  const [carregando, setCarregando] = useState(true)
  const [tab, setTab] = useState('hoje')
  const [expandida, setExpandida] = useState<string | null>(null)

  const [modalAberto, setModalAberto] = useState(false)
  const [editando, setEditando] = useState<Tarefa | null>(null)
  const [form, setForm] = useState(CAMPOS_VAZIOS)
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)
  const [confirmandoExclusao, setConfirmandoExclusao] = useState<string | null>(null)

  const [novaSubtarefa, setNovaSubtarefa] = useState('')

  async function carregar() {
    setCarregando(true)
    try {
      const rows = await apiGet<Tarefa[]>('/api/tarefas')
      setTarefas(rows)
    } catch {
      setTarefas([])
    } finally {
      setCarregando(false)
    }
  }

  useEffect(() => {
    carregar()
  }, [])

  const principais = tarefas.filter((t) => !t.parent_id)
  const visiveis = principais.filter((t) => calcularAba(t) === tab)
  const subtarefasDe = (id: string) => tarefas.filter((t) => t.parent_id === id)

  function abrirCriar() {
    setEditando(null)
    setForm(CAMPOS_VAZIOS)
    setErro(null)
    setModalAberto(true)
  }

  function abrirEditar(t: Tarefa) {
    setEditando(t)
    setForm({
      titulo: t.titulo,
      tag: t.tag ?? '',
      vencimento: t.vencimento?.slice(0, 10) ?? '',
      prioridade: t.prioridade,
      recorrente: t.recorrente,
      intervalo: '30',
    })
    setErro(null)
    setModalAberto(true)
  }

  async function salvar(e: FormEvent) {
    e.preventDefault()
    setSalvando(true)
    setErro(null)
    try {
      const payload = {
        titulo: form.titulo,
        tag: form.tag || null,
        vencimento: form.vencimento || null,
        prioridade: form.prioridade,
        recorrente: form.recorrente,
        recorrencia_intervalo_dias: form.recorrente ? Number(form.intervalo) : null,
      }
      if (editando) {
        await apiPatch('/api/tarefas', { id: editando.id, ...payload })
      } else {
        await apiPost('/api/tarefas', payload)
      }
      setModalAberto(false)
      await carregar()
    } catch (err) {
      setErro(err instanceof Error ? err.message : 'Não foi possível salvar.')
    } finally {
      setSalvando(false)
    }
  }

  async function alternarConcluida(t: Tarefa) {
    await apiPatch('/api/tarefas', { id: t.id, status: t.status === 'concluida' ? 'pendente' : 'concluida' })
    await carregar()
  }

  async function excluir(id: string) {
    await apiDelete('/api/tarefas', { id })
    setConfirmandoExclusao(null)
    await carregar()
  }

  async function adicionarSubtarefa(parentId: string) {
    if (!novaSubtarefa.trim()) return
    await apiPost('/api/tarefas', { titulo: novaSubtarefa, parent_id: parentId, prioridade: 'media' })
    setNovaSubtarefa('')
    await carregar()
  }

  return (
    <div>
      <PageHeader
        eyebrow="Módulo"
        title="Tarefas"
        subtitle="O que precisa ser feito, por prioridade e prazo."
        action={<Button variant="gradient" onClick={abrirCriar}>+ Nova tarefa</Button>}
      />

      <div className="flex gap-1 border-b border-border mb-4">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`px-3.5 py-2 text-[13px] font-semibold -mb-px border-b-2 transition-colors ${
              tab === t.id ? 'text-primary border-primary' : 'text-muted-foreground border-transparent hover:text-foreground'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <Card>
        {carregando && <div className="text-sm text-muted-foreground py-6 text-center">Carregando...</div>}
        {!carregando && visiveis.length === 0 && (
          <div className="text-sm text-muted-foreground py-6 text-center">Nenhuma tarefa nessa categoria ainda.</div>
        )}
        {visiveis.map((t) => {
          const subs = subtarefasDe(t.id)
          return (
            <div key={t.id}>
              <div className="flex items-start gap-3 py-2.5 border-b border-border last:border-none group">
                <button onClick={() => alternarConcluida(t)} className="mt-0.5 flex-shrink-0">
                  <div
                    className={`w-[17px] h-[17px] rounded-[5px] border-[1.5px] ${
                      t.status === 'concluida' ? 'bg-primary border-primary' : 'border-border'
                    }`}
                  />
                </button>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <div className={`text-[13.5px] font-semibold ${t.status === 'concluida' ? 'line-through text-muted-foreground' : ''}`}>
                      {t.titulo}
                    </div>
                    {t.recorrente && <Repeat size={12} className="text-muted-foreground flex-shrink-0" />}
                  </div>
                  <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                    {t.tag && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-accent text-primary">{t.tag}</span>
                    )}
                    {t.vencimento && (
                      <span className="text-[11.5px] text-muted-foreground">
                        vence {formatarDataBR(t.vencimento)}
                      </span>
                    )}
                  </div>
                </div>
                <Badge variant={PRIORIDADE_BADGE[t.prioridade]}>{t.prioridade}</Badge>
                <button onClick={() => abrirEditar(t)} className="text-muted-foreground hover:text-primary flex-shrink-0 mt-0.5">
                  <Pencil size={14} />
                </button>
                <button onClick={() => setConfirmandoExclusao(t.id)} className="text-muted-foreground hover:text-destructive flex-shrink-0 mt-0.5">
                  <Trash2 size={14} />
                </button>
                <button onClick={() => setExpandida(expandida === t.id ? null : t.id)} className="flex-shrink-0 mt-0.5">
                  <ChevronDown size={15} className={`text-muted-foreground transition-transform ${expandida === t.id ? 'rotate-180' : ''}`} />
                </button>
              </div>

              {confirmandoExclusao === t.id && (
                <DeleteConfirmBar label={`Excluir "${t.titulo}"?`} onCancel={() => setConfirmandoExclusao(null)} onConfirm={() => excluir(t.id)} />
              )}

              {expandida === t.id && (
                <div className="pl-[30px] pb-3 border-b border-border">
                  {subs.map((s) => (
                    <div key={s.id} className="flex items-center gap-2.5 py-1.5 text-[12.5px] group">
                      <button onClick={() => alternarConcluida(s)}>
                        <div className={`w-[14px] h-[14px] rounded-[4px] border-[1.5px] flex-shrink-0 ${s.status === 'concluida' ? 'bg-primary border-primary' : 'border-border'}`} />
                      </button>
                      <span className={`flex-1 ${s.status === 'concluida' ? 'line-through text-muted-foreground' : ''}`}>{s.titulo}</span>
                      <button onClick={() => excluir(s.id)} className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive">
                        <X size={12} />
                      </button>
                    </div>
                  ))}
                  <div className="flex items-center gap-2 mt-2">
                    <input
                      value={novaSubtarefa}
                      onChange={(e) => setNovaSubtarefa(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && adicionarSubtarefa(t.id)}
                      placeholder="Nova subtarefa..."
                      className="flex-1 bg-muted border border-border rounded-md px-2.5 py-1.5 text-xs outline-none focus:border-primary"
                    />
                    <button onClick={() => adicionarSubtarefa(t.id)} className="text-primary flex-shrink-0">
                      <Plus size={16} />
                    </button>
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </Card>

      <Modal open={modalAberto} title={editando ? 'Editar tarefa' : 'Nova tarefa'} onClose={() => setModalAberto(false)}>
        <form onSubmit={salvar} className="flex flex-col gap-3">
          <input
            required
            placeholder="Título"
            value={form.titulo}
            onChange={(e) => setForm({ ...form, titulo: e.target.value })}
            className="bg-muted border border-border rounded-lg px-3 py-2.5 text-sm outline-none focus:border-primary"
          />
          <input
            placeholder="Tag (opcional, ex: financeiro)"
            value={form.tag}
            onChange={(e) => setForm({ ...form, tag: e.target.value })}
            className="bg-muted border border-border rounded-lg px-3 py-2.5 text-sm outline-none focus:border-primary"
          />
          <select
            value={form.prioridade}
            onChange={(e) => setForm({ ...form, prioridade: e.target.value as Tarefa['prioridade'] })}
            className="bg-muted border border-border rounded-lg px-3 py-2.5 text-sm outline-none focus:border-primary"
          >
            <option value="alta">Prioridade alta</option>
            <option value="media">Prioridade média</option>
            <option value="baixa">Prioridade baixa</option>
          </select>
          <input
            type="date"
            value={form.vencimento}
            onChange={(e) => setForm({ ...form, vencimento: e.target.value })}
            className="bg-muted border border-border rounded-lg px-3 py-2.5 text-sm outline-none focus:border-primary"
          />
          <label className="flex items-center gap-2 text-sm font-medium">
            <input
              type="checkbox"
              checked={form.recorrente}
              onChange={(e) => setForm({ ...form, recorrente: e.target.checked })}
            />
            Recorrente
          </label>
          {form.recorrente && (
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">repete a cada</span>
              <input
                type="number"
                min="1"
                value={form.intervalo}
                onChange={(e) => setForm({ ...form, intervalo: e.target.value })}
                className="w-16 bg-muted border border-border rounded-lg px-2 py-1.5 text-sm outline-none focus:border-primary"
              />
              <span className="text-xs text-muted-foreground">dias (gera a próxima quando você concluir essa)</span>
            </div>
          )}
          {erro && <div className="text-xs text-destructive font-semibold break-words">{erro}</div>}
          <Button type="submit" disabled={salvando}>
            {salvando ? 'Salvando...' : editando ? 'Salvar alterações' : 'Criar tarefa'}
          </Button>
        </form>
      </Modal>
    </div>
  )
}

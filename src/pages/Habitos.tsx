import { useEffect, useState, type FormEvent } from 'react'
import { AlertTriangle, Pencil, Trash2 } from 'lucide-react'
import { PageHeader } from '../components/layout/PageHeader'
import { Card } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Modal } from '../components/ui/Modal'
import { DeleteConfirmBar } from '../components/ui/DeleteConfirmBar'
import { apiGet, apiPost, apiPatch, apiPut, apiDelete } from '../lib/api'
import { hojeBrasilia, deslocarDias } from '../lib/date'

interface Habito {
  id: string
  nome: string
  frequencia: string
  tag: string | null
  checks: string[] // datas YYYY-MM-DD
}

const CAMPOS_VAZIOS = { nome: '', frequencia: 'diario', tag: '' }

function ultimosDias(n: number): string[] {
  const hoje = hojeBrasilia()
  return Array.from({ length: n }, (_, i) => deslocarDias(hoje, -(n - 1 - i)))
}

function calcularStreak(checks: string[]): number {
  const setChecks = new Set(checks)
  let streak = 0
  let cursor = hojeBrasilia()
  while (setChecks.has(cursor)) {
    streak++
    cursor = deslocarDias(cursor, -1)
  }
  return streak
}

export function Habitos() {
  const [habitos, setHabitos] = useState<Habito[]>([])
  const [carregando, setCarregando] = useState(true)
  const [modalAberto, setModalAberto] = useState(false)
  const [editando, setEditando] = useState<Habito | null>(null)
  const [form, setForm] = useState(CAMPOS_VAZIOS)
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)
  const [confirmandoExclusao, setConfirmandoExclusao] = useState<string | null>(null)

  const dias = ultimosDias(14)
  const hoje = hojeBrasilia()

  async function carregar() {
    setCarregando(true)
    try {
      const rows = await apiGet<Habito[]>('/api/habitos')
      setHabitos(rows)
    } catch {
      setHabitos([])
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

  function abrirEditar(h: Habito) {
    setEditando(h)
    setForm({ nome: h.nome, frequencia: h.frequencia, tag: h.tag ?? '' })
    setErro(null)
    setModalAberto(true)
  }

  async function salvar(e: FormEvent) {
    e.preventDefault()
    setSalvando(true)
    setErro(null)
    try {
      const payload = { nome: form.nome, frequencia: form.frequencia, tag: form.tag || null }
      if (editando) {
        await apiPatch('/api/habitos', { id: editando.id, ...payload })
      } else {
        await apiPost('/api/habitos', payload)
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
    await apiDelete('/api/habitos', { id })
    setConfirmandoExclusao(null)
    await carregar()
  }

  async function alternarDia(habitoId: string, data: string) {
    await apiPut('/api/habitos', { habito_id: habitoId, data })
    await carregar()
  }

  const emRisco = habitos.find((h) => calcularStreak(h.checks) > 0 && !h.checks.includes(hoje))

  return (
    <div>
      <PageHeader
        eyebrow="Módulo"
        title="Hábitos"
        subtitle="Últimos 14 dias, marcado quando cumprido."
        action={<Button variant="gradient" onClick={abrirCriar}>+ Novo hábito</Button>}
      />

      {emRisco && (
        <div className="flex items-center gap-3 bg-[#FEF2F2] border border-[#FECACA] rounded-xl px-4 py-3 mb-4">
          <AlertTriangle size={20} className="text-destructive flex-shrink-0" />
          <div>
            <div className="font-semibold text-[#991B1B]">Streak de "{emRisco.nome}" em risco</div>
            <div className="text-xs text-[#991B1B]/80">ainda não marcado hoje · quebra à meia-noite</div>
          </div>
        </div>
      )}

      <Card>
        {carregando && <div className="text-sm text-muted-foreground py-4">Carregando...</div>}
        {!carregando && habitos.length === 0 && (
          <div className="text-sm text-muted-foreground py-4">Nenhum hábito cadastrado ainda.</div>
        )}
        {habitos.map((h) => {
          const streak = calcularStreak(h.checks)
          return (
            <div key={h.id} className="flex items-center gap-3.5 py-2.5 border-b border-border last:border-none group">
              <div className="w-[150px] flex-shrink-0">
                <div className="text-[13px] font-semibold">{h.nome}</div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-accent text-primary inline-block mt-1">
                  {h.frequencia}
                </span>
              </div>
              <div className="flex gap-1.5 flex-1">
                {dias.map((d) => (
                  <button
                    key={d}
                    onClick={() => alternarDia(h.id, d)}
                    title={new Date(d).toLocaleDateString('pt-BR')}
                    className="w-5 h-5 rounded-[5px] transition-colors"
                    style={{ background: h.checks.includes(d) ? 'var(--secondary)' : 'var(--muted)' }}
                  />
                ))}
              </div>
              <div className={`text-xs font-bold w-10 text-right flex-shrink-0 ${!h.checks.includes(hoje) && streak > 0 ? 'text-destructive' : 'text-[#92400E]'}`}>
                {streak}d
              </div>
              <button onClick={() => abrirEditar(h)} className="text-muted-foreground hover:text-primary flex-shrink-0">
                <Pencil size={14} />
              </button>
              <button onClick={() => setConfirmandoExclusao(h.id)} className="text-muted-foreground hover:text-destructive flex-shrink-0">
                <Trash2 size={14} />
              </button>
              {confirmandoExclusao === h.id && (
                <div className="w-full">
                  <DeleteConfirmBar label={`Excluir "${h.nome}"?`} onCancel={() => setConfirmandoExclusao(null)} onConfirm={() => excluir(h.id)} />
                </div>
              )}
            </div>
          )
        })}
      </Card>

      <Modal open={modalAberto} title={editando ? 'Editar hábito' : 'Novo hábito'} onClose={() => setModalAberto(false)}>
        <form onSubmit={salvar} className="flex flex-col gap-3">
          <input
            required
            placeholder="Nome (ex: Água 2L)"
            value={form.nome}
            onChange={(e) => setForm({ ...form, nome: e.target.value })}
            className="bg-muted border border-border rounded-lg px-3 py-2.5 text-sm outline-none focus:border-primary"
          />
          <input
            placeholder="Frequência (ex: diario, 4x_semana)"
            value={form.frequencia}
            onChange={(e) => setForm({ ...form, frequencia: e.target.value })}
            className="bg-muted border border-border rounded-lg px-3 py-2.5 text-sm outline-none focus:border-primary"
          />
          <input
            placeholder="Tag (opcional)"
            value={form.tag}
            onChange={(e) => setForm({ ...form, tag: e.target.value })}
            className="bg-muted border border-border rounded-lg px-3 py-2.5 text-sm outline-none focus:border-primary"
          />
          {erro && <div className="text-xs text-destructive font-semibold break-words">{erro}</div>}
          <Button type="submit" disabled={salvando}>
            {salvando ? 'Salvando...' : editando ? 'Salvar alterações' : 'Criar hábito'}
          </Button>
        </form>
      </Modal>
    </div>
  )
}

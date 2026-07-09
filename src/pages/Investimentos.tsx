import { useEffect, useState, type FormEvent } from 'react'
import { AreaChart, Area, ResponsiveContainer, XAxis, Tooltip } from 'recharts'
import { Pencil, Trash2 } from 'lucide-react'
import { PageHeader } from '../components/layout/PageHeader'
import { Card, CardTitle } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { ProgressBar } from '../components/ui/ProgressBar'
import { Modal } from '../components/ui/Modal'
import { DeleteConfirmBar } from '../components/ui/DeleteConfirmBar'
import { apiGet, apiPost, apiPatch, apiPut, apiDelete } from '../lib/api'

interface Ativo {
  id: string
  nome: string
  classe: 'renda_fixa' | 'acoes_fiis' | 'fundos' | 'reserva_cripto'
  valor_atual: string | number
  rentabilidade_12m: string | number | null
}
interface Aporte { id: string; ativo_id: string; valor: string | number; data: string }

const CLASSES = [
  { id: 'renda_fixa', label: 'Renda fixa', cor: 'var(--primary)' },
  { id: 'acoes_fiis', label: 'Ações / FIIs', cor: 'var(--secondary)' },
  { id: 'fundos', label: 'Fundos multimercado', cor: '#F59E0B' },
  { id: 'reserva_cripto', label: 'Reserva / cripto', cor: 'var(--destructive)' },
] as const

const CAMPOS_VAZIOS = { ativoId: 'novo', nomeNovo: '', classeNovo: 'renda_fixa', valor: '', data: new Date().toISOString().slice(0, 10) }

export function Investimentos() {
  const [ativos, setAtivos] = useState<Ativo[]>([])
  const [aportes, setAportes] = useState<Aporte[]>([])
  const [carregando, setCarregando] = useState(true)

  const [modalAberto, setModalAberto] = useState(false)
  const [form, setForm] = useState(CAMPOS_VAZIOS)
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)
  const [confirmandoExclusao, setConfirmandoExclusao] = useState<string | null>(null)

  const [editando, setEditando] = useState<Ativo | null>(null)
  const [formEdicao, setFormEdicao] = useState({ nome: '', classe: 'renda_fixa' as Ativo['classe'], rentabilidade_12m: '' })

  async function carregar() {
    setCarregando(true)
    try {
      const { ativos, aportes } = await apiGet<{ ativos: Ativo[]; aportes: Aporte[] }>('/api/investimentos')
      setAtivos(ativos)
      setAportes(aportes)
    } catch {
      setAtivos([])
      setAportes([])
    } finally {
      setCarregando(false)
    }
  }

  useEffect(() => {
    carregar()
  }, [])

  const patrimonioTotal = ativos.reduce((s, a) => s + Number(a.valor_atual), 0)
  const alocacao = CLASSES.map((c) => {
    const valor = ativos.filter((a) => a.classe === c.id).reduce((s, a) => s + Number(a.valor_atual), 0)
    return { ...c, valor, pct: patrimonioTotal > 0 ? Math.round((valor / patrimonioTotal) * 100) : 0 }
  }).filter((c) => c.valor > 0)

  const aporteMedioMensal = (() => {
    if (aportes.length === 0) return 0
    const porMes = new Map<string, number>()
    aportes.forEach((a) => {
      const mes = a.data.slice(0, 7)
      porMes.set(mes, (porMes.get(mes) ?? 0) + Number(a.valor))
    })
    const soma = [...porMes.values()].reduce((s, v) => s + v, 0)
    return soma / porMes.size
  })()

  const evolucao = (() => {
    if (aportes.length === 0) return []
    const porMes = new Map<string, number>()
    ;[...aportes].sort((a, b) => a.data.localeCompare(b.data)).forEach((a) => {
      const mes = a.data.slice(0, 7)
      porMes.set(mes, (porMes.get(mes) ?? 0) + Number(a.valor))
    })
    let acumulado = 0
    return [...porMes.entries()].map(([mes, valorMes]) => {
      acumulado += valorMes
      return { mes, valor: acumulado }
    })
  })()

  function abrirCriar() {
    setForm(CAMPOS_VAZIOS)
    setErro(null)
    setModalAberto(true)
  }

  async function salvar(e: FormEvent) {
    e.preventDefault()
    setSalvando(true)
    setErro(null)
    try {
      let ativoId = form.ativoId
      if (ativoId === 'novo') {
        const novo = await apiPost<Ativo>('/api/investimentos', { nome: form.nomeNovo, classe: form.classeNovo, valor_atual: 0 })
        ativoId = novo.id
      }
      await apiPut('/api/investimentos', { ativo_id: ativoId, valor: Number(form.valor), data: form.data })
      setModalAberto(false)
      await carregar()
    } catch (err) {
      setErro(err instanceof Error ? err.message : 'Não foi possível salvar.')
    } finally {
      setSalvando(false)
    }
  }

  function abrirEdicao(a: Ativo) {
    setEditando(a)
    setFormEdicao({ nome: a.nome, classe: a.classe, rentabilidade_12m: a.rentabilidade_12m != null ? String(a.rentabilidade_12m) : '' })
  }

  async function salvarEdicao(e: FormEvent) {
    e.preventDefault()
    if (!editando) return
    await apiPatch('/api/investimentos', {
      id: editando.id,
      nome: formEdicao.nome,
      classe: formEdicao.classe,
      rentabilidade_12m: formEdicao.rentabilidade_12m ? Number(formEdicao.rentabilidade_12m) : null,
    })
    setEditando(null)
    await carregar()
  }

  async function excluir(id: string) {
    await apiDelete('/api/investimentos', { id })
    setConfirmandoExclusao(null)
    await carregar()
  }

  return (
    <div>
      <PageHeader
        eyebrow="Módulo"
        title="Investimentos"
        subtitle="Carteira consolidada, alocação e rentabilidade."
        action={<Button variant="gradient" onClick={abrirCriar}>+ Novo aporte</Button>}
      />

      <div className="grid grid-cols-3 gap-4 mb-4">
        <Card>
          <CardTitle>Patrimônio investido</CardTitle>
          <div className="text-2xl font-extrabold">R$ {patrimonioTotal.toLocaleString('pt-BR')}</div>
        </Card>
        <Card>
          <CardTitle>Ativos cadastrados</CardTitle>
          <div className="text-2xl font-extrabold">{ativos.length}</div>
        </Card>
        <Card>
          <CardTitle>Aporte médio mensal</CardTitle>
          <div className="text-2xl font-extrabold">R$ {Math.round(aporteMedioMensal).toLocaleString('pt-BR')}</div>
        </Card>
      </div>

      <Card className="mb-4">
        <CardTitle>Evolução patrimonial (acumulado de aportes)</CardTitle>
        <div style={{ width: '100%', height: 140 }}>
          {evolucao.length === 0 ? (
            <div className="h-full flex items-center justify-center text-sm text-muted-foreground">Sem dados suficientes ainda.</div>
          ) : (
            <ResponsiveContainer>
              <AreaChart data={evolucao}>
                <defs>
                  <linearGradient id="evoGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--primary)" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="var(--primary)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="mes" tick={{ fontSize: 10.5, fill: 'var(--muted-foreground)' }} axisLine={false} tickLine={false} />
                <Tooltip formatter={(v: number) => [`R$ ${v.toLocaleString('pt-BR')}`, 'Acumulado']} contentStyle={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 12 }} />
                <Area type="monotone" dataKey="valor" stroke="var(--primary)" strokeWidth={2.5} fill="url(#evoGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>
      </Card>

      <div className="grid grid-cols-[2fr_1fr] gap-4">
        <Card>
          <CardTitle>Ativos</CardTitle>
          {carregando && <div className="text-sm text-muted-foreground py-4">Carregando...</div>}
          {!carregando && ativos.length === 0 && (
            <div className="text-sm text-muted-foreground py-4">Nenhum ativo cadastrado ainda.</div>
          )}
          {ativos.map((a) => {
            const classe = CLASSES.find((c) => c.id === a.classe)!
            return (
              <div key={a.id}>
                <div className="flex items-center gap-3 py-2.5 border-b border-border last:border-none group">
                  <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: classe.cor }} />
                  <div className="flex-1 min-w-0">
                    <div className="text-[13.5px] font-semibold">{a.nome}</div>
                    <div className="text-[11.5px] text-muted-foreground">{classe.label}</div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <div className="text-[13px] font-bold">R$ {Number(a.valor_atual).toLocaleString('pt-BR')}</div>
                    {a.rentabilidade_12m != null && (
                      <div className={`text-[11px] font-bold mt-0.5 ${Number(a.rentabilidade_12m) >= 0 ? 'text-[#10B981]' : 'text-destructive'}`}>
                        {Number(a.rentabilidade_12m) >= 0 ? '+' : ''}{a.rentabilidade_12m}%
                      </div>
                    )}
                  </div>
                  <button onClick={() => abrirEdicao(a)} className="text-muted-foreground hover:text-primary flex-shrink-0"><Pencil size={14} /></button>
                  <button onClick={() => setConfirmandoExclusao(a.id)} className="text-muted-foreground hover:text-destructive flex-shrink-0"><Trash2 size={14} /></button>
                </div>
                {confirmandoExclusao === a.id && (
                  <DeleteConfirmBar label={`Excluir "${a.nome}"? Os aportes registrados também somem.`} onCancel={() => setConfirmandoExclusao(null)} onConfirm={() => excluir(a.id)} />
                )}
              </div>
            )
          })}
        </Card>

        <Card>
          <CardTitle>Alocação por classe</CardTitle>
          {alocacao.length === 0 && <div className="text-sm text-muted-foreground py-4">Sem alocação registrada ainda.</div>}
          {alocacao.map((c) => (
            <div key={c.id} className="mb-3.5 last:mb-0">
              <div className="flex justify-between text-[12.5px] font-semibold">
                <span>{c.label}</span>
                <span className="text-muted-foreground">R$ {c.valor.toLocaleString('pt-BR')} · {c.pct}%</span>
              </div>
              <ProgressBar percent={c.pct} color={c.cor} />
            </div>
          ))}
        </Card>
      </div>

      <Modal open={modalAberto} title="Novo aporte" onClose={() => setModalAberto(false)}>
        <form onSubmit={salvar} className="flex flex-col gap-3">
          <select
            value={form.ativoId}
            onChange={(e) => setForm({ ...form, ativoId: e.target.value })}
            className="bg-muted border border-border rounded-lg px-3 py-2.5 text-sm outline-none focus:border-primary"
          >
            <option value="novo">+ Criar novo ativo</option>
            {ativos.map((a) => <option key={a.id} value={a.id}>{a.nome}</option>)}
          </select>

          {form.ativoId === 'novo' && (
            <>
              <input
                required
                placeholder="Nome do ativo (ex: Tesouro Selic 2029)"
                value={form.nomeNovo}
                onChange={(e) => setForm({ ...form, nomeNovo: e.target.value })}
                className="bg-muted border border-border rounded-lg px-3 py-2.5 text-sm outline-none focus:border-primary"
              />
              <select
                value={form.classeNovo}
                onChange={(e) => setForm({ ...form, classeNovo: e.target.value })}
                className="bg-muted border border-border rounded-lg px-3 py-2.5 text-sm outline-none focus:border-primary"
              >
                {CLASSES.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
              </select>
            </>
          )}

          <input
            required
            type="number"
            step="0.01"
            placeholder="Valor do aporte"
            value={form.valor}
            onChange={(e) => setForm({ ...form, valor: e.target.value })}
            className="bg-muted border border-border rounded-lg px-3 py-2.5 text-sm outline-none focus:border-primary"
          />
          <input
            type="date"
            value={form.data}
            onChange={(e) => setForm({ ...form, data: e.target.value })}
            className="bg-muted border border-border rounded-lg px-3 py-2.5 text-sm outline-none focus:border-primary"
          />
          {erro && <div className="text-xs text-destructive font-semibold break-words">{erro}</div>}
          <Button type="submit" disabled={salvando}>{salvando ? 'Salvando...' : 'Registrar aporte'}</Button>
        </form>
      </Modal>

      <Modal open={!!editando} title="Editar ativo" onClose={() => setEditando(null)}>
        <form onSubmit={salvarEdicao} className="flex flex-col gap-3">
          <input
            required
            value={formEdicao.nome}
            onChange={(e) => setFormEdicao({ ...formEdicao, nome: e.target.value })}
            className="bg-muted border border-border rounded-lg px-3 py-2.5 text-sm outline-none focus:border-primary"
          />
          <select
            value={formEdicao.classe}
            onChange={(e) => setFormEdicao({ ...formEdicao, classe: e.target.value as Ativo['classe'] })}
            className="bg-muted border border-border rounded-lg px-3 py-2.5 text-sm outline-none focus:border-primary"
          >
            {CLASSES.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
          </select>
          <input
            type="number"
            step="0.01"
            placeholder="Rentabilidade 12m % (opcional)"
            value={formEdicao.rentabilidade_12m}
            onChange={(e) => setFormEdicao({ ...formEdicao, rentabilidade_12m: e.target.value })}
            className="bg-muted border border-border rounded-lg px-3 py-2.5 text-sm outline-none focus:border-primary"
          />
          <Button type="submit">Salvar alterações</Button>
        </form>
      </Modal>
    </div>
  )
}

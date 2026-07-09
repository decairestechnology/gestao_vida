import { useEffect, useState, type FormEvent } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Landmark, CreditCard, Wallet, PiggyBank, Pencil, Trash2 } from 'lucide-react'
import { Card, CardTitle } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Modal } from '../components/ui/Modal'
import { DeleteConfirmBar } from '../components/ui/DeleteConfirmBar'
import { apiGet, apiPost, apiPatch, apiDelete } from '../lib/api'
import { CATEGORIAS_DESPESA, CATEGORIAS_RECEITA } from '../data/categorias'
import { hojeBrasilia } from '../lib/date'

const TIPOS_CONTA = [
  { id: 'corrente', label: 'Conta corrente', icon: Landmark, bg: 'var(--accent)', color: 'var(--primary)' },
  { id: 'cartao', label: 'Cartão de crédito', icon: CreditCard, bg: '#F5F3FF', color: 'var(--secondary)' },
  { id: 'dinheiro', label: 'Dinheiro / carteira', icon: Wallet, bg: '#ECFDF5', color: '#10B981' },
  { id: 'poupanca', label: 'Poupança', icon: PiggyBank, bg: '#FFFBEB', color: '#92400E' },
] as const

interface Conta {
  id: string
  nome: string
  tipo: string
  saldo: string | number
  limite: string | number | null
  fechamento_dia: number | null
}
interface Transacao {
  id: string
  titulo: string
  categoria: string
  descricao?: string | null
  valor: string | number
  data: string
  conta_id?: string | null
}

const CAMPOS_VAZIOS = {
  titulo: '', categoria: '', descricao: '',
  tipo: 'despesa' as 'despesa' | 'receita',
  valor: '', data: hojeBrasilia(),
}

export function ContaDetalhe() {
  const { contaId } = useParams()
  const navigate = useNavigate()

  const [conta, setConta] = useState<Conta | null>(null)
  const [transacoes, setTransacoes] = useState<Transacao[]>([])
  const [carregando, setCarregando] = useState(true)

  const [modalAberto, setModalAberto] = useState(false)
  const [editando, setEditando] = useState<Transacao | null>(null)
  const [form, setForm] = useState(CAMPOS_VAZIOS)
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)
  const [confirmandoExclusao, setConfirmandoExclusao] = useState<string | null>(null)

  const [modalEdicaoContaAberto, setModalEdicaoContaAberto] = useState(false)
  const [formConta, setFormConta] = useState({ nome: '', tipo: 'corrente', saldo: '0', limite: '', fechamento_dia: '' })
  const [confirmandoExclusaoConta, setConfirmandoExclusaoConta] = useState(false)

  async function carregar() {
    setCarregando(true)
    try {
      const [contas, todasTransacoes] = await Promise.all([
        apiGet<Conta[]>('/api/contas'),
        apiGet<Transacao[]>('/api/transacoes'),
      ])
      const encontrada = contas.find((c) => c.id === contaId) ?? null
      setConta(encontrada)
      setTransacoes(todasTransacoes.filter((t) => t.conta_id === contaId))
    } finally {
      setCarregando(false)
    }
  }

  useEffect(() => {
    carregar()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [contaId])

  if (!carregando && !conta) {
    return (
      <div>
        <button onClick={() => navigate('/financeiro')} className="flex items-center gap-1.5 text-sm font-semibold text-muted-foreground hover:text-primary mb-4">
          <ArrowLeft size={15} /> Voltar pro Financeiro
        </button>
        <div className="text-sm text-muted-foreground">Conta não encontrada.</div>
      </div>
    )
  }

  const saldoAtual = conta ? Number(conta.saldo) + transacoes.reduce((s, t) => s + Number(t.valor), 0) : 0
  const info = TIPOS_CONTA.find((t) => t.id === conta?.tipo) ?? TIPOS_CONTA[0]
  const Icon = info.icon

  function abrirCriar() {
    setEditando(null)
    setForm(CAMPOS_VAZIOS)
    setErro(null)
    setModalAberto(true)
  }

  function abrirEditar(t: Transacao) {
    setEditando(t)
    setForm({
      titulo: t.titulo, categoria: t.categoria, descricao: t.descricao ?? '',
      tipo: Number(t.valor) < 0 ? 'despesa' : 'receita',
      valor: String(Math.abs(Number(t.valor))), data: t.data.slice(0, 10),
    })
    setErro(null)
    setModalAberto(true)
  }

  async function salvar(e: FormEvent) {
    e.preventDefault()
    setSalvando(true)
    setErro(null)
    try {
      const valorAssinado = form.tipo === 'despesa' ? -Math.abs(Number(form.valor)) : Math.abs(Number(form.valor))
      const payload = {
        titulo: form.titulo, categoria: form.categoria, descricao: form.descricao || null,
        valor: valorAssinado, data: form.data, conta_id: contaId,
      }
      if (editando) {
        await apiPatch('/api/transacoes', { id: editando.id, ...payload })
      } else {
        await apiPost('/api/transacoes', payload)
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
    await apiDelete('/api/transacoes', { id })
    setConfirmandoExclusao(null)
    await carregar()
  }

  function abrirEdicaoConta() {
    if (!conta) return
    setFormConta({
      nome: conta.nome, tipo: conta.tipo, saldo: String(conta.saldo),
      limite: conta.limite != null ? String(conta.limite) : '',
      fechamento_dia: conta.fechamento_dia != null ? String(conta.fechamento_dia) : '',
    })
    setModalEdicaoContaAberto(true)
  }

  async function salvarEdicaoConta(e: FormEvent) {
    e.preventDefault()
    if (!conta) return
    await apiPatch('/api/contas', {
      id: conta.id,
      nome: formConta.nome,
      tipo: formConta.tipo,
      saldo: Number(formConta.saldo || 0),
      limite: formConta.tipo === 'cartao' && formConta.limite ? Number(formConta.limite) : null,
      fechamento_dia: formConta.tipo === 'cartao' && formConta.fechamento_dia ? Number(formConta.fechamento_dia) : null,
    })
    setModalEdicaoContaAberto(false)
    await carregar()
  }

  async function excluirConta() {
    if (!conta) return
    await apiDelete('/api/contas', { id: conta.id })
    navigate('/financeiro')
  }

  return (
    <div>
      <button onClick={() => navigate('/financeiro')} className="flex items-center gap-1.5 text-sm font-semibold text-muted-foreground hover:text-primary mb-4">
        <ArrowLeft size={15} /> Voltar pro Financeiro
      </button>

      {carregando && <div className="text-sm text-muted-foreground">Carregando...</div>}

      {conta && (
        <>
          <div className="flex items-start justify-between mb-5">
            <div className="flex items-center gap-3.5">
              <div className="w-[46px] h-[46px] rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: info.bg, color: info.color }}>
                <Icon size={22} />
              </div>
              <div>
                <div className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground">{info.label}</div>
                <h1 className="text-2xl font-bold">{conta.nome}</h1>
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={abrirEdicaoConta} className="w-9 h-9 rounded-full border border-border bg-muted flex items-center justify-center text-muted-foreground hover:text-primary hover:bg-accent">
                <Pencil size={14} />
              </button>
              <button onClick={() => setConfirmandoExclusaoConta(true)} className="w-9 h-9 rounded-full border border-border bg-muted flex items-center justify-center text-muted-foreground hover:text-destructive">
                <Trash2 size={14} />
              </button>
            </div>
          </div>

          {confirmandoExclusaoConta && (
            <div className="mb-4">
              <DeleteConfirmBar
                label={`Excluir "${conta.nome}"? Os lançamentos continuam existindo, mas ficam sem conta associada.`}
                onCancel={() => setConfirmandoExclusaoConta(false)}
                onConfirm={excluirConta}
              />
            </div>
          )}

          <div className="grid grid-cols-3 gap-4 mb-4">
            <Card>
              <CardTitle>Saldo atual</CardTitle>
              <div className="text-2xl font-extrabold" style={{ color: saldoAtual < 0 ? 'var(--destructive)' : undefined }}>
                R$ {saldoAtual.toLocaleString('pt-BR')}
              </div>
            </Card>
            <Card>
              <CardTitle>Lançamentos</CardTitle>
              <div className="text-2xl font-extrabold">{transacoes.length}</div>
            </Card>
            {conta.tipo === 'cartao' ? (
              <Card>
                <CardTitle>Limite / fechamento</CardTitle>
                <div className="text-lg font-extrabold">
                  {conta.limite != null ? `R$ ${Number(conta.limite).toLocaleString('pt-BR')}` : '—'}
                </div>
                <div className="text-xs font-semibold text-muted-foreground mt-1">
                  {conta.fechamento_dia ? `fecha dia ${conta.fechamento_dia}` : 'sem dia de fechamento definido'}
                </div>
              </Card>
            ) : (
              <Card>
                <CardTitle>Saldo inicial cadastrado</CardTitle>
                <div className="text-lg font-extrabold">R$ {Number(conta.saldo).toLocaleString('pt-BR')}</div>
              </Card>
            )}
          </div>

          <Card>
            <div className="flex justify-between items-center mb-2.5">
              <CardTitle className="mb-0">Lançamentos dessa conta</CardTitle>
              <Button variant="gradient" onClick={abrirCriar}>+ Novo lançamento</Button>
            </div>
            {transacoes.length === 0 && (
              <div className="text-sm text-muted-foreground py-4">Nenhum lançamento associado a essa conta ainda.</div>
            )}
            {transacoes.map((t) => (
              <div key={t.id}>
                <div className="flex items-center gap-3 py-2.5 border-b border-border last:border-none group">
                  <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: Number(t.valor) < 0 ? 'var(--destructive)' : '#10B981' }} />
                  <div className="flex-1">
                    <div className="text-[13.5px] font-semibold">{t.titulo}</div>
                    <div className="text-[11.5px] text-muted-foreground">{t.categoria}{t.descricao ? ` · ${t.descricao}` : ''}</div>
                  </div>
                  <div className="text-[13px] font-bold" style={{ color: Number(t.valor) < 0 ? 'var(--destructive)' : '#10B981' }}>
                    {Number(t.valor) < 0 ? '− ' : '+ '}R$ {Math.abs(Number(t.valor))}
                  </div>
                  <button onClick={() => abrirEditar(t)} className="text-muted-foreground hover:text-primary flex-shrink-0"><Pencil size={14} /></button>
                  <button onClick={() => setConfirmandoExclusao(t.id)} className="text-muted-foreground hover:text-destructive flex-shrink-0"><Trash2 size={14} /></button>
                </div>
                {confirmandoExclusao === t.id && (
                  <DeleteConfirmBar label={`Excluir "${t.titulo}"?`} onCancel={() => setConfirmandoExclusao(null)} onConfirm={() => excluir(t.id)} />
                )}
              </div>
            ))}
          </Card>
        </>
      )}

      <Modal open={modalAberto} title={editando ? 'Editar lançamento' : 'Novo lançamento'} onClose={() => setModalAberto(false)}>
        <form onSubmit={salvar} className="flex flex-col gap-3">
          <div className="flex gap-2">
            <button type="button" onClick={() => setForm({ ...form, tipo: 'despesa', categoria: '' })}
              className={`flex-1 py-2 rounded-lg text-sm font-semibold border transition-colors ${form.tipo === 'despesa' ? 'bg-[#FEF2F2] border-destructive text-destructive' : 'border-border text-muted-foreground'}`}>
              Gasto
            </button>
            <button type="button" onClick={() => setForm({ ...form, tipo: 'receita', categoria: '' })}
              className={`flex-1 py-2 rounded-lg text-sm font-semibold border transition-colors ${form.tipo === 'receita' ? 'bg-[#ECFDF5] border-[#10B981] text-[#10B981]' : 'border-border text-muted-foreground'}`}>
              Receita
            </button>
          </div>
          <input required placeholder="Título" value={form.titulo} onChange={(e) => setForm({ ...form, titulo: e.target.value })}
            className="bg-muted border border-border rounded-lg px-3 py-2.5 text-sm outline-none focus:border-primary" />
          <select required value={form.categoria} onChange={(e) => setForm({ ...form, categoria: e.target.value })}
            className="bg-muted border border-border rounded-lg px-3 py-2.5 text-sm outline-none focus:border-primary">
            <option value="" disabled>Categoria...</option>
            {(form.tipo === 'despesa' ? CATEGORIAS_DESPESA : CATEGORIAS_RECEITA).map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
          <textarea placeholder="Descrição (opcional)" value={form.descricao} onChange={(e) => setForm({ ...form, descricao: e.target.value })} rows={2}
            className="bg-muted border border-border rounded-lg px-3 py-2.5 text-sm outline-none focus:border-primary resize-none" />
          <input required type="number" step="0.01" min="0" placeholder="Valor" value={form.valor} onChange={(e) => setForm({ ...form, valor: e.target.value })}
            className="bg-muted border border-border rounded-lg px-3 py-2.5 text-sm outline-none focus:border-primary" />
          <input type="date" value={form.data} onChange={(e) => setForm({ ...form, data: e.target.value })}
            className="bg-muted border border-border rounded-lg px-3 py-2.5 text-sm outline-none focus:border-primary" />
          {erro && <div className="text-xs text-destructive font-semibold break-words">{erro}</div>}
          <Button type="submit" disabled={salvando}>{salvando ? 'Salvando...' : editando ? 'Salvar alterações' : 'Criar lançamento'}</Button>
        </form>
      </Modal>

      <Modal open={modalEdicaoContaAberto} title="Editar conta" onClose={() => setModalEdicaoContaAberto(false)}>
        <form onSubmit={salvarEdicaoConta} className="flex flex-col gap-3">
          <input required placeholder="Nome" value={formConta.nome} onChange={(e) => setFormConta({ ...formConta, nome: e.target.value })}
            className="bg-muted border border-border rounded-lg px-3 py-2.5 text-sm outline-none focus:border-primary" />
          <select value={formConta.tipo} onChange={(e) => setFormConta({ ...formConta, tipo: e.target.value })}
            className="bg-muted border border-border rounded-lg px-3 py-2.5 text-sm outline-none focus:border-primary">
            {TIPOS_CONTA.map((t) => <option key={t.id} value={t.id}>{t.label}</option>)}
          </select>
          <input type="number" step="0.01" placeholder="Saldo inicial" value={formConta.saldo} onChange={(e) => setFormConta({ ...formConta, saldo: e.target.value })}
            className="bg-muted border border-border rounded-lg px-3 py-2.5 text-sm outline-none focus:border-primary" />
          {formConta.tipo === 'cartao' && (
            <>
              <input type="number" step="0.01" placeholder="Limite do cartão" value={formConta.limite} onChange={(e) => setFormConta({ ...formConta, limite: e.target.value })}
                className="bg-muted border border-border rounded-lg px-3 py-2.5 text-sm outline-none focus:border-primary" />
              <input type="number" min="1" max="31" placeholder="Dia de fechamento" value={formConta.fechamento_dia} onChange={(e) => setFormConta({ ...formConta, fechamento_dia: e.target.value })}
                className="bg-muted border border-border rounded-lg px-3 py-2.5 text-sm outline-none focus:border-primary" />
            </>
          )}
          <Button type="submit">Salvar alterações</Button>
        </form>
      </Modal>
    </div>
  )
}

import { useEffect, useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { Landmark, CreditCard, Wallet, PiggyBank, Search, Pencil, Trash2, Plus } from 'lucide-react'
import { PageHeader } from '../components/layout/PageHeader'
import { Card, CardTitle } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { ProgressBar } from '../components/ui/ProgressBar'
import { Modal } from '../components/ui/Modal'
import { DeleteConfirmBar } from '../components/ui/DeleteConfirmBar'
import { apiGet, apiPost, apiPatch, apiDelete } from '../lib/api'

import { useCategorias } from '../context/CategoriasContext'
import { hojeBrasilia, formatarDataBR } from '../lib/date'

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
  recorrente?: boolean
  recorrencia_intervalo_dias?: number
}

const CAMPOS_VAZIOS = {
  titulo: '', categoria: '', descricao: '',
  tipo: 'despesa' as 'despesa' | 'receita',
  valor: '', data: hojeBrasilia(),
  conta_id: '', recorrente: false, intervalo: '30',
}
const CAMPOS_CONTA_VAZIOS = { nome: '', tipo: 'corrente', saldo: '0', limite: '', fechamento_dia: '' }

interface Orcamento {
  id: string
  categoria: string
  limite: string | number
  mes_referencia: string
}
const CAMPOS_ORCAMENTO_VAZIOS = { categoria: '', limite: '' }

export function Financeiro() {
  const navigate = useNavigate()
  const { categoriasDespesa, categoriasReceita } = useCategorias()
  const [contas, setContas] = useState<Conta[]>([])
  const [transacoes, setTransacoes] = useState<Transacao[]>([])
  const [carregando, setCarregando] = useState(true)
  const [busca, setBusca] = useState('')
  const [filtro, setFiltro] = useState('Todas')

  const [modalAberto, setModalAberto] = useState(false)
  const [editando, setEditando] = useState<Transacao | null>(null)
  const [form, setForm] = useState(CAMPOS_VAZIOS)
  const [salvando, setSalvando] = useState(false)
  const [confirmandoExclusao, setConfirmandoExclusao] = useState<string | null>(null)
  const [erro, setErro] = useState<string | null>(null)

  const [modalContaAberto, setModalContaAberto] = useState(false)
  const [formConta, setFormConta] = useState(CAMPOS_CONTA_VAZIOS)
  const [salvandoConta, setSalvandoConta] = useState(false)

  const [orcamentos, setOrcamentos] = useState<Orcamento[]>([])
  const [modalOrcamentoAberto, setModalOrcamentoAberto] = useState(false)
  const [editandoOrcamento, setEditandoOrcamento] = useState<Orcamento | null>(null)
  const [formOrcamento, setFormOrcamento] = useState(CAMPOS_ORCAMENTO_VAZIOS)
  const [salvandoOrcamento, setSalvandoOrcamento] = useState(false)
  const [confirmandoExclusaoOrcamento, setConfirmandoExclusaoOrcamento] = useState<string | null>(null)

  async function carregar() {
    setCarregando(true)
    try {
      const [c, t, o] = await Promise.all([
        apiGet<Conta[]>('/api/contas'),
        apiGet<Transacao[]>('/api/transacoes'),
        apiGet<Orcamento[]>('/api/orcamentos'),
      ])
      setContas(c)
      setTransacoes(t)
      setOrcamentos(o)
    } catch {
      setContas([])
      setTransacoes([])
      setOrcamentos([])
    } finally {
      setCarregando(false)
    }
  }

  useEffect(() => {
    carregar()
  }, [])

  function saldoDaConta(conta: Conta) {
    const hoje = hojeBrasilia()
    const soma = transacoes
      .filter((t) => t.conta_id === conta.id && t.data.slice(0, 10) <= hoje)
      .reduce((s, t) => s + Number(t.valor), 0)
    return Number(conta.saldo) + soma
  }

  function abrirCriar() {
    setEditando(null)
    setForm({ ...CAMPOS_VAZIOS, conta_id: contas[0]?.id ?? '' })
    setErro(null)
    setModalAberto(true)
  }

  function abrirEditar(t: Transacao) {
    setEditando(t)
    setForm({
      titulo: t.titulo, categoria: t.categoria, descricao: t.descricao ?? '',
      tipo: Number(t.valor) < 0 ? 'despesa' : 'receita',
      valor: String(Math.abs(Number(t.valor))), data: t.data.slice(0, 10),
      conta_id: t.conta_id ?? '', recorrente: t.recorrente ?? false,
      intervalo: String(t.recorrencia_intervalo_dias ?? 30),
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
        titulo: form.titulo,
        categoria: form.categoria,
        descricao: form.descricao || null,
        valor: valorAssinado,
        data: form.data,
        conta_id: form.conta_id || null,
        recorrente: form.recorrente,
        recorrencia_intervalo_dias: form.recorrente ? Number(form.intervalo) : null,
      }
      if (editando) {
        await apiPatch('/api/transacoes', { id: editando.id, ...payload })
      } else {
        await apiPost('/api/transacoes', payload)
      }
      setModalAberto(false)
      await carregar()
    } catch (err) {
      setErro(err instanceof Error ? err.message : 'Não foi possível salvar. Tenta de novo.')
    } finally {
      setSalvando(false)
    }
  }

  async function excluir(id: string) {
    try {
      await apiDelete('/api/transacoes', { id })
      setConfirmandoExclusao(null)
      await carregar()
    } catch {
      alert('Não foi possível excluir. Tenta de novo.')
    }
  }

  function abrirCriarConta(tipo?: string) {
    setFormConta({ ...CAMPOS_CONTA_VAZIOS, tipo: tipo ?? 'corrente' })
    setModalContaAberto(true)
  }

  async function salvarConta(e: FormEvent) {
    e.preventDefault()
    setSalvandoConta(true)
    try {
      const payload = {
        nome: formConta.nome,
        tipo: formConta.tipo,
        saldo: Number(formConta.saldo || 0),
        limite: formConta.tipo === 'cartao' && formConta.limite ? Number(formConta.limite) : null,
        fechamento_dia: formConta.tipo === 'cartao' && formConta.fechamento_dia ? Number(formConta.fechamento_dia) : null,
      }
      await apiPost('/api/contas', payload)
      setModalContaAberto(false)
      await carregar()
    } finally {
      setSalvandoConta(false)
    }
  }

  function abrirCriarOrcamento() {
    setEditandoOrcamento(null)
    setFormOrcamento(CAMPOS_ORCAMENTO_VAZIOS)
    setModalOrcamentoAberto(true)
  }

  function abrirEditarOrcamento(o: Orcamento) {
    setEditandoOrcamento(o)
    setFormOrcamento({ categoria: o.categoria, limite: String(o.limite) })
    setModalOrcamentoAberto(true)
  }

  async function salvarOrcamento(e: FormEvent) {
    e.preventDefault()
    setSalvandoOrcamento(true)
    try {
      if (editandoOrcamento) {
        await apiPatch('/api/orcamentos', { id: editandoOrcamento.id, limite: Number(formOrcamento.limite) })
      } else {
        await apiPost('/api/orcamentos', { categoria: formOrcamento.categoria, limite: Number(formOrcamento.limite) })
      }
      setModalOrcamentoAberto(false)
      await carregar()
    } finally {
      setSalvandoOrcamento(false)
    }
  }

  async function excluirOrcamento(id: string) {
    await apiDelete('/api/orcamentos', { id })
    setConfirmandoExclusaoOrcamento(null)
    await carregar()
  }

  const visiveis = transacoes.filter((t) => (t.titulo + t.categoria).toLowerCase().includes(busca.toLowerCase()))
  const recorrenciasAtivas = transacoes.filter((t) => t.recorrente)
  const transacoesRealizadas = transacoes.filter((t) => t.data.slice(0, 10) <= hojeBrasilia())

  return (
    <div>
      <PageHeader
        eyebrow="Módulo"
        title="Financeiro"
        subtitle="Entradas, saídas e saldo por categoria."
        action={<Button variant="gradient" onClick={abrirCriar}>+ Novo lançamento</Button>}
      />

      <div className="flex justify-between items-center mb-2.5">
        <div className="text-[11.5px] font-bold uppercase tracking-wide text-muted-foreground">Contas</div>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-4">
        {TIPOS_CONTA.filter((t) => t.id !== 'poupanca' || contas.some((c) => c.tipo === 'poupanca')).map((tipo) => {
          const Icon = tipo.icon
          const contasDoTipo = contas.filter((c) => c.tipo === tipo.id)
          const totalTipo = contasDoTipo.reduce((s, c) => s + saldoDaConta(c), 0)
          return (
            <Card key={tipo.id} className="flex flex-col">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-[10px] flex items-center justify-center flex-shrink-0" style={{ background: tipo.bg, color: tipo.color }}>
                    <Icon size={16} />
                  </div>
                  <CardTitle className="mb-0">{tipo.label}</CardTitle>
                </div>
                <button onClick={() => abrirCriarConta(tipo.id)} className="text-muted-foreground hover:text-primary flex-shrink-0" title={`Nova conta ${tipo.label}`}>
                  <Plus size={16} />
                </button>
              </div>

              <div className="text-2xl font-extrabold mb-2" style={{ color: totalTipo < 0 ? 'var(--destructive)' : undefined }}>
                R$ {totalTipo.toLocaleString('pt-BR')}
              </div>

              {contasDoTipo.length === 0 && (
                <div className="text-xs text-muted-foreground py-1">Nenhuma conta desse tipo ainda.</div>
              )}
              {contasDoTipo.map((c) => {
                const saldoAtual = saldoDaConta(c)
                return (
                  <button
                    key={c.id}
                    onClick={() => navigate(`/financeiro/conta/${c.id}`)}
                    className="flex items-center justify-between py-1.5 border-t border-border first:border-t-0 text-left hover:opacity-70"
                  >
                    <div className="min-w-0">
                      <div className="text-[12.5px] font-semibold truncate">{c.nome}</div>
                      {c.tipo === 'cartao' && c.limite != null && (
                        <div className="text-[10.5px] text-muted-foreground">fecha {c.fechamento_dia ?? '—'} · limite R$ {Number(c.limite).toLocaleString('pt-BR')}</div>
                      )}
                    </div>
                    <div className="text-[12.5px] font-bold flex-shrink-0" style={{ color: saldoAtual < 0 ? 'var(--destructive)' : undefined }}>
                      R$ {saldoAtual.toLocaleString('pt-BR')}
                    </div>
                  </button>
                )
              })}
            </Card>
          )
        })}
      </div>

      <Card className="mb-4">
        <CardTitle>Recorrências fixas</CardTitle>
        {recorrenciasAtivas.length === 0 && (
          <div className="text-sm text-muted-foreground py-4">Nenhuma recorrência cadastrada ainda. Marca "Recorrente" ao criar um lançamento.</div>
        )}
        {recorrenciasAtivas.map((r) => (
          <div key={r.id} className="flex items-center gap-3 py-2.5 border-b border-border last:border-none">
            <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: 'var(--secondary)' }} />
            <div className="flex-1">
              <div className="text-[13.5px] font-semibold">{r.titulo}</div>
              <div className="text-[11.5px] text-muted-foreground">a cada {r.recorrencia_intervalo_dias} dias · próxima em {formatarDataBR(r.data)}</div>
            </div>
            <div className="text-[13px] font-bold">R$ {Math.abs(Number(r.valor)).toLocaleString('pt-BR')}</div>
          </div>
        ))}
      </Card>

      <div className="grid grid-cols-3 gap-4 mb-4">
        <Card>
          <CardTitle>Receitas do mês</CardTitle>
          <div className="text-2xl font-extrabold text-[#10B981]">
            R$ {transacoesRealizadas.filter((t) => Number(t.valor) > 0).reduce((s, t) => s + Number(t.valor), 0).toLocaleString('pt-BR')}
          </div>
        </Card>
        <Card>
          <CardTitle>Despesas do mês</CardTitle>
          <div className="text-2xl font-extrabold text-destructive">
            R$ {Math.abs(transacoesRealizadas.filter((t) => Number(t.valor) < 0).reduce((s, t) => s + Number(t.valor), 0)).toLocaleString('pt-BR')}
          </div>
        </Card>
        <Card>
          <CardTitle>Saldo do período</CardTitle>
          <div className="text-2xl font-extrabold">
            R$ {transacoesRealizadas.reduce((s, t) => s + Number(t.valor), 0).toLocaleString('pt-BR')}
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-[2fr_1fr] gap-4">
        <Card>
          <CardTitle>Transações</CardTitle>
          <div className="flex gap-2 flex-wrap items-center mb-3.5">
            <div className="flex items-center gap-2 bg-muted border border-border rounded-lg px-3 py-2 flex-1 min-w-[160px]">
              <Search size={14} className="text-muted-foreground" />
              <input
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                placeholder="Buscar transação..."
                className="bg-transparent outline-none text-[13px] flex-1"
              />
            </div>
            {['Todas', 'Este mês'].map((f) => (
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
          {!carregando && visiveis.length === 0 && (
            <div className="text-sm text-muted-foreground py-4">Nenhum lançamento ainda.</div>
          )}
          {visiveis.map((t) => {
            const conta = contas.find((c) => c.id === t.conta_id)
            const agendado = t.data.slice(0, 10) > hojeBrasilia()
            return (
              <div key={t.id}>
                <div className="flex items-center gap-3 py-2.5 border-b border-border last:border-none group">
                  <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: agendado ? 'var(--muted-foreground)' : Number(t.valor) < 0 ? 'var(--destructive)' : '#10B981' }} />
                  <div className="flex-1">
                    <div className="flex items-center gap-1.5">
                      <div className="text-[13.5px] font-semibold">{t.titulo}</div>
                      {agendado && (
                        <span className="text-[9.5px] font-bold px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground uppercase tracking-wide">agendado</span>
                      )}
                    </div>
                    <div className="text-[11.5px] text-muted-foreground">
                      {t.categoria}{conta ? ` · ${conta.nome}` : ''}{t.descricao ? ` · ${t.descricao}` : ''}{agendado ? ` · ${formatarDataBR(t.data)}` : ''}
                    </div>
                  </div>
                  <div className="text-[13px] font-bold" style={{ color: agendado ? 'var(--muted-foreground)' : Number(t.valor) < 0 ? 'var(--destructive)' : '#10B981' }}>
                    {Number(t.valor) < 0 ? '− ' : '+ '}R$ {Math.abs(Number(t.valor))}
                  </div>
                  <button onClick={() => abrirEditar(t)} className="text-muted-foreground hover:text-primary flex-shrink-0"><Pencil size={14} /></button>
                  <button onClick={() => setConfirmandoExclusao(t.id)} className="text-muted-foreground hover:text-destructive flex-shrink-0"><Trash2 size={14} /></button>
                </div>
                {confirmandoExclusao === t.id && (
                  <DeleteConfirmBar label={`Excluir "${t.titulo}"?`} onCancel={() => setConfirmandoExclusao(null)} onConfirm={() => excluir(t.id)} />
                )}
              </div>
            )
          })}
        </Card>

        <Card>
          <div className="flex justify-between items-center mb-1">
            <CardTitle className="mb-0">Orçamento por categoria</CardTitle>
            <button onClick={abrirCriarOrcamento} className="text-[12px] font-bold text-primary">+ Definir</button>
          </div>
          {orcamentos.length === 0 && (
            <div className="text-sm text-muted-foreground py-4">Nenhum orçamento definido esse mês ainda.</div>
          )}
          {orcamentos.map((o) => {
            const mesAtual = hojeBrasilia().slice(0, 7)
            const gasto = Math.abs(
              transacoesRealizadas
                .filter((t) => t.categoria === o.categoria && Number(t.valor) < 0 && t.data.slice(0, 7) === mesAtual)
                .reduce((s, t) => s + Number(t.valor), 0)
            )
            const limite = Number(o.limite)
            const estourado = gasto > limite
            return (
              <div key={o.id} className="mb-3.5 last:mb-0 group">
                <div className="flex justify-between text-[12.5px] font-semibold">
                  <span>{o.categoria}</span>
                  <div className="flex items-center gap-2">
                    <span className={estourado ? 'text-destructive' : 'text-muted-foreground'}>
                      R$ {gasto.toLocaleString('pt-BR')} / {limite.toLocaleString('pt-BR')}
                    </span>
                    <button onClick={() => abrirEditarOrcamento(o)} className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-primary"><Pencil size={12} /></button>
                    <button onClick={() => setConfirmandoExclusaoOrcamento(o.id)} className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive"><Trash2 size={12} /></button>
                  </div>
                </div>
                <ProgressBar percent={(gasto / limite) * 100} color={estourado ? 'var(--destructive)' : 'var(--primary)'} />
                {confirmandoExclusaoOrcamento === o.id && (
                  <div className="mt-1.5">
                    <DeleteConfirmBar label={`Remover orçamento de "${o.categoria}"?`} onCancel={() => setConfirmandoExclusaoOrcamento(null)} onConfirm={() => excluirOrcamento(o.id)} />
                  </div>
                )}
              </div>
            )
          })}
        </Card>
      </div>

      <Modal open={modalOrcamentoAberto} title={editandoOrcamento ? 'Editar orçamento' : 'Definir orçamento'} onClose={() => setModalOrcamentoAberto(false)}>
        <form onSubmit={salvarOrcamento} className="flex flex-col gap-3">
          <select
            required
            disabled={!!editandoOrcamento}
            value={formOrcamento.categoria}
            onChange={(e) => setFormOrcamento({ ...formOrcamento, categoria: e.target.value })}
            className="bg-muted border border-border rounded-lg px-3 py-2.5 text-sm outline-none focus:border-primary disabled:opacity-60"
          >
            <option value="" disabled>Categoria...</option>
            {categoriasDespesa.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
          <input
            required
            type="number"
            step="0.01"
            min="0"
            placeholder="Limite mensal"
            value={formOrcamento.limite}
            onChange={(e) => setFormOrcamento({ ...formOrcamento, limite: e.target.value })}
            className="bg-muted border border-border rounded-lg px-3 py-2.5 text-sm outline-none focus:border-primary"
          />
          <p className="text-xs text-muted-foreground">Vale pro mês atual ({hojeBrasilia().slice(0, 7)}). Definir de novo no próximo mês.</p>
          <Button type="submit" disabled={salvandoOrcamento}>
            {salvandoOrcamento ? 'Salvando...' : editandoOrcamento ? 'Salvar alterações' : 'Definir orçamento'}
          </Button>
        </form>
      </Modal>

      <Modal open={modalAberto} title={editando ? 'Editar lançamento' : 'Novo lançamento'} onClose={() => setModalAberto(false)}>
        <form onSubmit={salvar} className="flex flex-col gap-3">
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setForm({ ...form, tipo: 'despesa', categoria: '' })}
              className={`flex-1 py-2 rounded-lg text-sm font-semibold border transition-colors ${
                form.tipo === 'despesa' ? 'bg-[#FEF2F2] border-destructive text-destructive' : 'border-border text-muted-foreground'
              }`}
            >
              Gasto
            </button>
            <button
              type="button"
              onClick={() => setForm({ ...form, tipo: 'receita', categoria: '' })}
              className={`flex-1 py-2 rounded-lg text-sm font-semibold border transition-colors ${
                form.tipo === 'receita' ? 'bg-[#ECFDF5] border-[#10B981] text-[#10B981]' : 'border-border text-muted-foreground'
              }`}
            >
              Receita
            </button>
          </div>

          <input
            required
            placeholder="Título (ex: Mercado)"
            value={form.titulo}
            onChange={(e) => setForm({ ...form, titulo: e.target.value })}
            className="bg-muted border border-border rounded-lg px-3 py-2.5 text-sm outline-none focus:border-primary"
          />

          <select
            required
            value={form.categoria}
            onChange={(e) => setForm({ ...form, categoria: e.target.value })}
            className="bg-muted border border-border rounded-lg px-3 py-2.5 text-sm outline-none focus:border-primary"
          >
            <option value="" disabled>Categoria...</option>
            {(form.tipo === 'despesa' ? categoriasDespesa : categoriasReceita).map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>

          <select
            value={form.conta_id}
            onChange={(e) => setForm({ ...form, conta_id: e.target.value })}
            className="bg-muted border border-border rounded-lg px-3 py-2.5 text-sm outline-none focus:border-primary"
          >
            <option value="">Sem conta associada</option>
            {contas.map((c) => <option key={c.id} value={c.id}>{c.nome}</option>)}
          </select>

          <textarea
            placeholder="Descrição (opcional)"
            value={form.descricao}
            onChange={(e) => setForm({ ...form, descricao: e.target.value })}
            rows={2}
            className="bg-muted border border-border rounded-lg px-3 py-2.5 text-sm outline-none focus:border-primary resize-none"
          />

          <input
            required
            type="number"
            step="0.01"
            min="0"
            placeholder="Valor"
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
          <label className="flex items-center gap-2 text-sm font-medium">
            <input type="checkbox" checked={form.recorrente} onChange={(e) => setForm({ ...form, recorrente: e.target.checked })} />
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
              <span className="text-xs text-muted-foreground">dias</span>
            </div>
          )}
          {erro && <div className="text-xs text-destructive font-semibold break-words">{erro}</div>}
          <Button type="submit" disabled={salvando}>
            {salvando ? 'Salvando...' : editando ? 'Salvar alterações' : 'Criar lançamento'}
          </Button>
        </form>
      </Modal>

      <Modal open={modalContaAberto} title="Nova conta" onClose={() => setModalContaAberto(false)}>
        <form onSubmit={salvarConta} className="flex flex-col gap-3">
          <input
            required
            placeholder="Nome (ex: Nubank, Carteira)"
            value={formConta.nome}
            onChange={(e) => setFormConta({ ...formConta, nome: e.target.value })}
            className="bg-muted border border-border rounded-lg px-3 py-2.5 text-sm outline-none focus:border-primary"
          />
          <select
            value={formConta.tipo}
            onChange={(e) => setFormConta({ ...formConta, tipo: e.target.value })}
            className="bg-muted border border-border rounded-lg px-3 py-2.5 text-sm outline-none focus:border-primary"
          >
            {TIPOS_CONTA.map((t) => <option key={t.id} value={t.id}>{t.label}</option>)}
          </select>
          <input
            type="number"
            step="0.01"
            placeholder="Saldo inicial"
            value={formConta.saldo}
            onChange={(e) => setFormConta({ ...formConta, saldo: e.target.value })}
            className="bg-muted border border-border rounded-lg px-3 py-2.5 text-sm outline-none focus:border-primary"
          />
          {formConta.tipo === 'cartao' && (
            <>
              <input
                type="number"
                step="0.01"
                placeholder="Limite do cartão (opcional)"
                value={formConta.limite}
                onChange={(e) => setFormConta({ ...formConta, limite: e.target.value })}
                className="bg-muted border border-border rounded-lg px-3 py-2.5 text-sm outline-none focus:border-primary"
              />
              <input
                type="number"
                min="1"
                max="31"
                placeholder="Dia de fechamento da fatura (opcional)"
                value={formConta.fechamento_dia}
                onChange={(e) => setFormConta({ ...formConta, fechamento_dia: e.target.value })}
                className="bg-muted border border-border rounded-lg px-3 py-2.5 text-sm outline-none focus:border-primary"
              />
            </>
          )}
          <Button type="submit" disabled={salvandoConta}>
            {salvandoConta ? 'Salvando...' : 'Criar conta'}
          </Button>
        </form>
      </Modal>
    </div>
  )
}

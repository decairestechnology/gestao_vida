import { useEffect, useState, type FormEvent } from 'react'
import { Landmark, CreditCard, Wallet, Search, Pencil, Trash2 } from 'lucide-react'
import { PageHeader } from '../components/layout/PageHeader'
import { Card, CardTitle } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { ProgressBar } from '../components/ui/ProgressBar'
import { Modal } from '../components/ui/Modal'
import { DeleteConfirmBar } from '../components/ui/DeleteConfirmBar'
import { apiGet, apiPost, apiPatch, apiDelete } from '../lib/api'
import { contas, orcamentoCategorias } from '../data/mockData'
import { CATEGORIAS_DESPESA, CATEGORIAS_RECEITA } from '../data/categorias'

const CONTA_ICONS = { corrente: Landmark, cartao: CreditCard, dinheiro: Wallet }
const CONTA_STYLE = {
  corrente: { bg: 'var(--accent)', color: 'var(--primary)' },
  cartao: { bg: '#F5F3FF', color: 'var(--secondary)' },
  dinheiro: { bg: '#ECFDF5', color: '#10B981' },
}

interface Transacao {
  id: string
  titulo: string
  categoria: string
  descricao?: string | null
  valor: string | number
  data: string
  recorrente?: boolean
  recorrencia_intervalo_dias?: number
}

const CAMPOS_VAZIOS = {
  titulo: '',
  categoria: '',
  descricao: '',
  tipo: 'despesa' as 'despesa' | 'receita',
  valor: '',
  data: new Date().toISOString().slice(0, 10),
  recorrente: false,
  intervalo: '30',
}

export function Financeiro() {
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

  async function carregar() {
    setCarregando(true)
    try {
      const rows = await apiGet<Transacao[]>('/api/transacoes')
      setTransacoes(rows)
    } catch {
      setTransacoes([])
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
    setModalAberto(true)
  }

  function abrirEditar(t: Transacao) {
    setEditando(t)
    setForm({
      titulo: t.titulo,
      categoria: t.categoria,
      descricao: t.descricao ?? '',
      tipo: Number(t.valor) < 0 ? 'despesa' : 'receita',
      valor: String(Math.abs(Number(t.valor))),
      data: t.data.slice(0, 10),
      recorrente: t.recorrente ?? false,
      intervalo: String(t.recorrencia_intervalo_dias ?? 30),
    })
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

  const visiveis = transacoes.filter((t) => (t.titulo + t.categoria).toLowerCase().includes(busca.toLowerCase()))
  const recorrenciasAtivas = transacoes.filter((t) => t.recorrente)

  return (
    <div>
      <PageHeader
        eyebrow="Módulo"
        title="Financeiro"
        subtitle="Entradas, saídas e saldo por categoria."
        action={<Button variant="gradient" onClick={abrirCriar}>+ Novo lançamento</Button>}
      />

      <div className="grid grid-cols-3 gap-4 mb-4">
        {contas.map((c) => {
          const Icon = CONTA_ICONS[c.id as keyof typeof CONTA_ICONS]
          const style = CONTA_STYLE[c.id as keyof typeof CONTA_STYLE]
          return (
            <Card key={c.id} className="flex gap-3 items-start">
              <div
                className="w-[38px] h-[38px] rounded-[10px] flex items-center justify-center flex-shrink-0"
                style={{ background: style.bg, color: style.color }}
              >
                <Icon size={18} />
              </div>
              <div>
                <CardTitle className="mb-0.5">{c.nome}</CardTitle>
                <div className="text-xl font-extrabold">R$ {c.saldo.toLocaleString('pt-BR')}</div>
                {c.sub && <div className="text-[11.5px] text-muted-foreground mt-0.5">{c.sub}</div>}
              </div>
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
              <div className="text-[11.5px] text-muted-foreground">a cada {r.recorrencia_intervalo_dias} dias · próxima em {new Date(r.data).toLocaleDateString('pt-BR')}</div>
            </div>
            <div className="text-[13px] font-bold">R$ {Math.abs(Number(r.valor)).toLocaleString('pt-BR')}</div>
          </div>
        ))}
      </Card>

      <div className="grid grid-cols-3 gap-4 mb-4">
        <Card>
          <CardTitle>Receitas do mês</CardTitle>
          <div className="text-2xl font-extrabold text-[#10B981]">
            R$ {transacoes.filter((t) => Number(t.valor) > 0).reduce((s, t) => s + Number(t.valor), 0).toLocaleString('pt-BR')}
          </div>
        </Card>
        <Card>
          <CardTitle>Despesas do mês</CardTitle>
          <div className="text-2xl font-extrabold text-destructive">
            R$ {Math.abs(transacoes.filter((t) => Number(t.valor) < 0).reduce((s, t) => s + Number(t.valor), 0)).toLocaleString('pt-BR')}
          </div>
        </Card>
        <Card>
          <CardTitle>Saldo do período</CardTitle>
          <div className="text-2xl font-extrabold">
            R$ {transacoes.reduce((s, t) => s + Number(t.valor), 0).toLocaleString('pt-BR')}
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
          {visiveis.map((t) => (
            <div key={t.id}>
              <div className="flex items-center gap-3 py-2.5 border-b border-border last:border-none group">
                <span
                  className="w-2 h-2 rounded-full flex-shrink-0"
                  style={{ background: Number(t.valor) < 0 ? 'var(--destructive)' : '#10B981' }}
                />
                <div className="flex-1">
                  <div className="text-[13.5px] font-semibold">{t.titulo}</div>
                  <div className="text-[11.5px] text-muted-foreground">
                    {t.categoria}{t.descricao ? ` · ${t.descricao}` : ''}
                  </div>
                </div>
                <div className="text-[13px] font-bold" style={{ color: Number(t.valor) < 0 ? 'var(--destructive)' : '#10B981' }}>
                  {Number(t.valor) < 0 ? '− ' : '+ '}R$ {Math.abs(Number(t.valor))}
                </div>
                <button onClick={() => abrirEditar(t)} className="text-muted-foreground hover:text-primary flex-shrink-0">
                  <Pencil size={14} />
                </button>
                <button
                  onClick={() => setConfirmandoExclusao(t.id)}
                  className="text-muted-foreground hover:text-destructive flex-shrink-0"
                >
                  <Trash2 size={14} />
                </button>
              </div>
              {confirmandoExclusao === t.id && (
                <DeleteConfirmBar
                  label={`Excluir "${t.titulo}"?`}
                  onCancel={() => setConfirmandoExclusao(null)}
                  onConfirm={() => excluir(t.id)}
                />
              )}
            </div>
          ))}
        </Card>

        <Card>
          <CardTitle>Orçamento por categoria</CardTitle>
          {orcamentoCategorias.length === 0 && (
            <div className="text-sm text-muted-foreground py-4">Nenhum orçamento definido ainda.</div>
          )}
          {orcamentoCategorias.map((c) => (
            <div key={c.categoria} className="mb-3.5 last:mb-0">
              <div className="flex justify-between text-[12.5px] font-semibold">
                <span>{c.categoria}</span>
                <span className="text-muted-foreground">R$ {c.gasto} / {c.limite}</span>
              </div>
              <ProgressBar percent={(c.gasto / c.limite) * 100} color={c.cor} />
            </div>
          ))}
        </Card>
      </div>

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
            {(form.tipo === 'despesa' ? CATEGORIAS_DESPESA : CATEGORIAS_RECEITA).map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
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
              <span className="text-xs text-muted-foreground">dias</span>
            </div>
          )}
          {erro && <div className="text-xs text-destructive font-semibold break-words">{erro}</div>}
          <Button type="submit" disabled={salvando}>
            {salvando ? 'Salvando...' : editando ? 'Salvar alterações' : 'Criar lançamento'}
          </Button>
        </form>
      </Modal>
    </div>
  )
}

import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AlertTriangle, ChevronRight } from 'lucide-react'
import { PageHeader } from '../components/layout/PageHeader'
import { Card, CardTitle } from '../components/ui/Card'
import { Badge } from '../components/ui/Badge'
import { apiGet, apiPatch } from '../lib/api'

interface Transacao { id: string; titulo: string; categoria: string; valor: string | number; data: string }
interface Tarefa { id: string; titulo: string; status: string; prioridade: 'alta' | 'media' | 'baixa'; vencimento: string | null; parent_id: string | null }
interface Habito { id: string; nome: string; checks: string[] }
interface Ativo { valor_atual: string | number }

const PRIORIDADE_BADGE = { alta: 'error', media: 'warning', baixa: 'neutral' } as const
const hoje = new Date().toISOString().slice(0, 10)

function calcularStreak(checks: string[]): number {
  const set = new Set(checks)
  let streak = 0
  const cursor = new Date()
  while (set.has(cursor.toISOString().slice(0, 10))) {
    streak++
    cursor.setDate(cursor.getDate() - 1)
  }
  return streak
}

export function Dashboard() {
  const navigate = useNavigate()
  const [transacoes, setTransacoes] = useState<Transacao[]>([])
  const [tarefas, setTarefas] = useState<Tarefa[]>([])
  const [habitos, setHabitos] = useState<Habito[]>([])
  const [ativos, setAtivos] = useState<Ativo[]>([])
  const [carregando, setCarregando] = useState(true)

  useEffect(() => {
    Promise.all([
      apiGet<Transacao[]>('/api/transacoes').catch(() => []),
      apiGet<Tarefa[]>('/api/tarefas').catch(() => []),
      apiGet<Habito[]>('/api/habitos').catch(() => []),
      apiGet<{ ativos: Ativo[] }>('/api/investimentos').catch(() => ({ ativos: [] })),
    ]).then(([t, tf, h, inv]) => {
      setTransacoes(t)
      setTarefas(tf)
      setHabitos(h)
      setAtivos(inv.ativos)
      setCarregando(false)
    })
  }, [])

  async function concluirTarefa(t: Tarefa) {
    await apiPatch('/api/tarefas', { id: t.id, status: 'concluida' })
    setTarefas((prev) => prev.map((x) => (x.id === t.id ? { ...x, status: 'concluida' } : x)))
  }

  const mesAtual = hoje.slice(0, 7)
  const saldoMes = transacoes.filter((t) => t.data.slice(0, 7) === mesAtual).reduce((s, t) => s + Number(t.valor), 0)
  const saldoTotal = transacoes.reduce((s, t) => s + Number(t.valor), 0)
  const patrimonioInvestido = ativos.reduce((s, a) => s + Number(a.valor_atual), 0)
  const patrimonioTotal = saldoTotal + patrimonioInvestido

  const tarefasPrincipais = tarefas.filter((t) => !t.parent_id)
  const tarefasHojeLista = tarefasPrincipais.filter((t) => t.status !== 'concluida' && t.vencimento && t.vencimento.slice(0, 10) <= hoje)
  const tarefasConcluidasHoje = tarefasPrincipais.filter((t) => t.status === 'concluida' && t.vencimento?.slice(0, 10) === hoje).length
  const totalTarefasHoje = tarefasHojeLista.length + tarefasConcluidasHoje

  const maiorStreak = habitos.reduce((max, h) => Math.max(max, calcularStreak(h.checks)), 0)
  const habitoEmRisco = habitos.find((h) => calcularStreak(h.checks) > 0 && !h.checks.includes(hoje))

  const ultimosLancamentos = [...transacoes].sort((a, b) => b.data.localeCompare(a.data)).slice(0, 4)

  const dataFormatada = new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long' })

  return (
    <div>
      <PageHeader eyebrow={`Hoje · ${dataFormatada}`} title="Visão geral" subtitle="Resumo do seu dia em um lugar só." />

      {habitoEmRisco && (
        <div className="flex items-center gap-3 bg-[#FEF2F2] border border-[#FECACA] rounded-xl px-4 py-3 mb-4">
          <AlertTriangle size={20} className="text-destructive flex-shrink-0" />
          <div className="flex-1">
            <div className="font-semibold text-[#991B1B]">Streak de "{habitoEmRisco.nome}" em risco</div>
            <div className="text-xs text-[#991B1B]/80">ainda não marcado hoje · quebra à meia-noite</div>
          </div>
          <button onClick={() => navigate('/habitos')}>
            <Badge variant="error" className="cursor-pointer flex items-center gap-1">ver hábitos <ChevronRight size={11} /></Badge>
          </button>
        </div>
      )}

      <div className="grid grid-cols-4 gap-4 mb-4">
        <Card>
          <CardTitle>Saldo do mês</CardTitle>
          <div className="text-2xl font-extrabold" style={{ color: saldoMes < 0 ? 'var(--destructive)' : undefined }}>
            R$ {saldoMes.toLocaleString('pt-BR')}
          </div>
        </Card>
        <Card>
          <CardTitle>Patrimônio total</CardTitle>
          <div className="text-2xl font-extrabold">R$ {patrimonioTotal.toLocaleString('pt-BR')}</div>
          <div className="text-xs font-semibold text-muted-foreground mt-1">caixa + investido</div>
        </Card>
        <Card>
          <CardTitle>Tarefas hoje</CardTitle>
          <div className="text-2xl font-extrabold">{tarefasConcluidasHoje} / {totalTarefasHoje}</div>
        </Card>
        <Card>
          <CardTitle>Streak de hábitos</CardTitle>
          <div className="text-2xl font-extrabold">{maiorStreak} dias</div>
        </Card>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Card>
          <CardTitle>Tarefas de hoje</CardTitle>
          {carregando && <div className="text-sm text-muted-foreground py-4">Carregando...</div>}
          {!carregando && tarefasHojeLista.length === 0 && (
            <div className="text-sm text-muted-foreground py-4">Nenhuma tarefa vencendo hoje.</div>
          )}
          {tarefasHojeLista.map((t) => (
            <div key={t.id} className="flex items-center gap-3 py-2.5 border-b border-border last:border-none">
              <button onClick={() => concluirTarefa(t)}>
                <div className="w-[17px] h-[17px] rounded-[5px] border-[1.5px] border-border" />
              </button>
              <div className="flex-1">
                <div className="text-[13.5px] font-semibold">{t.titulo}</div>
              </div>
              <Badge variant={PRIORIDADE_BADGE[t.prioridade]}>{t.prioridade}</Badge>
            </div>
          ))}
        </Card>

        <Card>
          <CardTitle>Últimos lançamentos</CardTitle>
          {!carregando && ultimosLancamentos.length === 0 && (
            <div className="text-sm text-muted-foreground py-4">Nenhum lançamento registrado ainda.</div>
          )}
          {ultimosLancamentos.map((l) => (
            <div key={l.id} className="flex items-center gap-3 py-2.5 border-b border-border last:border-none">
              <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: Number(l.valor) < 0 ? 'var(--destructive)' : '#10B981' }} />
              <div className="flex-1">
                <div className="text-[13.5px] font-semibold">{l.titulo}</div>
                <div className="text-[11.5px] text-muted-foreground">{l.categoria}</div>
              </div>
              <div className="text-[13px] font-bold" style={{ color: Number(l.valor) < 0 ? 'var(--destructive)' : '#10B981' }}>
                {Number(l.valor) < 0 ? '− ' : '+ '}R$ {Math.abs(Number(l.valor))}
              </div>
            </div>
          ))}
        </Card>
      </div>
    </div>
  )
}

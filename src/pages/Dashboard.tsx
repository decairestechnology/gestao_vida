import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AlertTriangle, ChevronRight, Pin } from 'lucide-react'
import { PageHeader } from '../components/layout/PageHeader'
import { Card, CardTitle } from '../components/ui/Card'
import { Badge } from '../components/ui/Badge'
import { ProgressBar } from '../components/ui/ProgressBar'
import { apiGet, apiPatch } from '../lib/api'
import { hojeBrasilia, deslocarDias } from '../lib/date'
import type { DashboardData } from '../types/dashboard'

const PRIORIDADE_BADGE = { alta: 'error', media: 'warning', baixa: 'neutral' } as const
const CORES_META = ['var(--primary)', 'var(--secondary)', '#F59E0B']
const hoje = hojeBrasilia()

function calcularStreak(checks: string[]): number {
  const set = new Set(checks)
  let streak = 0
  let cursor = hoje
  while (set.has(cursor)) {
    streak++
    cursor = deslocarDias(cursor, -1)
  }
  return streak
}

export function Dashboard() {
  const navigate = useNavigate()
  const [data, setData] = useState<DashboardData | null>(null)
  const [carregando, setCarregando] = useState(true)

  useEffect(() => {
    apiGet<DashboardData>('/api/dashboard')
      .then(setData)
      .catch(() => setData({ transacoes: [], tarefas: [], habitos: [], investimentos: { ativos: [], aportes: [] }, notas: [], metas: [] }))
      .finally(() => setCarregando(false))
  }, [])

  async function concluirTarefa(id: string) {
    await apiPatch('/api/tarefas', { id, status: 'concluida' })
    setData((prev) => prev && { ...prev, tarefas: prev.tarefas.map((t) => (t.id === id ? { ...t, status: 'concluida' } : t)) })
  }

  const transacoes = data?.transacoes ?? []
  const tarefas = data?.tarefas ?? []
  const habitos = data?.habitos ?? []
  const ativos = data?.investimentos.ativos ?? []
  const notas = data?.notas ?? []
  const metas = data?.metas ?? []

  const mesAtual = hoje.slice(0, 7)
  const saldoMes = transacoes.filter((t) => t.data.slice(0, 7) === mesAtual && t.data.slice(0, 10) <= hoje).reduce((s, t) => s + Number(t.valor), 0)
  const saldoTotal = transacoes.filter((t) => t.data.slice(0, 10) <= hoje).reduce((s, t) => s + Number(t.valor), 0)
  const patrimonioInvestido = ativos.reduce((s, a) => s + Number(a.valor_atual), 0)
  const patrimonioTotal = saldoTotal + patrimonioInvestido

  const tarefasPrincipais = tarefas.filter((t) => !t.parent_id)
  const tarefasHojeLista = tarefasPrincipais.filter((t) => t.status !== 'concluida' && t.vencimento && t.vencimento.slice(0, 10) <= hoje)
  const tarefasConcluidasHoje = tarefasPrincipais.filter((t) => t.status === 'concluida' && t.vencimento?.slice(0, 10) === hoje).length
  const totalTarefasHoje = tarefasHojeLista.length + tarefasConcluidasHoje
  const tarefasPendentesTotal = tarefasPrincipais.filter((t) => t.status !== 'concluida').length

  const maiorStreak = habitos.reduce((max, h) => Math.max(max, calcularStreak(h.checks)), 0)
  const habitoEmRisco = habitos.find((h) => calcularStreak(h.checks) > 0 && !h.checks.includes(hoje))
  const habitosFeitosHoje = habitos.filter((h) => h.checks.includes(hoje)).length

  const ultimosLancamentos = [...transacoes].sort((a, b) => b.data.localeCompare(a.data)).slice(0, 4)
  const notasFixadas = notas.filter((n) => n.pinned).slice(0, 3)
  const metasAndamento = metas.filter((m) => !m.concluida).slice(0, 3)

  const dataFormatada = new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long', timeZone: 'America/Sao_Paulo' })

  return (
    <div>
      <PageHeader eyebrow={`Hoje · ${dataFormatada}`} title="Visão geral" subtitle="Resumo de tudo o que você tem no sistema." />

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
          {tarefasPendentesTotal > totalTarefasHoje && (
            <div className="text-xs font-semibold text-muted-foreground mt-1">{tarefasPendentesTotal} pendentes no total</div>
          )}
        </Card>
        <Card>
          <CardTitle>Streak de hábitos</CardTitle>
          <div className="text-2xl font-extrabold">{maiorStreak} dias</div>
          <div className="text-xs font-semibold text-muted-foreground mt-1">{habitosFeitosHoje}/{habitos.length} feitos hoje</div>
        </Card>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4">
        <Card>
          <CardTitle>Tarefas de hoje</CardTitle>
          {carregando && <div className="text-sm text-muted-foreground py-4">Carregando...</div>}
          {!carregando && tarefasHojeLista.length === 0 && (
            <div className="text-sm text-muted-foreground py-4">Nenhuma tarefa vencendo hoje.</div>
          )}
          {tarefasHojeLista.map((t) => (
            <div key={t.id} className="flex items-center gap-3 py-2.5 border-b border-border last:border-none">
              <button onClick={() => concluirTarefa(t.id)}>
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

      <div className="grid grid-cols-3 gap-4">
        <Card>
          <div className="flex justify-between items-center mb-2.5">
            <CardTitle className="mb-0">Metas em andamento</CardTitle>
            <button onClick={() => navigate('/metas')} className="text-muted-foreground hover:text-primary flex-shrink-0"><ChevronRight size={14} /></button>
          </div>
          {!carregando && metasAndamento.length === 0 && (
            <div className="text-sm text-muted-foreground py-3">Nenhuma meta em andamento.</div>
          )}
          {metasAndamento.map((m, i) => (
            <div key={m.id} className="mb-3 last:mb-0">
              <div className="flex justify-between text-[12.5px] font-semibold">
                <span className="truncate">{m.nome}</span>
              </div>
              <ProgressBar percent={(Number(m.valor_atual) / Number(m.valor_alvo)) * 100} color={CORES_META[i % CORES_META.length]} />
            </div>
          ))}
        </Card>

        <Card>
          <div className="flex justify-between items-center mb-2.5">
            <CardTitle className="mb-0">Notas fixadas</CardTitle>
            <button onClick={() => navigate('/notas')} className="text-muted-foreground hover:text-primary flex-shrink-0"><ChevronRight size={14} /></button>
          </div>
          {!carregando && notasFixadas.length === 0 && (
            <div className="text-sm text-muted-foreground py-3">Nenhuma nota fixada.</div>
          )}
          {notasFixadas.map((n) => (
            <div key={n.id} className="flex items-center gap-2 py-1.5 text-[13px] font-medium">
              <Pin size={11} className="text-primary flex-shrink-0" />
              <span className="truncate">{n.titulo}</span>
            </div>
          ))}
        </Card>

        <Card>
          <div className="flex justify-between items-center mb-2.5">
            <CardTitle className="mb-0">Patrimônio investido</CardTitle>
            <button onClick={() => navigate('/investimentos')} className="text-muted-foreground hover:text-primary flex-shrink-0"><ChevronRight size={14} /></button>
          </div>
          <div className="text-xl font-extrabold">R$ {patrimonioInvestido.toLocaleString('pt-BR')}</div>
          <div className="text-xs font-semibold text-muted-foreground mt-1">{ativos.length} ativo{ativos.length !== 1 ? 's' : ''} cadastrado{ativos.length !== 1 ? 's' : ''}</div>
        </Card>
      </div>
    </div>
  )
}

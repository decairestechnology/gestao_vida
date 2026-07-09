import { useEffect, useState } from 'react'
import { Download } from 'lucide-react'
import { BarChart, Bar, ResponsiveContainer, XAxis, Tooltip, Cell } from 'recharts'
import { PageHeader } from '../components/layout/PageHeader'
import { Card, CardTitle } from '../components/ui/Card'
import { ProgressBar } from '../components/ui/ProgressBar'
import { apiGet } from '../lib/api'
import type { DashboardData } from '../types/dashboard'

const PERIODOS = ['3 meses', '6 meses'] as const
const MESES_LABEL = ['JAN', 'FEV', 'MAR', 'ABR', 'MAI', 'JUN', 'JUL', 'AGO', 'SET', 'OUT', 'NOV', 'DEZ']

export function Relatorios() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [carregando, setCarregando] = useState(true)
  const [periodo, setPeriodo] = useState<typeof PERIODOS[number]>('6 meses')

  useEffect(() => {
    apiGet<DashboardData>('/api/dashboard')
      .then(setData)
      .catch(() => setData({ transacoes: [], tarefas: [], habitos: [], investimentos: { ativos: [], aportes: [] }, notas: [], metas: [] }))
      .finally(() => setCarregando(false))
  }, [])

  const transacoes = data?.transacoes ?? []
  const tarefas = data?.tarefas ?? []
  const habitos = data?.habitos ?? []

  const numMeses = periodo === '3 meses' ? 3 : 6
  const mesesChave: string[] = Array.from({ length: numMeses }, (_, i) => {
    const d = new Date()
    d.setDate(1)
    d.setMonth(d.getMonth() - (numMeses - 1 - i))
    return d.toISOString().slice(0, 7)
  })

  const saldoMensal = mesesChave.map((chave) => {
    const valor = transacoes.filter((t) => t.data.slice(0, 7) === chave).reduce((s, t) => s + Number(t.valor), 0)
    const mes = MESES_LABEL[Number(chave.slice(5, 7)) - 1]
    return { mes, valor }
  })

  const mesAtual = new Date().toISOString().slice(0, 7)
  const gastosMesAtual = transacoes.filter((t) => t.data.slice(0, 7) === mesAtual && Number(t.valor) < 0)
  const totalGastoMes = gastosMesAtual.reduce((s, t) => s + Math.abs(Number(t.valor)), 0)
  const porCategoria = new Map<string, number>()
  gastosMesAtual.forEach((t) => porCategoria.set(t.categoria, (porCategoria.get(t.categoria) ?? 0) + Math.abs(Number(t.valor))))
  const distribuicaoGastos = [...porCategoria.entries()]
    .map(([categoria, valor]) => ({ categoria, pct: totalGastoMes > 0 ? Math.round((valor / totalGastoMes) * 100) : 0 }))
    .sort((a, b) => b.pct - a.pct)

  function calcularAderencia(checks: string[]): number {
    const dias = 14
    let feitos = 0
    const cursor = new Date()
    for (let i = 0; i < dias; i++) {
      if (checks.includes(cursor.toISOString().slice(0, 10))) feitos++
      cursor.setDate(cursor.getDate() - 1)
    }
    return Math.round((feitos / dias) * 100)
  }
  const aderenciaHabitos = habitos.map((h) => ({ nome: h.nome, pct: calcularAderencia(h.checks) }))

  const tarefasPrincipais = tarefas.filter((t) => !t.parent_id)
  const criadasNoMes = tarefasPrincipais.filter((t) => t.created_at.slice(0, 7) === mesAtual).length
  const concluidasNoMes = tarefasPrincipais.filter((t) => t.status === 'concluida' && t.created_at.slice(0, 7) === mesAtual).length
  const taxaConclusao = criadasNoMes === 0 ? null : Math.round((concluidasNoMes / criadasNoMes) * 100)

  function exportarCSV() {
    const linhas = [
      ['data', 'titulo', 'categoria', 'valor'],
      ...transacoes.map((t) => [t.data, t.titulo, t.categoria, String(t.valor)]),
    ]
    const csv = linhas.map((l) => l.join(';')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `transacoes-${mesAtual}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div>
      <PageHeader
        eyebrow="Módulo"
        title="Relatórios"
        subtitle="Como o período selecionado se comportou."
        action={
          <button onClick={exportarCSV} className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold bg-primary text-primary-foreground hover:opacity-90">
            <Download size={14} /> Exportar
          </button>
        }
      />

      <div className="flex gap-2 mb-4">
        {PERIODOS.map((p) => (
          <button
            key={p}
            onClick={() => setPeriodo(p)}
            className={`text-[11.5px] font-semibold px-3 py-1.5 rounded-full border transition-colors ${
              periodo === p ? 'bg-accent text-primary border-primary' : 'bg-muted text-muted-foreground border-border'
            }`}
          >
            {p}
          </button>
        ))}
      </div>

      {carregando && <div className="text-sm text-muted-foreground py-4">Carregando...</div>}

      <div className="grid grid-cols-[2fr_1fr] gap-4 mb-4">
        <Card>
          <CardTitle>Saldo mensal</CardTitle>
          <div style={{ width: '100%', height: 140 }}>
            {!carregando && transacoes.length === 0 ? (
              <div className="h-full flex items-center justify-center text-sm text-muted-foreground">Sem dados suficientes ainda.</div>
            ) : (
              <ResponsiveContainer>
                <BarChart data={saldoMensal}>
                  <XAxis dataKey="mes" tick={{ fontSize: 10.5, fill: 'var(--muted-foreground)' }} axisLine={false} tickLine={false} />
                  <Tooltip formatter={(v: number) => [`R$ ${v.toLocaleString('pt-BR')}`, 'Saldo']} contentStyle={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 12 }} />
                  <Bar dataKey="valor" radius={[4, 4, 0, 0]}>
                    {saldoMensal.map((d, i) => <Cell key={i} fill={d.valor < 0 ? 'var(--destructive)' : 'var(--primary)'} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </Card>
        <Card>
          <CardTitle>Distribuição de gastos — este mês</CardTitle>
          {distribuicaoGastos.length === 0 && <div className="text-sm text-muted-foreground py-4">Nenhum gasto registrado no período.</div>}
          {distribuicaoGastos.map((d) => (
            <div key={d.categoria} className="flex justify-between items-center py-2.5 border-b border-border last:border-none">
              <div className="text-[13.5px] font-semibold">{d.categoria}</div>
              <div className="text-[13px] font-bold">{d.pct}%</div>
            </div>
          ))}
        </Card>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Card>
          <CardTitle>Aderência de hábitos (14 dias)</CardTitle>
          {aderenciaHabitos.length === 0 && <div className="text-sm text-muted-foreground py-4">Sem hábitos cadastrados.</div>}
          {aderenciaHabitos.map((h) => (
            <div key={h.nome} className="mb-3.5 last:mb-0">
              <div className="flex justify-between text-[12.5px] font-semibold">
                <span>{h.nome}</span>
                <span className="text-muted-foreground">{h.pct}%</span>
              </div>
              <ProgressBar percent={h.pct} color="var(--primary)" />
            </div>
          ))}
        </Card>

        <Card>
          <CardTitle>Tarefas — concluídas vs. criadas (este mês)</CardTitle>
          {criadasNoMes === 0 ? (
            <div className="text-sm text-muted-foreground py-4">Nenhuma tarefa criada este mês ainda.</div>
          ) : (
            <>
              <div className="flex items-end gap-7 h-[130px] pt-2.5 justify-center">
                <div className="flex flex-col items-center gap-1.5 w-12">
                  <div className="w-full rounded-t opacity-35" style={{ height: 96, background: 'var(--muted-foreground)' }} />
                  <div className="text-xs font-bold">{criadasNoMes}</div>
                  <div className="text-[10.5px] text-muted-foreground font-bold">MÊS</div>
                </div>
                <div className="flex flex-col items-center gap-1.5 w-12">
                  <div className="w-full rounded-t" style={{ height: Math.max(8, (concluidasNoMes / criadasNoMes) * 96), background: 'var(--primary)' }} />
                  <div className="text-xs font-bold">{concluidasNoMes}</div>
                  <div className="text-[10.5px] text-muted-foreground font-bold">MÊS</div>
                </div>
              </div>
              <div className="flex gap-4 justify-center mt-2 text-[11.5px] text-muted-foreground font-semibold">
                <span><span className="inline-block w-2 h-2 rounded-full mr-1.5" style={{ background: 'var(--muted-foreground)' }} />criadas: {criadasNoMes}</span>
                <span><span className="inline-block w-2 h-2 rounded-full mr-1.5" style={{ background: 'var(--primary)' }} />concluídas: {concluidasNoMes}</span>
              </div>
              <div className="flex justify-between text-[12.5px] font-semibold mt-2.5">
                <span>Taxa de conclusão</span>
                <span className="text-[#10B981] font-bold">{taxaConclusao}%</span>
              </div>
            </>
          )}
        </Card>
      </div>
    </div>
  )
}

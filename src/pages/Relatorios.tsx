import { useEffect, useState } from 'react'
import { Download, FileText, Sparkles, Loader2 } from 'lucide-react'
import { BarChart, Bar, ResponsiveContainer, XAxis, Tooltip, Cell } from 'recharts'
import { jsPDF } from 'jspdf'
import { PageHeader } from '../components/layout/PageHeader'
import { Card, CardTitle } from '../components/ui/Card'
import { ProgressBar } from '../components/ui/ProgressBar'
import { apiGet, apiPost } from '../lib/api'
import { hojeBrasilia, deslocarDias } from '../lib/date'
import type { DashboardData } from '../types/dashboard'

const PERIODOS = ['3 meses', '6 meses'] as const
const MESES_LABEL = ['JAN', 'FEV', 'MAR', 'ABR', 'MAI', 'JUN', 'JUL', 'AGO', 'SET', 'OUT', 'NOV', 'DEZ']

export function Relatorios() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [carregando, setCarregando] = useState(true)
  const [periodo, setPeriodo] = useState<typeof PERIODOS[number]>('6 meses')

  const [analise, setAnalise] = useState<string | null>(null)
  const [gerandoAnalise, setGerandoAnalise] = useState(false)
  const [erroAnalise, setErroAnalise] = useState<string | null>(null)

  useEffect(() => {
    apiGet<DashboardData>('/api/dashboard')
      .then(setData)
      .catch(() => setData({ transacoes: [], tarefas: [], habitos: [], investimentos: { ativos: [], aportes: [] }, notas: [], metas: [] }))
      .finally(() => setCarregando(false))
  }, [])

  const transacoes = data?.transacoes ?? []
  const tarefas = data?.tarefas ?? []
  const habitos = data?.habitos ?? []
  const ativos = data?.investimentos.ativos ?? []

  const numMeses = periodo === '3 meses' ? 3 : 6
  const hojeStr = hojeBrasilia()
  const mesesChave: string[] = Array.from({ length: numMeses }, (_, i) => {
    const [y, m] = hojeStr.split('-').map(Number)
    const d = new Date(Date.UTC(y, m - 1, 1))
    d.setUTCMonth(d.getUTCMonth() - (numMeses - 1 - i))
    return d.toISOString().slice(0, 7)
  })

  const saldoMensal = mesesChave.map((chave) => {
    const valor = transacoes.filter((t) => t.data.slice(0, 7) === chave).reduce((s, t) => s + Number(t.valor), 0)
    const mes = MESES_LABEL[Number(chave.slice(5, 7)) - 1]
    return { mes, chave, valor }
  })

  const mesAtual = hojeStr.slice(0, 7)
  const gastosMesAtual = transacoes.filter((t) => t.data.slice(0, 7) === mesAtual && Number(t.valor) < 0)
  const totalGastoMes = gastosMesAtual.reduce((s, t) => s + Math.abs(Number(t.valor)), 0)
  const porCategoria = new Map<string, number>()
  gastosMesAtual.forEach((t) => porCategoria.set(t.categoria, (porCategoria.get(t.categoria) ?? 0) + Math.abs(Number(t.valor))))
  const distribuicaoGastos = [...porCategoria.entries()]
    .map(([categoria, valor]) => ({ categoria, valor, pct: totalGastoMes > 0 ? Math.round((valor / totalGastoMes) * 100) : 0 }))
    .sort((a, b) => b.pct - a.pct)

  function calcularAderencia(checks: string[]): number {
    const dias = 14
    let feitos = 0
    let cursor = hojeStr
    for (let i = 0; i < dias; i++) {
      if (checks.includes(cursor)) feitos++
      cursor = deslocarDias(cursor, -1)
    }
    return Math.round((feitos / dias) * 100)
  }
  const aderenciaHabitos = habitos.map((h) => ({ nome: h.nome, pct: calcularAderencia(h.checks) }))

  const tarefasPrincipais = tarefas.filter((t) => !t.parent_id)
  const criadasNoMes = tarefasPrincipais.filter((t) => t.created_at.slice(0, 7) === mesAtual).length
  const concluidasNoMes = tarefasPrincipais.filter((t) => t.status === 'concluida' && t.created_at.slice(0, 7) === mesAtual).length
  const taxaConclusao = criadasNoMes === 0 ? null : Math.round((concluidasNoMes / criadasNoMes) * 100)

  const patrimonioInvestido = ativos.reduce((s, a) => s + Number(a.valor_atual), 0)

  function montarResumo() {
    return {
      periodo,
      saldo_mensal: saldoMensal.map((s) => ({ mes: s.mes, valor: s.valor })),
      distribuicao_gastos_mes_atual: distribuicaoGastos,
      aderencia_habitos_14dias: aderenciaHabitos,
      tarefas_criadas_no_mes: criadasNoMes,
      tarefas_concluidas_no_mes: concluidasNoMes,
      taxa_conclusao_tarefas: taxaConclusao,
      patrimonio_investido: patrimonioInvestido,
    }
  }

  async function gerarAnalise() {
    setGerandoAnalise(true)
    setErroAnalise(null)
    try {
      const resp = await apiPost<{ sucesso: boolean; analise?: string; mensagem?: string }>('/api/relatorio-analise', { resumo: montarResumo() })
      if (!resp.sucesso || !resp.analise) {
        setErroAnalise(resp.mensagem || 'A Scout não conseguiu gerar a análise.')
        return
      }
      setAnalise(resp.analise)
    } catch (err) {
      setErroAnalise(err instanceof Error ? err.message : 'A Scout não conseguiu gerar a análise.')
    } finally {
      setGerandoAnalise(false)
    }
  }

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

  function exportarPDF() {
    const doc = new jsPDF()
    const margem = 16
    let y = 20
    const larguraUtil = doc.internal.pageSize.getWidth() - margem * 2

    function linha(texto: string, tamanho = 10, negrito = false, cor: [number, number, number] = [15, 23, 42]) {
      doc.setFontSize(tamanho)
      doc.setFont('helvetica', negrito ? 'bold' : 'normal')
      doc.setTextColor(...cor)
      const partes = doc.splitTextToSize(texto, larguraUtil)
      doc.text(partes, margem, y)
      y += partes.length * (tamanho * 0.42) + 3
    }

    function espaco(altura = 4) { y += altura }
    function garantirEspaco(altura: number) {
      if (y + altura > doc.internal.pageSize.getHeight() - margem) {
        doc.addPage()
        y = 20
      }
    }

    // Cabeçalho
    doc.setFillColor(6, 182, 212)
    doc.rect(0, 0, doc.internal.pageSize.getWidth(), 3, 'F')
    linha('Relatório — Vida', 18, true)
    linha(`Período: ${periodo} · gerado em ${new Date().toLocaleDateString('pt-BR')}`, 10, false, [100, 116, 139])
    espaco(4)

    linha('Saldo mensal', 13, true)
    saldoMensal.forEach((s) => {
      const cor: [number, number, number] = s.valor < 0 ? [239, 68, 68] : [15, 23, 42]
      linha(`${s.mes}: R$ ${s.valor.toLocaleString('pt-BR')}`, 10, false, cor)
    })
    espaco(4)

    garantirEspaco(30)
    linha('Distribuição de gastos — mês atual', 13, true)
    if (distribuicaoGastos.length === 0) {
      linha('Nenhum gasto registrado no período.', 10, false, [100, 116, 139])
    } else {
      distribuicaoGastos.forEach((d) => linha(`${d.categoria}: R$ ${d.valor.toLocaleString('pt-BR')} (${d.pct}%)`))
    }
    espaco(4)

    garantirEspaco(30)
    linha('Aderência de hábitos (14 dias)', 13, true)
    if (aderenciaHabitos.length === 0) {
      linha('Nenhum hábito cadastrado.', 10, false, [100, 116, 139])
    } else {
      aderenciaHabitos.forEach((h) => linha(`${h.nome}: ${h.pct}%`))
    }
    espaco(4)

    garantirEspaco(30)
    linha('Tarefas — este mês', 13, true)
    linha(`Criadas: ${criadasNoMes} · Concluídas: ${concluidasNoMes}${taxaConclusao !== null ? ` · Taxa de conclusão: ${taxaConclusao}%` : ''}`)
    espaco(4)

    garantirEspaco(30)
    linha('Patrimônio investido', 13, true)
    linha(`R$ ${patrimonioInvestido.toLocaleString('pt-BR')}`)

    if (analise) {
      espaco(6)
      garantirEspaco(40)
      linha('Análise da Scout', 13, true, [124, 58, 237])
      linha(analise.replace(/\*\*/g, ''), 10)
    }

    doc.save(`relatorio-vida-${mesAtual}.pdf`)
  }

  return (
    <div>
      <PageHeader
        eyebrow="Módulo"
        title="Relatórios"
        subtitle="Como o período selecionado se comportou."
        action={
          <div className="flex gap-2">
            <button onClick={exportarCSV} className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-sm font-semibold border border-border text-muted-foreground hover:bg-muted">
              <Download size={14} /> CSV
            </button>
            <button onClick={exportarPDF} className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold bg-primary text-primary-foreground hover:opacity-90">
              <FileText size={14} /> Baixar PDF
            </button>
          </div>
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

      <Card className="mb-4" style={{ borderColor: 'var(--secondary)' }}>
        <div className="flex items-start gap-3.5">
          <div className="w-[34px] h-[34px] rounded-[10px] flex items-center justify-center flex-shrink-0" style={{ background: 'linear-gradient(135deg, #06B6D4, #7C3AED)' }}>
            <Sparkles size={18} className="text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-3">
              <CardTitle className="mb-0">Análise da Scout</CardTitle>
              <button
                onClick={gerarAnalise}
                disabled={gerandoAnalise || carregando}
                className="flex items-center gap-1.5 text-[11.5px] font-bold text-primary flex-shrink-0 disabled:opacity-50"
              >
                {gerandoAnalise ? <Loader2 size={13} className="animate-spin" /> : <Sparkles size={13} />}
                {analise ? 'gerar de novo' : 'gerar análise'}
              </button>
            </div>
            {!analise && !gerandoAnalise && !erroAnalise && (
              <p className="text-sm text-muted-foreground mt-2">Peça pra Scout ler os números do período e apontar o que se destaca.</p>
            )}
            {gerandoAnalise && <p className="text-sm text-muted-foreground mt-2">Lendo os dados do período...</p>}
            {erroAnalise && <p className="text-sm text-destructive font-medium mt-2">{erroAnalise}</p>}
            {analise && !gerandoAnalise && (
              <p className="text-[13.5px] leading-relaxed mt-2 whitespace-pre-line">{analise}</p>
            )}
          </div>
        </div>
      </Card>

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

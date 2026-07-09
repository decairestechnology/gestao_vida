import { useState } from 'react'
import { Download } from 'lucide-react'
import { BarChart, Bar, ResponsiveContainer, XAxis, Tooltip, Cell } from 'recharts'
import { PageHeader } from '../components/layout/PageHeader'
import { Card, CardTitle } from '../components/ui/Card'
import { ProgressBar } from '../components/ui/ProgressBar'
import { saldoMensal, distribuicaoGastos, aderenciaHabitos, tarefasComparativo } from '../data/mockData'

const PERIODOS = ['Este mês', 'Trimestre', 'Ano']

export function Relatorios() {
  const [periodo, setPeriodo] = useState('Trimestre')
  const taxaConclusao = tarefasComparativo.criadas === 0
    ? null
    : Math.round((tarefasComparativo.concluidas / tarefasComparativo.criadas) * 100)

  return (
    <div>
      <PageHeader
        eyebrow="Módulo"
        title="Relatórios"
        subtitle="Como o período selecionado se comportou."
        action={
          <button className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold bg-primary text-primary-foreground hover:opacity-90">
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

      <div className="grid grid-cols-[2fr_1fr] gap-4 mb-4">
        <Card>
          <CardTitle>Saldo mensal</CardTitle>
          <div style={{ width: '100%', height: 140 }}>
            {saldoMensal.length === 0 ? (
              <div className="h-full flex items-center justify-center text-sm text-muted-foreground">Sem dados suficientes ainda.</div>
            ) : (
            <ResponsiveContainer>
              <BarChart data={saldoMensal}>
                <XAxis dataKey="mes" tick={{ fontSize: 10.5, fill: 'var(--muted-foreground)' }} axisLine={false} tickLine={false} />
                <Tooltip
                  formatter={(v: number) => [`R$ ${v.toLocaleString('pt-BR')}`, 'Saldo']}
                  contentStyle={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 12 }}
                />
                <Bar dataKey="valor" radius={[4, 4, 0, 0]}>
                  {saldoMensal.map((d, i) => (
                    <Cell key={i} fill={d.valor < 0 ? 'var(--destructive)' : 'var(--primary)'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
            )}
          </div>
        </Card>

        <Card>
          <CardTitle>Distribuição de gastos</CardTitle>
          {distribuicaoGastos.length === 0 && (
            <div className="text-sm text-muted-foreground py-4">Nenhum gasto registrado no período.</div>
          )}
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
          <CardTitle>Aderência de hábitos</CardTitle>
          {aderenciaHabitos.length === 0 && (
            <div className="text-sm text-muted-foreground py-4">Sem hábitos registrados no período.</div>
          )}
          {aderenciaHabitos.map((h) => (
            <div key={h.nome} className="mb-3.5 last:mb-0">
              <div className="flex justify-between text-[12.5px] font-semibold">
                <span>{h.nome}</span>
                <span className="text-muted-foreground">{h.pct}%</span>
              </div>
              <ProgressBar percent={h.pct} color={h.cor} />
            </div>
          ))}
        </Card>

        <Card>
          <CardTitle>Tarefas — concluídas vs. criadas</CardTitle>
          {tarefasComparativo.criadas === 0 ? (
            <div className="text-sm text-muted-foreground py-4">Nenhuma tarefa no período ainda.</div>
          ) : (
          <>
          <div className="flex items-end gap-7 h-[130px] pt-2.5 justify-center">
            <div className="flex flex-col items-center gap-1.5 w-12">
              <div className="w-full rounded-t opacity-35" style={{ height: 96, background: 'var(--muted-foreground)' }} />
              <div className="text-xs font-bold">{tarefasComparativo.criadas}</div>
              <div className="text-[10.5px] text-muted-foreground font-bold">MÊS</div>
            </div>
            <div className="flex flex-col items-center gap-1.5 w-12">
              <div className="w-full rounded-t" style={{ height: 78, background: 'var(--primary)' }} />
              <div className="text-xs font-bold">{tarefasComparativo.concluidas}</div>
              <div className="text-[10.5px] text-muted-foreground font-bold">MÊS</div>
            </div>
          </div>
          <div className="flex gap-4 justify-center mt-2 text-[11.5px] text-muted-foreground font-semibold">
            <span><span className="inline-block w-2 h-2 rounded-full mr-1.5" style={{ background: 'var(--muted-foreground)' }} />criadas: {tarefasComparativo.criadas}</span>
            <span><span className="inline-block w-2 h-2 rounded-full mr-1.5" style={{ background: 'var(--primary)' }} />concluídas: {tarefasComparativo.concluidas}</span>
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

import { useNavigate } from 'react-router-dom'
import { AreaChart, Area, ResponsiveContainer, XAxis, Tooltip } from 'recharts'
import { PageHeader } from '../components/layout/PageHeader'
import { Card, CardTitle } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { ProgressBar } from '../components/ui/ProgressBar'
import { ativos, alocacao, evolucaoPatrimonial } from '../data/mockData'

export function Investimentos() {
  const navigate = useNavigate()

  return (
    <div>
      <PageHeader
        eyebrow="Módulo"
        title="Investimentos"
        subtitle="Carteira consolidada, alocação e rentabilidade."
        action={<Button variant="gradient">+ Novo aporte</Button>}
      />

      <div className="grid grid-cols-3 gap-4 mb-4">
        <Card>
          <CardTitle>Patrimônio investido</CardTitle>
          <div className="text-2xl font-extrabold">R$ 0</div>
        </Card>
        <Card>
          <CardTitle>Rentabilidade (12m)</CardTitle>
          <div className="text-2xl font-extrabold text-primary">—</div>
        </Card>
        <Card>
          <CardTitle>Aporte médio mensal</CardTitle>
          <div className="text-2xl font-extrabold">R$ 0</div>
        </Card>
      </div>

      <Card className="mb-4">
        <CardTitle>Evolução patrimonial</CardTitle>
        <div style={{ width: '100%', height: 140 }}>
          {evolucaoPatrimonial.length === 0 ? (
            <div className="h-full flex items-center justify-center text-sm text-muted-foreground">
              Sem dados suficientes ainda.
            </div>
          ) : (
          <ResponsiveContainer>
            <AreaChart data={evolucaoPatrimonial}>
              <defs>
                <linearGradient id="evoGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--primary)" stopOpacity={0.35} />
                  <stop offset="100%" stopColor="var(--primary)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="mes" tick={{ fontSize: 10.5, fill: 'var(--muted-foreground)' }} axisLine={false} tickLine={false} />
              <Tooltip
                formatter={(v: number) => [`R$ ${v.toLocaleString('pt-BR')}`, 'Patrimônio']}
                contentStyle={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 12 }}
              />
              <Area type="monotone" dataKey="valor" stroke="var(--primary)" strokeWidth={2.5} fill="url(#evoGrad)" />
            </AreaChart>
          </ResponsiveContainer>
          )}
        </div>
      </Card>

      <div className="grid grid-cols-[2fr_1fr] gap-4">
        <Card>
          <CardTitle>Ativos · rentabilidade individual</CardTitle>
          {ativos.length === 0 && (
            <div className="text-sm text-muted-foreground py-4">Nenhum ativo cadastrado ainda.</div>
          )}
          {ativos.map((a) => (
            <div key={a.id} className="flex items-center gap-3 py-2.5 border-b border-border last:border-none">
              <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: a.cor }} />
              <div className="flex-1">
                <div className="text-[13.5px] font-semibold">{a.nome}</div>
                <div className="text-[11.5px] text-muted-foreground">
                  {a.sub}
                  {a.meta && (
                    <>
                      {' · '}
                      <button
                        onClick={() => navigate('/metas')}
                        className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-accent text-primary"
                      >
                        {a.meta}
                      </button>
                    </>
                  )}
                </div>
              </div>
              <div className="text-right flex-shrink-0">
                <div className="text-[13px] font-bold">R$ {a.valor.toLocaleString('pt-BR')}</div>
                <div className={`text-[11px] font-bold mt-0.5 ${a.retorno >= 0 ? 'text-[#10B981]' : 'text-destructive'}`}>
                  {a.retorno >= 0 ? '+' : ''}{a.retorno}%
                </div>
              </div>
            </div>
          ))}
        </Card>

        <Card>
          <CardTitle>Alocação por classe</CardTitle>
          {alocacao.length === 0 && (
            <div className="text-sm text-muted-foreground py-4">Sem alocação registrada ainda.</div>
          )}
          {alocacao.map((c) => (
            <div key={c.classe} className="mb-3.5 last:mb-0">
              <div className="flex justify-between text-[12.5px] font-semibold">
                <span>{c.classe}</span>
                <span className="text-muted-foreground">R$ {c.valor.toLocaleString('pt-BR')} · {c.pct}%</span>
              </div>
              <ProgressBar percent={c.pct} color={c.cor} />
            </div>
          ))}
        </Card>
      </div>
    </div>
  )
}

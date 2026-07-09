import { PageHeader } from '../components/layout/PageHeader'
import { Card, CardTitle } from '../components/ui/Card'
import { Badge } from '../components/ui/Badge'
import { tarefasHoje, lancamentosRecentes } from '../data/mockData'

const hoje = new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long' })

export function Dashboard() {
  return (
    <div>
      <PageHeader eyebrow={`Hoje · ${hoje}`} title="Visão geral" subtitle="Resumo do seu dia em um lugar só." />

      <div className="grid grid-cols-4 gap-4 mb-4">
        <Card>
          <CardTitle>Saldo do mês</CardTitle>
          <div className="text-2xl font-extrabold">R$ 0</div>
        </Card>
        <Card>
          <CardTitle>Patrimônio total</CardTitle>
          <div className="text-2xl font-extrabold">R$ 0</div>
        </Card>
        <Card>
          <CardTitle>Tarefas hoje</CardTitle>
          <div className="text-2xl font-extrabold">0 / 0</div>
        </Card>
        <Card>
          <CardTitle>Streak de hábitos</CardTitle>
          <div className="text-2xl font-extrabold">0 dias</div>
        </Card>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardTitle>Agora / próximo</CardTitle>
          <div className="text-sm text-muted-foreground py-4">Nenhum compromisso registrado ainda.</div>
        </Card>

        <Card>
          <CardTitle>Tarefas do dia</CardTitle>
          {tarefasHoje.length === 0 && (
            <div className="text-sm text-muted-foreground py-4">Nenhuma tarefa registrada ainda.</div>
          )}
          {tarefasHoje.map((t) => (
            <div key={t.id} className="flex items-center gap-3 py-2.5 border-b border-border last:border-none">
              <div
                className={`w-[17px] h-[17px] rounded-[5px] border-[1.5px] flex-shrink-0 ${
                  t.done ? 'bg-primary border-primary' : 'border-border'
                }`}
              />
              <div className="flex-1">
                <div className={`text-[13.5px] font-semibold ${t.done ? 'line-through text-muted-foreground' : ''}`}>
                  {t.title}
                </div>
                {t.due && <div className="text-[11.5px] text-muted-foreground">{t.due}</div>}
              </div>
              <Badge variant={t.priority}>{t.done ? 'feito' : t.priority === 'error' ? 'alta' : 'média'}</Badge>
            </div>
          ))}
        </Card>

        <Card>
          <CardTitle>Últimos lançamentos</CardTitle>
          {lancamentosRecentes.length === 0 && (
            <div className="text-sm text-muted-foreground py-4">Nenhum lançamento registrado ainda.</div>
          )}
          {lancamentosRecentes.map((l) => (
            <div key={l.id} className="flex items-center gap-3 py-2.5 border-b border-border last:border-none">
              <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: l.value < 0 ? 'var(--destructive)' : '#10B981' }} />
              <div className="flex-1">
                <div className="text-[13.5px] font-semibold">{l.title}</div>
                <div className="text-[11.5px] text-muted-foreground">{l.sub}</div>
              </div>
              <div className="text-[13px] font-bold" style={{ color: l.value < 0 ? 'var(--destructive)' : '#10B981' }}>
                {l.value < 0 ? '− ' : '+ '}R$ {Math.abs(l.value)}
              </div>
            </div>
          ))}
        </Card>
      </div>
    </div>
  )
}

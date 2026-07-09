import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronDown, Repeat } from 'lucide-react'
import { PageHeader } from '../components/layout/PageHeader'
import { Card } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Badge } from '../components/ui/Badge'
import { todasTarefas } from '../data/mockData'

const TABS = [
  { id: 'hoje', label: 'Hoje' },
  { id: 'semana', label: 'Essa semana' },
  { id: 'semprazo', label: 'Sem prazo' },
  { id: 'concluida', label: 'Concluídas' },
]

const TAG_MODULE: Record<string, string> = {
  financeiro: '/financeiro',
  saúde: '/dashboard',
  trabalho: '/financeiro',
}

export function Tarefas() {
  const navigate = useNavigate()
  const [tab, setTab] = useState('hoje')
  const [aberta, setAberta] = useState<number | null>(2)

  const visiveis = todasTarefas.filter((t) => t.status === tab)

  return (
    <div>
      <PageHeader
        eyebrow="Módulo"
        title="Tarefas"
        subtitle="O que precisa ser feito, por prioridade e prazo."
        action={<Button variant="gradient">+ Nova tarefa</Button>}
      />

      <div className="flex gap-1 border-b border-border mb-4">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`px-3.5 py-2 text-[13px] font-semibold -mb-px border-b-2 transition-colors ${
              tab === t.id ? 'text-primary border-primary' : 'text-muted-foreground border-transparent hover:text-foreground'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <Card>
        {visiveis.length === 0 && (
          <div className="text-sm text-muted-foreground py-6 text-center">Nenhuma tarefa nessa categoria ainda.</div>
        )}
        {visiveis.map((t) => (
          <div key={t.id}>
            <div className="flex items-start gap-3 py-2.5 border-b border-border last:border-none">
              <div
                className={`mt-0.5 w-[17px] h-[17px] rounded-[5px] border-[1.5px] flex-shrink-0 ${
                  t.status === 'concluida' ? 'bg-primary border-primary' : 'border-border'
                }`}
              />
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <div className={`text-[13.5px] font-semibold ${t.status === 'concluida' ? 'line-through text-muted-foreground' : ''}`}>
                    {t.title}
                  </div>
                  {t.recorrente && (
                    <span title="recorrente">
                      <Repeat size={12} className="text-muted-foreground" />
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-1.5 mt-0.5">
                  {t.tag && (
                    <button
                      onClick={() => navigate((t.tag && TAG_MODULE[t.tag]) ?? '/')}
                      className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-accent text-primary"
                    >
                      {t.tag}
                    </button>
                  )}
                  <span className="text-[11.5px] text-muted-foreground">{t.sub}</span>
                </div>
              </div>
              <Badge variant={t.priority}>
                {t.status === 'concluida' ? 'feito' : t.priority === 'error' ? 'alta' : t.priority === 'warning' ? 'média' : 'baixa'}
              </Badge>
              {t.subtarefas && (
                <button onClick={() => setAberta(aberta === t.id ? null : t.id)} className="mt-0.5 flex-shrink-0">
                  <ChevronDown
                    size={15}
                    className={`text-muted-foreground transition-transform ${aberta === t.id ? 'rotate-180' : ''}`}
                  />
                </button>
              )}
            </div>
            {t.subtarefas && aberta === t.id && (
              <div className="pl-[30px] pb-2.5 border-b border-border">
                {t.subtarefas.map((s) => (
                  <div key={s.id} className="flex items-center gap-2.5 py-1.5 text-[12.5px]">
                    <div className={`w-[14px] h-[14px] rounded-[4px] border-[1.5px] flex-shrink-0 ${s.done ? 'bg-primary border-primary' : 'border-border'}`} />
                    {s.title}
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </Card>
    </div>
  )
}

import { useNavigate } from 'react-router-dom'
import { PageHeader } from '../components/layout/PageHeader'
import { Card, CardTitle } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Badge } from '../components/ui/Badge'
import { ProgressBar } from '../components/ui/ProgressBar'
import { metas } from '../data/mockData'

export function Metas() {
  const navigate = useNavigate()

  return (
    <div>
      <PageHeader
        eyebrow="Módulo"
        title="Metas"
        subtitle="Onde você quer chegar, e o quanto falta."
        action={<Button variant="gradient">+ Nova meta</Button>}
      />

      <div className="grid grid-cols-3 gap-4">
        {metas.length === 0 && (
          <div className="text-sm text-muted-foreground py-4 col-span-3 text-center">Nenhuma meta cadastrada ainda.</div>
        )}
        {metas.map((m) => (
          <Card key={m.id} className={m.concluida ? 'opacity-85' : ''}>
            <CardTitle>{m.nome}</CardTitle>
            <div className="text-2xl font-extrabold">R$ {m.atual.toLocaleString('pt-BR')}</div>
            <div className="text-[11.5px] text-muted-foreground mt-1 mb-2.5">
              {m.concluida ? `meta ${m.prazo}` : `meta: R$ ${m.alvo.toLocaleString('pt-BR')} até ${m.prazo}`}
            </div>
            <ProgressBar percent={(m.atual / m.alvo) * 100} color={m.cor} />
            <div className="flex justify-between items-center mt-3 flex-wrap gap-1.5">
              {m.concluida ? (
                <Badge variant="success">concluída ✓</Badge>
              ) : m.vinculo ? (
                <button
                  onClick={() => navigate('/investimentos')}
                  className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-accent text-primary"
                >
                  {m.vinculo}
                </button>
              ) : (
                <Badge variant="neutral">sem vínculo</Badge>
              )}
              {!m.concluida && (
                <span className="text-[11px] font-semibold text-muted-foreground">ritmo: R$ {m.ritmo}/mês</span>
              )}
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}

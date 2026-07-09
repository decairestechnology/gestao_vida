import { AlertTriangle } from 'lucide-react'
import { PageHeader } from '../components/layout/PageHeader'
import { Card } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { habitos } from '../data/mockData'

export function Habitos() {
  const emRisco = habitos.find((h) => h.risco)

  return (
    <div>
      <PageHeader
        eyebrow="Módulo"
        title="Hábitos"
        subtitle="Últimos 14 dias, marcado quando cumprido."
        action={<Button variant="gradient">+ Novo hábito</Button>}
      />

      {emRisco && (
        <div className="flex items-center gap-3 bg-[#FEF2F2] border border-[#FECACA] rounded-xl px-4 py-3 mb-4">
          <AlertTriangle size={20} className="text-destructive flex-shrink-0" />
          <div>
            <div className="font-semibold text-[#991B1B]">Streak de "{emRisco.nome}" em risco</div>
            <div className="text-xs text-[#991B1B]/80">ainda não marcado hoje · quebra à meia-noite</div>
          </div>
        </div>
      )}

      <Card>
        {habitos.length === 0 && (
          <div className="text-sm text-muted-foreground py-4">Nenhum hábito cadastrado ainda.</div>
        )}
        {habitos.map((h) => (
          <div key={h.id} className="flex items-center gap-3.5 py-2.5 border-b border-border last:border-none">
            <div className="w-[150px] flex-shrink-0">
              <div className="text-[13px] font-semibold">{h.nome}</div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-accent text-primary inline-block mt-1">
                {h.freq}
              </span>
            </div>
            <div className="flex gap-1.5 flex-1">
              {h.dias.map((d, i) => (
                <div
                  key={i}
                  className="w-5 h-5 rounded-[5px]"
                  style={{ background: d ? 'var(--secondary)' : 'var(--muted)' }}
                />
              ))}
            </div>
            <div className={`text-xs font-bold w-10 text-right flex-shrink-0 ${h.risco ? 'text-destructive' : 'text-[#92400E]'}`}>
              {h.streak}d
            </div>
          </div>
        ))}
      </Card>
    </div>
  )
}

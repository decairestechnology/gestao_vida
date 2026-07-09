import { NavLink } from 'react-router-dom'
import {
  Gauge, Wallet, TrendingUp, CheckSquare, Grid2x2,
  FileText, Target, BarChart3, Settings,
} from 'lucide-react'
import { clsx } from '../../lib/clsx'

const NAV_ITEMS = [
  { to: '/', label: 'Dashboard', icon: Gauge, end: true },
  { to: '/financeiro', label: 'Financeiro', icon: Wallet },
  { to: '/investimentos', label: 'Investimentos', icon: TrendingUp },
  { to: '/tarefas', label: 'Tarefas', icon: CheckSquare },
  { to: '/habitos', label: 'Hábitos', icon: Grid2x2 },
  { to: '/notas', label: 'Notas', icon: FileText },
  { to: '/metas', label: 'Metas', icon: Target },
  { to: '/relatorios', label: 'Relatórios', icon: BarChart3 },
]

export function Sidebar() {
  return (
    <aside className="w-[236px] min-w-[236px] bg-card border-r border-border p-3.5 flex flex-col gap-0.5">
      <div className="flex items-center gap-2.5 px-2 pb-5 pt-1.5">
        <div className="w-9 h-9 rounded-[10px] overflow-hidden flex-shrink-0">
          <img src="/logo.png" alt="Logo" className="w-full h-full object-contain" />
        </div>
        <div className="leading-tight">
          <div className="font-bold text-sm">Vida</div>
          <div className="text-[10.5px] text-muted-foreground font-semibold">DeCaires Ecosystem</div>
        </div>
      </div>

      {NAV_ITEMS.map(({ to, label, icon: Icon, end }) => (
        <NavLink
          key={to}
          to={to}
          end={end}
          className={({ isActive }) =>
            clsx(
              'flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-[13.5px] font-semibold transition-colors',
              isActive
                ? 'bg-accent text-primary'
                : 'text-muted-foreground hover:bg-muted hover:text-foreground',
            )
          }
        >
          <Icon size={16} />
          {label}
        </NavLink>
      ))}

      <NavLink
        to="/configuracoes"
        className={({ isActive }) =>
          clsx(
            'flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-[13.5px] font-semibold transition-colors mt-auto',
            isActive
              ? 'bg-accent text-primary'
              : 'text-muted-foreground hover:bg-muted hover:text-foreground',
          )
        }
      >
        <Settings size={16} />
        Configurações
      </NavLink>

      <div className="pt-3 border-t border-border text-[11px] text-muted-foreground font-semibold px-2.5">
        v0.2 — protótipo<br />ecossistema DeCaires
      </div>
    </aside>
  )
}

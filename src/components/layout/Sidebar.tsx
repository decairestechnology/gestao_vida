import { NavLink } from 'react-router-dom'
import {
  Gauge, Wallet, TrendingUp, CheckSquare, Grid2x2,
  FileText, Target, BarChart3, Settings, X,
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
  { to: '/configuracoes', label: 'Configurações', icon: Settings },
]

interface SidebarProps {
  aberta: boolean
  fechar: () => void
}

export function Sidebar({ aberta, fechar }: SidebarProps) {
  return (
    <>
      {/* Fundo escurecido atrás do menu no celular/tablet */}
      {aberta && (
        <div
          onClick={fechar}
          className="fixed inset-0 bg-black/40 z-40 md:hidden"
        />
      )}

      <aside
        className={clsx(
          'w-[236px] min-w-[236px] bg-card border-r border-border p-3.5 flex flex-col gap-0.5',
          'fixed inset-y-0 left-0 z-50 transition-transform duration-200 md:static md:translate-x-0',
          aberta ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        <button onClick={fechar} className="self-end mb-1 text-muted-foreground hover:text-foreground md:hidden">
          <X size={18} />
        </button>

        <div className="flex flex-col items-center gap-1.5 px-2 pb-5 pt-1.5">
          <div className="w-[72px] h-[72px] rounded-2xl overflow-hidden flex-shrink-0">
            <img src="/logo.png" alt="Logo" className="w-full h-full object-contain" />
          </div>
          <div className="text-center leading-tight">
            <div className="font-bold text-sm">DeCaires</div>
            <div className="text-[10.5px] text-muted-foreground font-semibold">Gestão Pessoal</div>
          </div>
        </div>

        {NAV_ITEMS.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            onClick={fechar}
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

        <div className="mt-auto pt-3 border-t border-border text-[11px] text-muted-foreground font-semibold text-center">
          Ecossistema DeCaires
        </div>
      </aside>
    </>
  )
}

import { useState } from 'react'
import { NavLink } from 'react-router-dom'
import {
  Gauge, Wallet, TrendingUp, CheckSquare, Grid2x2,
  FileText, Target, BarChart3, Settings, X, ChevronLeft, ChevronRight,
} from 'lucide-react'
import { clsx } from '../../lib/clsx'
import { useMarca } from '../../context/MarcaContext'

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
  const { marca } = useMarca()
  const [colapsada, setColapsada] = useState(() => localStorage.getItem('vida-sidebar-colapsada') === '1')

  function alternarColapso() {
    setColapsada((c) => {
      const novo = !c
      localStorage.setItem('vida-sidebar-colapsada', novo ? '1' : '0')
      return novo
    })
  }

  const logoTamanho = colapsada ? 36 : marca.logoTamanho

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
          'min-w-0 bg-card border-r border-border p-3.5 flex flex-col gap-0.5 relative',
          'fixed inset-y-0 left-0 z-50 transition-all duration-200 md:static md:translate-x-0',
          colapsada ? 'md:w-[76px]' : 'md:w-[236px]',
          'w-[236px]',
          aberta ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        {/* Botão de colapsar — só existe em telas médias/grandes, no celular a sidebar é sempre gaveta cheia */}
        <button
          onClick={alternarColapso}
          title={colapsada ? 'Expandir menu' : 'Recolher menu'}
          className="hidden md:flex absolute -right-3 top-8 w-6 h-6 rounded-full border border-border bg-card items-center justify-center text-muted-foreground hover:text-primary hover:border-primary transition-colors z-10"
        >
          {colapsada ? <ChevronRight size={13} /> : <ChevronLeft size={13} />}
        </button>

        <button onClick={fechar} className="self-end mb-1 text-muted-foreground hover:text-foreground md:hidden">
          <X size={18} />
        </button>

        <div className={clsx('flex flex-col items-center gap-1.5 pb-5 pt-1.5', colapsada ? 'px-0' : 'px-2')}>
          <div style={{ width: logoTamanho, height: logoTamanho }} className="rounded-2xl overflow-hidden flex-shrink-0 transition-all duration-200">
            <img src={marca.logoUrl ?? '/logo.png'} alt="Logo" className="w-full h-full object-contain" />
          </div>
          {!colapsada && (
            <div className="text-center leading-tight">
              <div className="font-bold text-sm">{marca.nome}</div>
              <div className="text-[10.5px] text-muted-foreground font-semibold">{marca.subtitulo}</div>
            </div>
          )}
        </div>

        {NAV_ITEMS.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            onClick={fechar}
            title={colapsada ? label : undefined}
            className={({ isActive }) =>
              clsx(
                'flex items-center gap-2.5 py-2 rounded-lg text-[13.5px] font-semibold transition-colors',
                colapsada ? 'px-0 justify-center' : 'px-2.5',
                isActive
                  ? 'bg-accent text-primary'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground',
              )
            }
          >
            <Icon size={16} className="flex-shrink-0" />
            {!colapsada && label}
          </NavLink>
        ))}

        {!colapsada && (
          <div className="mt-auto pt-3 border-t border-border text-[11px] text-muted-foreground font-semibold text-center">
            Ecossistema DeCaires
          </div>
        )}
      </aside>
    </>
  )
}

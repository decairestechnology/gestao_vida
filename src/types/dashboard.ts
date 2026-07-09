export interface Transacao {
  id: string
  titulo: string
  categoria: string
  descricao?: string | null
  valor: string | number
  data: string
}

export interface Tarefa {
  id: string
  titulo: string
  status: 'pendente' | 'concluida'
  prioridade: 'alta' | 'media' | 'baixa'
  tag: string | null
  vencimento: string | null
  recorrente: boolean
  parent_id: string | null
  created_at: string
}

export interface Habito {
  id: string
  nome: string
  frequencia: string
  tag: string | null
  checks: string[]
}

export interface Ativo {
  id: string
  nome: string
  classe: string
  valor_atual: string | number
  rentabilidade_12m: string | number | null
}

export interface Aporte {
  id: string
  ativo_id: string
  valor: string | number
  data: string
}

export interface Nota {
  id: string
  titulo: string
  corpo: string
  tag: string | null
  pinned: boolean
  created_at: string
}

export interface Meta {
  id: string
  nome: string
  valor_atual: string | number
  valor_alvo: string | number
  prazo: string | null
  concluida: boolean
}

export interface DashboardData {
  transacoes: Transacao[]
  tarefas: Tarefa[]
  habitos: Habito[]
  investimentos: { ativos: Ativo[]; aportes: Aporte[] }
  notas: Nota[]
  metas: Meta[]
}

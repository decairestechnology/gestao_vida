// Dados reais virão do Neon via /api. Esses arrays ficam vazios até a
// leitura real ser conectada (ver README, item "O que falta pra ficar 100% real").

export const tarefasHoje: Array<{
  id: number; title: string; done: boolean; tag: string; due: string
  priority: 'success' | 'error' | 'warning' | 'info' | 'alt' | 'neutral'; recorrente?: boolean
}> = []

export const lancamentosRecentes: Array<{ id: number; title: string; sub: string; value: number }> = []

export const contas: Array<{ id: string; nome: string; saldo: number; sub: string }> = [
  { id: 'corrente', nome: 'Conta corrente', saldo: 0, sub: '' },
  { id: 'cartao', nome: 'Cartão de crédito', saldo: 0, sub: '' },
  { id: 'dinheiro', nome: 'Dinheiro / carteira', saldo: 0, sub: '' },
]

export const recorrencias: Array<{ id: number; nome: string; quando: string; valor: number }> = []

export const orcamentoCategorias: Array<{ categoria: string; gasto: number; limite: number; cor: string }> = []

export const ativos: Array<{
  id: number; nome: string; sub: string; meta: string | null; valor: number; retorno: number; cor: string
}> = []

export const alocacao: Array<{ classe: string; valor: number; pct: number; cor: string }> = []

export const evolucaoPatrimonial: Array<{ mes: string; valor: number }> = []

export const todasTarefas: Array<{
  id: number; title: string; status: string; tag: string | null; sub: string
  priority: 'success' | 'error' | 'warning' | 'info' | 'alt' | 'neutral'; recorrente?: boolean
  subtarefas?: Array<{ id: number; title: string; done: boolean }>
}> = []

export const habitos: Array<{
  id: number; nome: string; freq: string; streak: number; risco: boolean; dias: number[]
}> = []

export const notas: Array<{
  id: number; titulo: string; corpo: string; tag: string; data: string; pinned: boolean
}> = []

export const metas: Array<{
  id: number; nome: string; atual: number; alvo: number; prazo: string; cor: string
  vinculo: string | null; ritmo: number; concluida: boolean
}> = []

export const saldoMensal: Array<{ mes: string; valor: number }> = []

export const distribuicaoGastos: Array<{ categoria: string; pct: number }> = []

export const aderenciaHabitos: Array<{ nome: string; pct: number; cor: string }> = []

export const tarefasComparativo = { criadas: 0, concluidas: 0 }

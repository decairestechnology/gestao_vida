export const CATEGORIAS_DESPESA = [
  'Alimentação',
  'Transporte',
  'Moradia',
  'Lazer',
  'Saúde',
  'Educação',
  'Assinaturas',
  'Compras',
  'Outros',
] as const

export const CATEGORIAS_RECEITA = [
  'Salário',
  'Freelance',
  'Investimentos',
  'Reembolso',
  'Outros',
] as const

export const TODAS_CATEGORIAS = [...new Set([...CATEGORIAS_DESPESA, ...CATEGORIAS_RECEITA])]

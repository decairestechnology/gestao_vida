import type { VercelRequest, VercelResponse } from '@vercel/node'
import { requireUser } from './_auth.js'
import { sql } from './_db.js'

// GET /api/dashboard → uma chamada só, devolve tudo que Dashboard e Relatórios usam.
// Evita 6 requisições separadas toda vez que uma dessas telas abre.
export default async function handler(req: VercelRequest, res: VercelResponse) {
  let userId: string
  try {
    userId = await requireUser(req)
  } catch {
    return res.status(401).json({ error: 'unauthorized' })
  }

  if (req.method !== 'GET') return res.status(405).json({ error: 'method_not_allowed' })

  const [transacoes, tarefas, habitos, ativos, aportes, notas, metas] = await Promise.all([
    sql`select * from transacoes where user_id = ${userId} and data >= current_date - interval '6 months' order by data desc limit 300`,
    sql`select * from tarefas where user_id = ${userId} order by created_at asc limit 300`,
    sql`
      select h.*,
        coalesce(array_agg(to_char(hc.data, 'YYYY-MM-DD') order by hc.data) filter (where hc.data is not null), '{}') as checks
      from habitos h
      left join habito_checks hc on hc.habito_id = h.id and hc.data >= current_date - interval '29 days'
      where h.user_id = ${userId} and h.ativo = true
      group by h.id
      order by h.created_at asc
      limit 100
    `,
    sql`select * from investimentos_ativos where user_id = ${userId} order by created_at asc limit 200`,
    sql`
      select a.* from investimentos_aportes a
      join investimentos_ativos i on i.id = a.ativo_id
      where i.user_id = ${userId}
      order by a.data asc
      limit 500
    `,
    sql`select * from notas where user_id = ${userId} order by pinned desc, created_at desc limit 200`,
    sql`select * from metas where user_id = ${userId} order by concluida asc, prazo asc nulls last limit 100`,
  ])

  return res.status(200).json({
    transacoes,
    tarefas,
    habitos,
    investimentos: { ativos, aportes },
    notas,
    metas,
  })
}

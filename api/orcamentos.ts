import type { VercelRequest, VercelResponse } from '@vercel/node'
import { requireUser } from './_auth.js'
import { sql } from './_db.js'
import { hojeBrasilia } from './_date.js'

// GET    /api/orcamentos?mes=YYYY-MM → lista orçamentos do mês (padrão: mês atual)
// POST   /api/orcamentos → cria ou atualiza o limite de uma categoria no mês (upsert)
// PATCH  /api/orcamentos → edita só o limite (body precisa ter "id")
// DELETE /api/orcamentos → remove (body precisa ter "id")
export default async function handler(req: VercelRequest, res: VercelResponse) {
  let userId: string
  try {
    userId = await requireUser(req)
  } catch {
    return res.status(401).json({ error: 'unauthorized' })
  }

  if (req.method === 'GET') {
    const mes = typeof req.query.mes === 'string' ? req.query.mes : hojeBrasilia().slice(0, 7)
    const mesReferencia = `${mes}-01`
    const rows = await sql`
      select * from orcamentos where user_id = ${userId} and mes_referencia = ${mesReferencia} order by categoria asc
    `
    return res.status(200).json(rows)
  }

  if (req.method === 'POST') {
    const { categoria, limite, mes_referencia } = req.body ?? {}
    if (!categoria || limite === undefined) return res.status(400).json({ error: 'categoria e limite são obrigatórios' })
    const mesRef = mes_referencia ?? `${hojeBrasilia().slice(0, 7)}-01`
    const [row] = await sql`
      insert into orcamentos (user_id, categoria, limite, mes_referencia)
      values (${userId}, ${categoria}, ${limite}, ${mesRef})
      on conflict (user_id, categoria, mes_referencia)
      do update set limite = excluded.limite
      returning *
    `
    return res.status(201).json(row)
  }

  if (req.method === 'PATCH') {
    const { id, limite } = req.body ?? {}
    if (!id || limite === undefined) return res.status(400).json({ error: 'id e limite são obrigatórios' })
    const [row] = await sql`
      update orcamentos set limite = ${limite} where id = ${id} and user_id = ${userId} returning *
    `
    if (!row) return res.status(404).json({ error: 'não encontrado' })
    return res.status(200).json(row)
  }

  if (req.method === 'DELETE') {
    const { id } = req.body ?? {}
    if (!id) return res.status(400).json({ error: 'id é obrigatório' })
    const [row] = await sql`delete from orcamentos where id = ${id} and user_id = ${userId} returning id`
    if (!row) return res.status(404).json({ error: 'não encontrado' })
    return res.status(200).json({ deleted: true })
  }

  return res.status(405).json({ error: 'method_not_allowed' })
}

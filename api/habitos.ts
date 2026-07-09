import type { VercelRequest, VercelResponse } from '@vercel/node'
import { requireUser } from './_auth.js'
import { sql } from './_db.js'

// GET    /api/habitos → lista hábitos + array de datas marcadas nos últimos 14 dias
// POST   /api/habitos → cria hábito
// PATCH  /api/habitos → edita (body precisa ter "id")
// DELETE /api/habitos → exclui (body precisa ter "id"; checks somem junto por cascade)
export default async function handler(req: VercelRequest, res: VercelResponse) {
  let userId: string
  try {
    userId = await requireUser(req)
  } catch {
    return res.status(401).json({ error: 'unauthorized' })
  }

  if (req.method === 'GET') {
    const rows = await sql`
      select h.*,
        coalesce(
          array_agg(to_char(hc.data, 'YYYY-MM-DD') order by hc.data) filter (where hc.data is not null),
          '{}'
        ) as checks
      from habitos h
      left join habito_checks hc on hc.habito_id = h.id and hc.data >= current_date - interval '13 days'
      where h.user_id = ${userId} and h.ativo = true
      group by h.id
      order by h.created_at asc
    `
    return res.status(200).json(rows)
  }

  if (req.method === 'POST') {
    const { nome, frequencia, tag } = req.body ?? {}
    if (!nome) return res.status(400).json({ error: 'nome é obrigatório' })
    const [row] = await sql`
      insert into habitos (user_id, nome, frequencia, tag)
      values (${userId}, ${nome}, ${frequencia ?? 'diario'}, ${tag ?? null})
      returning *
    `
    return res.status(201).json({ ...row, checks: [] })
  }

  if (req.method === 'PATCH') {
    const { id, nome, frequencia, tag } = req.body ?? {}
    if (!id) return res.status(400).json({ error: 'id é obrigatório' })
    const [row] = await sql`
      update habitos set
        nome = coalesce(${nome}, nome),
        frequencia = coalesce(${frequencia}, frequencia),
        tag = coalesce(${tag}, tag)
      where id = ${id} and user_id = ${userId}
      returning *
    `
    if (!row) return res.status(404).json({ error: 'não encontrado' })
    return res.status(200).json(row)
  }

  if (req.method === 'DELETE') {
    const { id } = req.body ?? {}
    if (!id) return res.status(400).json({ error: 'id é obrigatório' })
    const [row] = await sql`
      delete from habitos where id = ${id} and user_id = ${userId} returning id
    `
    if (!row) return res.status(404).json({ error: 'não encontrado' })
    return res.status(200).json({ deleted: true })
  }

  return res.status(405).json({ error: 'method_not_allowed' })
}

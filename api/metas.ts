import type { VercelRequest, VercelResponse } from '@vercel/node'
import { requireUser } from './_auth.js'
import { sql } from './_db.js'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  let userId: string
  try {
    userId = await requireUser(req)
  } catch {
    return res.status(401).json({ error: 'unauthorized' })
  }

  if (req.method === 'GET') {
    const rows = await sql`
      select m.*, a.nome as ativo_nome
      from metas m
      left join investimentos_ativos a on a.id = m.ativo_vinculado_id
      where m.user_id = ${userId}
      order by m.concluida asc, m.prazo asc nulls last
      limit 100
    `
    return res.status(200).json(rows)
  }

  if (req.method === 'POST') {
    const { nome, valor_atual, valor_alvo, prazo, ativo_vinculado_id } = req.body ?? {}
    if (!nome || valor_alvo === undefined) {
      return res.status(400).json({ error: 'nome e valor_alvo são obrigatórios' })
    }
    const [row] = await sql`
      insert into metas (user_id, nome, valor_atual, valor_alvo, prazo, ativo_vinculado_id)
      values (${userId}, ${nome}, ${valor_atual ?? 0}, ${valor_alvo}, ${prazo ?? null}, ${ativo_vinculado_id ?? null})
      returning *
    `
    return res.status(201).json(row)
  }

  if (req.method === 'PATCH') {
    const { id, nome, valor_atual, valor_alvo, prazo, concluida, ativo_vinculado_id } = req.body ?? {}
    if (!id) return res.status(400).json({ error: 'id é obrigatório' })
    const [row] = await sql`
      update metas set
        nome = coalesce(${nome}, nome),
        valor_atual = coalesce(${valor_atual}, valor_atual),
        valor_alvo = coalesce(${valor_alvo}, valor_alvo),
        prazo = coalesce(${prazo}, prazo),
        concluida = coalesce(${concluida}, concluida),
        ativo_vinculado_id = coalesce(${ativo_vinculado_id}, ativo_vinculado_id)
      where id = ${id} and user_id = ${userId}
      returning *
    `
    if (!row) return res.status(404).json({ error: 'não encontrado' })
    return res.status(200).json(row)
  }

  if (req.method === 'DELETE') {
    const { id } = req.body ?? {}
    if (!id) return res.status(400).json({ error: 'id é obrigatório' })
    const [row] = await sql`delete from metas where id = ${id} and user_id = ${userId} returning id`
    if (!row) return res.status(404).json({ error: 'não encontrado' })
    return res.status(200).json({ deleted: true })
  }

  return res.status(405).json({ error: 'method_not_allowed' })
}

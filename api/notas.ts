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
      select * from notas where user_id = ${userId} order by pinned desc, created_at desc
    `
    return res.status(200).json(rows)
  }

  if (req.method === 'POST') {
    const { titulo, corpo, tag } = req.body ?? {}
    if (!titulo || !corpo) return res.status(400).json({ error: 'titulo e corpo são obrigatórios' })
    const [row] = await sql`
      insert into notas (user_id, titulo, corpo, tag)
      values (${userId}, ${titulo}, ${corpo}, ${tag ?? null})
      returning *
    `
    return res.status(201).json(row)
  }

  if (req.method === 'PATCH') {
    const { id, titulo, corpo, tag, pinned } = req.body ?? {}
    if (!id) return res.status(400).json({ error: 'id é obrigatório' })
    const [row] = await sql`
      update notas set
        titulo = coalesce(${titulo}, titulo),
        corpo = coalesce(${corpo}, corpo),
        tag = coalesce(${tag}, tag),
        pinned = coalesce(${pinned}, pinned)
      where id = ${id} and user_id = ${userId}
      returning *
    `
    if (!row) return res.status(404).json({ error: 'não encontrado' })
    return res.status(200).json(row)
  }

  if (req.method === 'DELETE') {
    const { id } = req.body ?? {}
    if (!id) return res.status(400).json({ error: 'id é obrigatório' })
    const [row] = await sql`delete from notas where id = ${id} and user_id = ${userId} returning id`
    if (!row) return res.status(404).json({ error: 'não encontrado' })
    return res.status(200).json({ deleted: true })
  }

  return res.status(405).json({ error: 'method_not_allowed' })
}

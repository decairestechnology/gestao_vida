import type { VercelRequest, VercelResponse } from '@vercel/node'
import { requireUser } from './_auth.js'
import { sql } from './_db.js'

// GET    /api/config → { tema, categorias: [{id, nome, tipo}] }
// POST   /api/config → body { recurso: 'tema', tema } OU { recurso: 'categoria', nome, tipo }
// DELETE /api/config → remove categoria personalizada (body: { id })
export default async function handler(req: VercelRequest, res: VercelResponse) {
  let userId: string
  try {
    userId = await requireUser(req)
  } catch {
    return res.status(401).json({ error: 'unauthorized' })
  }

  if (req.method === 'GET') {
    const [prefs, categorias] = await Promise.all([
      sql`select tema from preferencias where user_id = ${userId}`,
      sql`select id, nome, tipo from categorias_personalizadas where user_id = ${userId} order by nome asc`,
    ])
    return res.status(200).json({
      tema: prefs[0]?.tema ?? null,
      categorias,
    })
  }

  if (req.method === 'POST') {
    const { recurso } = req.body ?? {}

    if (recurso === 'tema') {
      const { tema } = req.body
      if (tema !== 'light' && tema !== 'dark') return res.status(400).json({ error: 'tema inválido' })
      await sql`
        insert into preferencias (user_id, tema) values (${userId}, ${tema})
        on conflict (user_id) do update set tema = excluded.tema, updated_at = now()
      `
      return res.status(200).json({ tema })
    }

    if (recurso === 'categoria') {
      const { nome, tipo } = req.body
      if (!nome || (tipo !== 'despesa' && tipo !== 'receita')) {
        return res.status(400).json({ error: 'nome e tipo (despesa/receita) são obrigatórios' })
      }
      const [row] = await sql`
        insert into categorias_personalizadas (user_id, nome, tipo)
        values (${userId}, ${nome}, ${tipo})
        on conflict (user_id, nome, tipo) do nothing
        returning *
      `
      if (!row) return res.status(409).json({ error: 'essa categoria já existe' })
      return res.status(201).json(row)
    }

    return res.status(400).json({ error: 'recurso inválido' })
  }

  if (req.method === 'DELETE') {
    const { id } = req.body ?? {}
    if (!id) return res.status(400).json({ error: 'id é obrigatório' })
    const [row] = await sql`delete from categorias_personalizadas where id = ${id} and user_id = ${userId} returning id`
    if (!row) return res.status(404).json({ error: 'não encontrado' })
    return res.status(200).json({ deleted: true })
  }

  return res.status(405).json({ error: 'method_not_allowed' })
}

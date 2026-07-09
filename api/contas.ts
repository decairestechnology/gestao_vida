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
    const rows = await sql`select * from contas where user_id = ${userId} order by created_at asc limit 50`
    return res.status(200).json(rows)
  }

  if (req.method === 'POST') {
    const { nome, tipo, saldo, limite, fechamento_dia } = req.body ?? {}
    if (!nome || !tipo) return res.status(400).json({ error: 'nome e tipo são obrigatórios' })
    const [row] = await sql`
      insert into contas (user_id, nome, tipo, saldo, limite, fechamento_dia)
      values (${userId}, ${nome}, ${tipo}, ${saldo ?? 0}, ${limite ?? null}, ${fechamento_dia ?? null})
      returning *
    `
    return res.status(201).json(row)
  }

  if (req.method === 'PATCH') {
    const { id, nome, tipo, saldo, limite, fechamento_dia } = req.body ?? {}
    if (!id) return res.status(400).json({ error: 'id é obrigatório' })
    const [row] = await sql`
      update contas set
        nome = coalesce(${nome}, nome),
        tipo = coalesce(${tipo}, tipo),
        saldo = coalesce(${saldo}, saldo),
        limite = coalesce(${limite}, limite),
        fechamento_dia = coalesce(${fechamento_dia}, fechamento_dia)
      where id = ${id} and user_id = ${userId}
      returning *
    `
    if (!row) return res.status(404).json({ error: 'não encontrado' })
    return res.status(200).json(row)
  }

  if (req.method === 'DELETE') {
    const { id } = req.body ?? {}
    if (!id) return res.status(400).json({ error: 'id é obrigatório' })
    const [row] = await sql`delete from contas where id = ${id} and user_id = ${userId} returning id`
    if (!row) return res.status(404).json({ error: 'não encontrado' })
    return res.status(200).json({ deleted: true })
  }

  return res.status(405).json({ error: 'method_not_allowed' })
}

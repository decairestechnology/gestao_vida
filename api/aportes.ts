import type { VercelRequest, VercelResponse } from '@vercel/node'
import { requireUser } from './_auth.js'
import { sql } from './_db.js'

// POST /api/aportes → registra um aporte e soma no valor_atual do ativo
// body: { ativo_id, valor, data }
export default async function handler(req: VercelRequest, res: VercelResponse) {
  let userId: string
  try {
    userId = await requireUser(req)
  } catch {
    return res.status(401).json({ error: 'unauthorized' })
  }

  if (req.method !== 'POST') return res.status(405).json({ error: 'method_not_allowed' })

  const { ativo_id, valor, data } = req.body ?? {}
  if (!ativo_id || valor === undefined) return res.status(400).json({ error: 'ativo_id e valor são obrigatórios' })

  const [dono] = await sql`select id from investimentos_ativos where id = ${ativo_id} and user_id = ${userId}`
  if (!dono) return res.status(404).json({ error: 'ativo não encontrado' })

  const [aporte] = await sql`
    insert into investimentos_aportes (user_id, ativo_id, valor, data)
    values (${userId}, ${ativo_id}, ${valor}, ${data ?? new Date().toISOString().slice(0, 10)})
    returning *
  `
  const [ativoAtualizado] = await sql`
    update investimentos_ativos set valor_atual = valor_atual + ${valor}
    where id = ${ativo_id}
    returning *
  `

  return res.status(201).json({ aporte, ativo: ativoAtualizado })
}

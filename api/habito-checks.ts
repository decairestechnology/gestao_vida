import type { VercelRequest, VercelResponse } from '@vercel/node'
import { requireUser } from './_auth.js'
import { sql } from './_db.js'

// POST /api/habito-checks → alterna (marca se não tinha, desmarca se já tinha)
// body: { habito_id, data } — "data" no formato YYYY-MM-DD
export default async function handler(req: VercelRequest, res: VercelResponse) {
  let userId: string
  try {
    userId = await requireUser(req)
  } catch {
    return res.status(401).json({ error: 'unauthorized' })
  }

  if (req.method !== 'POST') return res.status(405).json({ error: 'method_not_allowed' })

  const { habito_id, data } = req.body ?? {}
  if (!habito_id || !data) return res.status(400).json({ error: 'habito_id e data são obrigatórios' })

  // confirma que o hábito é do usuário logado antes de mexer
  const [dono] = await sql`select id from habitos where id = ${habito_id} and user_id = ${userId}`
  if (!dono) return res.status(404).json({ error: 'hábito não encontrado' })

  const [existente] = await sql`select id from habito_checks where habito_id = ${habito_id} and data = ${data}`

  if (existente) {
    await sql`delete from habito_checks where id = ${existente.id}`
    return res.status(200).json({ checked: false })
  }

  await sql`insert into habito_checks (habito_id, data) values (${habito_id}, ${data})`
  return res.status(200).json({ checked: true })
}

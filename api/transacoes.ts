import type { VercelRequest, VercelResponse } from '@vercel/node'
import { requireUser } from './_auth.js'
import { sql } from './_db.js'

// GET    /api/transacoes → lista as transações do usuário logado
// POST   /api/transacoes → cria uma transação manual
// PATCH  /api/transacoes → edita (body precisa ter "id" + campos a alterar)
// DELETE /api/transacoes → exclui (body precisa ter "id")
// Modelo de referência: repita esse padrão pra /api/tarefas, /api/habitos, /api/notas, /api/metas
export default async function handler(req: VercelRequest, res: VercelResponse) {
  let userId: string
  try {
    userId = await requireUser(req)
  } catch {
    return res.status(401).json({ error: 'unauthorized' })
  }

  if (req.method === 'GET') {
    const rows = await sql`
      select * from transacoes where user_id = ${userId} order by data desc limit 300
    `
    return res.status(200).json(rows)
  }

  if (req.method === 'POST') {
    const { titulo, categoria, valor, data, conta_id, descricao, recorrente, recorrencia_intervalo_dias } = req.body ?? {}
    if (!titulo || !categoria || valor === undefined) {
      return res.status(400).json({ error: 'titulo, categoria e valor são obrigatórios' })
    }
    const [row] = await sql`
      insert into transacoes (user_id, titulo, categoria, descricao, valor, data, conta_id, origem, recorrente, recorrencia_intervalo_dias)
      values (${userId}, ${titulo}, ${categoria}, ${descricao ?? null}, ${valor}, ${data ?? new Date().toISOString().slice(0, 10)}, ${conta_id ?? null}, 'manual', ${recorrente ?? false}, ${recorrencia_intervalo_dias ?? 30})
      returning *
    `
    return res.status(201).json(row)
  }

  if (req.method === 'PATCH') {
    const { id, titulo, categoria, valor, data, descricao, conta_id } = req.body ?? {}
    if (!id) return res.status(400).json({ error: 'id é obrigatório' })
    const [row] = await sql`
      update transacoes set
        titulo = coalesce(${titulo}, titulo),
        categoria = coalesce(${categoria}, categoria),
        descricao = coalesce(${descricao}, descricao),
        valor = coalesce(${valor}, valor),
        data = coalesce(${data}, data),
        conta_id = coalesce(${conta_id}, conta_id)
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
      delete from transacoes where id = ${id} and user_id = ${userId} returning id
    `
    if (!row) return res.status(404).json({ error: 'não encontrado' })
    return res.status(200).json({ deleted: true })
  }

  return res.status(405).json({ error: 'method_not_allowed' })
}


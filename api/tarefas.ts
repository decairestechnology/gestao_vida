import type { VercelRequest, VercelResponse } from '@vercel/node'
import { requireUser } from './_auth.js'
import { sql } from './_db.js'

// GET    /api/tarefas → lista todas as tarefas (e subtarefas) do usuário
// POST   /api/tarefas → cria tarefa ou subtarefa (se body tiver parent_id)
// PATCH  /api/tarefas → edita (body precisa ter "id")
// DELETE /api/tarefas → exclui (body precisa ter "id"; subtarefas somem junto por cascade)
export default async function handler(req: VercelRequest, res: VercelResponse) {
  let userId: string
  try {
    userId = await requireUser(req)
  } catch {
    return res.status(401).json({ error: 'unauthorized' })
  }

  if (req.method === 'GET') {
    const rows = await sql`
      select * from tarefas where user_id = ${userId} order by created_at asc limit 300
    `
    return res.status(200).json(rows)
  }

  if (req.method === 'POST') {
    const { titulo, tag, vencimento, prioridade, recorrente, parent_id, recorrencia_intervalo_dias } = req.body ?? {}
    if (!titulo) return res.status(400).json({ error: 'titulo é obrigatório' })
    const [row] = await sql`
      insert into tarefas (user_id, titulo, tag, vencimento, prioridade, recorrente, parent_id, recorrencia_intervalo_dias)
      values (${userId}, ${titulo}, ${tag ?? null}, ${vencimento ?? null}, ${prioridade ?? 'media'}, ${recorrente ?? false}, ${parent_id ?? null}, ${recorrencia_intervalo_dias ?? 30})
      returning *
    `
    return res.status(201).json(row)
  }

  if (req.method === 'PATCH') {
    const { id, titulo, status, tag, vencimento, prioridade, recorrente } = req.body ?? {}
    if (!id) return res.status(400).json({ error: 'id é obrigatório' })
    const [row] = await sql`
      update tarefas set
        titulo = coalesce(${titulo}, titulo),
        status = coalesce(${status}, status),
        tag = coalesce(${tag}, tag),
        vencimento = coalesce(${vencimento}, vencimento),
        prioridade = coalesce(${prioridade}, prioridade),
        recorrente = coalesce(${recorrente}, recorrente)
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
      delete from tarefas where id = ${id} and user_id = ${userId} returning id
    `
    if (!row) return res.status(404).json({ error: 'não encontrado' })
    return res.status(200).json({ deleted: true })
  }

  return res.status(405).json({ error: 'method_not_allowed' })
}

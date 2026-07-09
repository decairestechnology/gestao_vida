import type { VercelRequest, VercelResponse } from '@vercel/node'
import { requireUser } from './_auth.js'
import { sql } from './_db.js'
import { hojeBrasilia } from './_date.js'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  let userId: string
  try {
    userId = await requireUser(req)
  } catch {
    return res.status(401).json({ error: 'unauthorized' })
  }

  if (req.method === 'GET') {
    const ativos = await sql`
      select * from investimentos_ativos where user_id = ${userId} order by created_at asc limit 200
    `
    const aportes = await sql`
      select a.* from investimentos_aportes a
      join investimentos_ativos i on i.id = a.ativo_id
      where i.user_id = ${userId}
      order by a.data asc
      limit 500
    `
    return res.status(200).json({ ativos, aportes })
  }

  if (req.method === 'POST') {
    const { nome, classe, valor_atual, rentabilidade_12m, meta_id } = req.body ?? {}
    if (!nome || !classe) return res.status(400).json({ error: 'nome e classe são obrigatórios' })
    const [row] = await sql`
      insert into investimentos_ativos (user_id, nome, classe, valor_atual, rentabilidade_12m, meta_id)
      values (${userId}, ${nome}, ${classe}, ${valor_atual ?? 0}, ${rentabilidade_12m ?? null}, ${meta_id ?? null})
      returning *
    `
    return res.status(201).json(row)
  }

  if (req.method === 'PATCH') {
    const { id, nome, classe, rentabilidade_12m, meta_id } = req.body ?? {}
    if (!id) return res.status(400).json({ error: 'id é obrigatório' })
    const [row] = await sql`
      update investimentos_ativos set
        nome = coalesce(${nome}, nome),
        classe = coalesce(${classe}, classe),
        rentabilidade_12m = coalesce(${rentabilidade_12m}, rentabilidade_12m),
        meta_id = coalesce(${meta_id}, meta_id)
      where id = ${id} and user_id = ${userId}
      returning *
    `
    if (!row) return res.status(404).json({ error: 'não encontrado' })
    return res.status(200).json(row)
  }

  if (req.method === 'DELETE') {
    const { id } = req.body ?? {}
    if (!id) return res.status(400).json({ error: 'id é obrigatório' })
    const [row] = await sql`delete from investimentos_ativos where id = ${id} and user_id = ${userId} returning id`
    if (!row) return res.status(404).json({ error: 'não encontrado' })
    return res.status(200).json({ deleted: true })
  }

  // PUT = registrar aporte (soma no valor_atual do ativo). Vive aqui, não em arquivo próprio,
  // pra não estourar o limite de funções serverless do plano Hobby da Vercel (máx. 12).
  if (req.method === 'PUT') {
    const { ativo_id, valor, data } = req.body ?? {}
    if (!ativo_id || valor === undefined) return res.status(400).json({ error: 'ativo_id e valor são obrigatórios' })

    const [dono] = await sql`select id from investimentos_ativos where id = ${ativo_id} and user_id = ${userId}`
    if (!dono) return res.status(404).json({ error: 'ativo não encontrado' })

    const [aporte] = await sql`
      insert into investimentos_aportes (user_id, ativo_id, valor, data)
      values (${userId}, ${ativo_id}, ${valor}, ${data ?? hojeBrasilia()})
      returning *
    `
    const [ativoAtualizado] = await sql`
      update investimentos_ativos set valor_atual = valor_atual + ${valor}
      where id = ${ativo_id}
      returning *
    `
    return res.status(201).json({ aporte, ativo: ativoAtualizado })
  }

  return res.status(405).json({ error: 'method_not_allowed' })
}

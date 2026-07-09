import type { VercelRequest, VercelResponse } from '@vercel/node'
import { sql } from '../_db.js'
import { hojeBrasilia } from '../_date.js'

// Roda 1x por dia (configurado em vercel.json). A Vercel manda
// "Authorization: Bearer $CRON_SECRET" automaticamente quando CRON_SECRET
// está configurado nas env vars — é assim que autenticamos sem precisar de usuário.
export default async function handler(req: VercelRequest, res: VercelResponse) {
  const auth = req.headers.authorization
  if (!process.env.CRON_SECRET || auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: 'unauthorized' })
  }

  // Tarefas: quando uma tarefa recorrente é concluída, gera a próxima ocorrência
  // (vencimento antigo + intervalo em dias), uma única vez por tarefa concluída.
  const tarefasParaRenovar = await sql`
    select * from tarefas
    where recorrente = true and status = 'concluida' and proxima_gerada = false
  `
  for (const t of tarefasParaRenovar) {
    const baseData = t.vencimento ? new Date(t.vencimento) : new Date(`${hojeBrasilia()}T00:00:00Z`)
    const novaData = new Date(baseData)
    novaData.setDate(novaData.getDate() + (t.recorrencia_intervalo_dias ?? 30))

    await sql`
      insert into tarefas (user_id, titulo, tag, vencimento, prioridade, recorrente, recorrencia_intervalo_dias)
      values (${t.user_id}, ${t.titulo}, ${t.tag}, ${novaData.toISOString().slice(0, 10)}, ${t.prioridade}, true, ${t.recorrencia_intervalo_dias})
    `
    await sql`update tarefas set proxima_gerada = true where id = ${t.id}`
  }

  // Transações recorrentes (assinatura, aluguel etc.): quando a data + intervalo já passou,
  // gera a próxima automaticamente.
  const transacoesParaRenovar = await sql`
    select * from transacoes
    where recorrente = true and proxima_gerada = false
      and (data + (recorrencia_intervalo_dias || ' days')::interval) <= current_date
  `
  for (const t of transacoesParaRenovar) {
    const novaData = new Date(t.data)
    novaData.setDate(novaData.getDate() + (t.recorrencia_intervalo_dias ?? 30))

    await sql`
      insert into transacoes (user_id, conta_id, titulo, categoria, descricao, valor, data, recorrente, recorrencia_intervalo_dias, origem)
      values (${t.user_id}, ${t.conta_id}, ${t.titulo}, ${t.categoria}, ${t.descricao}, ${t.valor}, ${novaData.toISOString().slice(0, 10)}, true, ${t.recorrencia_intervalo_dias}, 'recorrencia')
    `
    await sql`update transacoes set proxima_gerada = true where id = ${t.id}`
  }

  return res.status(200).json({
    tarefas_renovadas: tarefasParaRenovar.length,
    transacoes_renovadas: transacoesParaRenovar.length,
  })
}

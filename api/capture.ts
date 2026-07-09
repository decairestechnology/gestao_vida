import type { VercelRequest, VercelResponse } from '@vercel/node'
import Anthropic from '@anthropic-ai/sdk'
import { requireUser } from './_auth.js'
import { sql } from './_db.js'

// ANTHROPIC_API_KEY vem do console.anthropic.com → API Keys
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! })

const SYSTEM_PROMPT = `Você classifica textos curtos em português de um sistema pessoal de controle.
Dado o texto do usuário, responda APENAS com um JSON (sem markdown, sem texto extra) no formato:

{
  "tipo": "transacao" | "tarefa" | "nota",
  "transacao": { "titulo": string, "categoria": string, "valor": number, "data": "YYYY-MM-DD" } | null,
  "tarefa": { "titulo": string, "tag": string | null, "vencimento": "YYYY-MM-DD" | null, "prioridade": "alta"|"media"|"baixa" } | null,
  "nota": { "titulo": string, "corpo": string, "tag": string | null } | null
}

Regras:
- "valor" de transação é negativo para gasto, positivo para receita.
- Se não houver data explícita na tarefa, "vencimento" é null.
- Preencha só o campo do tipo escolhido; os outros dois ficam null.
- A data de hoje é ${new Date().toISOString().slice(0, 10)}.`

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'method_not_allowed' })

  let userId: string
  try {
    userId = await requireUser(req)
  } catch {
    return res.status(401).json({ error: 'unauthorized' })
  }

  const { texto } = req.body ?? {}
  if (!texto || typeof texto !== 'string') {
    return res.status(400).json({ error: 'campo "texto" é obrigatório' })
  }

  const message = await anthropic.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 500,
    system: SYSTEM_PROMPT,
    messages: [{ role: 'user', content: texto }],
  })

  const raw = message.content.find((b) => b.type === 'text')?.text ?? '{}'
  let parsed
  try {
    parsed = JSON.parse(raw.replace(/```json|```/g, '').trim())
  } catch {
    return res.status(502).json({ error: 'falha ao interpretar resposta da IA' })
  }

  // Grava direto no banco de acordo com o tipo classificado
  try {
    if (parsed.tipo === 'transacao' && parsed.transacao) {
      const t = parsed.transacao
      await sql`
        insert into transacoes (user_id, titulo, categoria, valor, data, origem)
        values (${userId}, ${t.titulo}, ${t.categoria}, ${t.valor}, ${t.data}, 'ia')
      `
    } else if (parsed.tipo === 'tarefa' && parsed.tarefa) {
      const t = parsed.tarefa
      await sql`
        insert into tarefas (user_id, titulo, tag, vencimento, prioridade)
        values (${userId}, ${t.titulo}, ${t.tag}, ${t.vencimento}, ${t.prioridade})
      `
    } else if (parsed.tipo === 'nota' && parsed.nota) {
      const n = parsed.nota
      await sql`
        insert into notas (user_id, titulo, corpo, tag)
        values (${userId}, ${n.titulo}, ${n.corpo}, ${n.tag})
      `
    }
  } catch (err) {
    return res.status(500).json({ error: 'falha ao salvar no banco', details: String(err) })
  }

  return res.status(200).json({ classificado: parsed })
}
import type { VercelRequest, VercelResponse } from '@vercel/node'
import Anthropic from '@anthropic-ai/sdk'
import { requireUser } from './_auth.js'
import { sql } from './_db.js'

// ANTHROPIC_API_KEY vem do console.anthropic.com → API Keys
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! })

const SYSTEM_PROMPT = `Você é a Scout, a assistente virtual de captura rápida de um sistema pessoal de controle.
Dado um texto curto em português, responda APENAS com um JSON (sem markdown, sem texto extra) no formato:

{
  "tipo": "transacao" | "tarefa" | "nota" | "indefinido",
  "transacao": { "titulo": string, "categoria": string, "valor": number, "data": "YYYY-MM-DD" } | null,
  "tarefa": { "titulo": string, "tag": string | null, "vencimento": "YYYY-MM-DD" | null, "prioridade": "alta"|"media"|"baixa" } | null,
  "nota": { "titulo": string, "corpo": string, "tag": string | null } | null,
  "motivo": string | null
}

Regras:
- "valor" de transação é negativo para gasto, positivo para receita.
- Se não houver data explícita na tarefa, "vencimento" é null.
- Preencha só o campo do tipo escolhido; os outros ficam null.
- Se o texto não for claramente um gasto/receita, uma tarefa ou uma nota — por exemplo, uma pergunta, um cumprimento, ou algo ambíguo demais pra classificar com segurança — responda "tipo": "indefinido", todos os três campos null, e em "motivo" uma frase curta em português explicando por quê (ex: "isso parece uma pergunta, não um lançamento").
- Nunca force uma classificação só pra preencher algo. Na dúvida, use "indefinido".
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
    return res.status(200).json({
      sucesso: false,
      mensagem: 'A Scout não conseguiu entender essa resposta. Tenta descrever de outro jeito.',
    })
  }

  if (parsed.tipo === 'indefinido' || (!parsed.transacao && !parsed.tarefa && !parsed.nota)) {
    return res.status(200).json({
      sucesso: false,
      mensagem: parsed.motivo || 'A Scout não conseguiu entender esse pedido. Tenta ser mais específico.',
    })
  }

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
    } else {
      return res.status(200).json({
        sucesso: false,
        mensagem: 'A Scout não conseguiu entender esse pedido. Tenta ser mais específico.',
      })
    }
  } catch (err) {
    return res.status(200).json({
      sucesso: false,
      mensagem: 'A Scout entendeu, mas não conseguiu salvar. Tenta de novo em instantes.',
    })
  }

  return res.status(200).json({ sucesso: true, classificado: parsed })
}

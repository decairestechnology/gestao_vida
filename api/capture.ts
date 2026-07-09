import type { VercelRequest, VercelResponse } from '@vercel/node'
import Anthropic from '@anthropic-ai/sdk'
import { requireUser } from './_auth.js'
import { sql } from './_db.js'

// ANTHROPIC_API_KEY vem do console.anthropic.com → API Keys
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! })

const SYSTEM_PROMPT = `Você é a Scout, a assistente virtual de captura rápida de um sistema pessoal de controle.
Dado um texto curto em português, responda APENAS com um JSON (sem markdown, sem texto extra) no formato:

{
  "acao": "criar" | "editar" | "excluir" | "indefinido",
  "entidade": "transacao" | "tarefa" | "nota" | null,
  "busca": string | null,
  "dados": {
    "titulo": string | null,
    "categoria": string | null,
    "valor": number | null,
    "data": "YYYY-MM-DD" | null,
    "tag": string | null,
    "vencimento": "YYYY-MM-DD" | null,
    "prioridade": "alta" | "media" | "baixa" | null,
    "corpo": string | null
  },
  "motivo": string | null
}

Regras:
- "acao": "criar" quando o texto descreve algo novo (gasto, receita, tarefa, lembrete, nota). "editar" quando pede pra mudar algo que já existe (ex: "muda a data da tarefa X pra amanhã"). "excluir" quando pede pra apagar/remover algo (ex: "apaga o lançamento do mercado"). "indefinido" se não for nenhum desses três com clareza.
- "entidade": qual tipo de registro (transacao = gasto/receita, tarefa, nota). Null se "acao" for "indefinido".
- "busca": só preenchido em "editar"/"excluir" — um trecho do título/nome pra localizar o registro existente (ex: "mercado", "revisar orçamento").
- "dados": preenche só os campos relevantes pro que foi pedido; o resto fica null. Em "criar" é o registro novo; em "editar" são só os campos que devem mudar.
- "valor" de transação é negativo pra gasto, positivo pra receita.
- Se não conseguir classificar com segurança em nenhuma das três ações, use "indefinido" com um "motivo" curto explicando por quê. Nunca force uma resposta.
- A data de hoje é ${new Date().toISOString().slice(0, 10)}.`

const ENTIDADE_VALIDA = ['transacao', 'tarefa', 'nota'] as const
type Entidade = typeof ENTIDADE_VALIDA[number]

async function buscar(entidade: Entidade, userId: string, termo: string) {
  const like = `%${termo}%`
  if (entidade === 'transacao') {
    return sql`select id, titulo from transacoes where user_id = ${userId} and titulo ilike ${like} order by created_at desc limit 5`
  }
  if (entidade === 'tarefa') {
    return sql`select id, titulo from tarefas where user_id = ${userId} and titulo ilike ${like} order by created_at desc limit 5`
  }
  return sql`select id, titulo from notas where user_id = ${userId} and titulo ilike ${like} order by created_at desc limit 5`
}

async function excluirPorId(entidade: Entidade, userId: string, id: string) {
  if (entidade === 'transacao') return sql`delete from transacoes where id = ${id} and user_id = ${userId}`
  if (entidade === 'tarefa') return sql`delete from tarefas where id = ${id} and user_id = ${userId}`
  return sql`delete from notas where id = ${id} and user_id = ${userId}`
}

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
    return res.status(200).json({ sucesso: false, mensagem: 'A Scout não conseguiu entender essa resposta. Tenta descrever de outro jeito.' })
  }

  if (parsed.acao === 'indefinido' || !parsed.entidade) {
    return res.status(200).json({
      sucesso: false,
      mensagem: parsed.motivo || 'A Scout não conseguiu entender esse pedido. Tenta ser mais específico.',
    })
  }

  const d = parsed.dados ?? {}

  try {
    if (parsed.acao === 'criar') {
      if (parsed.entidade === 'transacao') {
        if (!d.titulo || !d.categoria || d.valor == null) {
          return res.status(200).json({ sucesso: false, mensagem: 'A Scout entendeu que é um lançamento, mas faltou título, categoria ou valor.' })
        }
        await sql`
          insert into transacoes (user_id, titulo, categoria, valor, data, origem)
          values (${userId}, ${d.titulo}, ${d.categoria}, ${d.valor}, ${d.data ?? new Date().toISOString().slice(0, 10)}, 'ia')
        `
      } else if (parsed.entidade === 'tarefa') {
        if (!d.titulo) {
          return res.status(200).json({ sucesso: false, mensagem: 'A Scout entendeu que é uma tarefa, mas faltou o título.' })
        }
        await sql`
          insert into tarefas (user_id, titulo, tag, vencimento, prioridade)
          values (${userId}, ${d.titulo}, ${d.tag ?? null}, ${d.vencimento ?? null}, ${d.prioridade ?? 'media'})
        `
      } else if (parsed.entidade === 'nota') {
        if (!d.titulo || !d.corpo) {
          return res.status(200).json({ sucesso: false, mensagem: 'A Scout entendeu que é uma nota, mas faltou título ou conteúdo.' })
        }
        await sql`
          insert into notas (user_id, titulo, corpo, tag)
          values (${userId}, ${d.titulo}, ${d.corpo}, ${d.tag ?? null})
        `
      }
      return res.status(200).json({ sucesso: true, acao: 'criar', entidade: parsed.entidade })
    }

    if (parsed.acao === 'editar' || parsed.acao === 'excluir') {
      const entidade = parsed.entidade as Entidade
      if (!ENTIDADE_VALIDA.includes(entidade) || !parsed.busca) {
        return res.status(200).json({ sucesso: false, mensagem: 'A Scout precisa de um nome ou trecho pra encontrar o item certo.' })
      }

      const encontrados = await buscar(entidade, userId, parsed.busca)

      if (encontrados.length === 0) {
        return res.status(200).json({ sucesso: false, mensagem: `A Scout não encontrou nada parecido com "${parsed.busca}".` })
      }
      if (encontrados.length > 1) {
        const nomes = encontrados.map((e: { titulo: string }) => `"${e.titulo}"`).join(', ')
        return res.status(200).json({ sucesso: false, mensagem: `A Scout encontrou mais de um resultado (${nomes}) — tenta ser mais específico.` })
      }

      const alvo = encontrados[0] as { id: string; titulo: string }

      if (parsed.acao === 'excluir') {
        await excluirPorId(entidade, userId, alvo.id)
        return res.status(200).json({ sucesso: true, acao: 'excluir', entidade: parsed.entidade, titulo: alvo.titulo })
      }

      // editar
      if (parsed.entidade === 'transacao') {
        await sql`
          update transacoes set
            titulo = coalesce(${d.titulo}, titulo),
            categoria = coalesce(${d.categoria}, categoria),
            valor = coalesce(${d.valor}, valor),
            data = coalesce(${d.data}, data)
          where id = ${alvo.id} and user_id = ${userId}
        `
      } else if (parsed.entidade === 'tarefa') {
        await sql`
          update tarefas set
            titulo = coalesce(${d.titulo}, titulo),
            tag = coalesce(${d.tag}, tag),
            vencimento = coalesce(${d.vencimento}, vencimento),
            prioridade = coalesce(${d.prioridade}, prioridade)
          where id = ${alvo.id} and user_id = ${userId}
        `
      } else if (parsed.entidade === 'nota') {
        await sql`
          update notas set
            titulo = coalesce(${d.titulo}, titulo),
            corpo = coalesce(${d.corpo}, corpo),
            tag = coalesce(${d.tag}, tag)
          where id = ${alvo.id} and user_id = ${userId}
        `
      }
      return res.status(200).json({ sucesso: true, acao: 'editar', entidade: parsed.entidade, titulo: alvo.titulo })
    }

    return res.status(200).json({ sucesso: false, mensagem: 'A Scout não conseguiu entender esse pedido.' })
  } catch (err) {
    return res.status(200).json({ sucesso: false, mensagem: 'A Scout entendeu, mas não conseguiu salvar. Tenta de novo em instantes.' })
  }
}

import type { VercelRequest, VercelResponse } from '@vercel/node'
import Anthropic from '@anthropic-ai/sdk'
import { requireUser } from './_auth.js'
import { sql } from './_db.js'

// GET  /api/dashboard → uma chamada só, devolve tudo que Dashboard e Relatórios usam.
// POST /api/dashboard → análise da Scout sobre um resumo de números (vive aqui, não em
//      arquivo próprio, pra não estourar o limite de funções serverless da Vercel).
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! })

const SYSTEM_PROMPT = `Você é a Scout, a assistente virtual de um sistema pessoal de controle.
Vai receber um resumo em JSON com os números do período (saldo mensal, gastos por categoria,
aderência de hábitos, tarefas concluídas). Escreva uma análise curta em português, em texto corrido
(não JSON, não markdown com títulos grandes — pode usar **negrito** pontual e listas simples com "-").

Regras:
- No máximo 4 parágrafos curtos ou uma mistura de 1-2 parágrafos + uma lista de 2-4 pontos.
- Aponte o que se destaca (positivo ou preocupante) nos números, não apenas repita os dados.
- Se algo parecer fora do padrão (categoria de gasto crescendo, hábito caindo, saldo negativo
  seguido), comente com uma sugestão prática e direta.
- Tom direto e levemente caloroso, sem ser piegas. Nada de "espero que isso ajude" no final.
- Se os dados forem insuficientes pra dizer algo com confiança, diga isso claramente em vez de inventar.`

export default async function handler(req: VercelRequest, res: VercelResponse) {
  let userId: string
  try {
    userId = await requireUser(req)
  } catch {
    return res.status(401).json({ error: 'unauthorized' })
  }

  if (req.method === 'GET') {
    const [transacoes, tarefas, habitos, ativos, aportes, notas, metas] = await Promise.all([
      sql`select * from transacoes where user_id = ${userId} and data >= current_date - interval '6 months' order by data desc limit 300`,
      sql`select * from tarefas where user_id = ${userId} order by created_at asc limit 300`,
      sql`
        select h.*,
          coalesce(array_agg(to_char(hc.data, 'YYYY-MM-DD') order by hc.data) filter (where hc.data is not null), '{}') as checks
        from habitos h
        left join habito_checks hc on hc.habito_id = h.id and hc.data >= current_date - interval '29 days'
        where h.user_id = ${userId} and h.ativo = true
        group by h.id
        order by h.created_at asc
        limit 100
      `,
      sql`select * from investimentos_ativos where user_id = ${userId} order by created_at asc limit 200`,
      sql`
        select a.* from investimentos_aportes a
        join investimentos_ativos i on i.id = a.ativo_id
        where i.user_id = ${userId}
        order by a.data asc
        limit 500
      `,
      sql`select * from notas where user_id = ${userId} order by pinned desc, created_at desc limit 200`,
      sql`select * from metas where user_id = ${userId} order by concluida asc, prazo asc nulls last limit 100`,
    ])

    return res.status(200).json({
      transacoes,
      tarefas,
      habitos,
      investimentos: { ativos, aportes },
      notas,
      metas,
    })
  }

  if (req.method === 'POST') {
    const { resumo } = req.body ?? {}
    if (!resumo) return res.status(400).json({ error: 'campo "resumo" é obrigatório' })

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 700,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: JSON.stringify(resumo) }],
    })

    const texto = message.content.find((b) => b.type === 'text')?.text ?? ''
    if (!texto) {
      return res.status(200).json({ sucesso: false, mensagem: 'A Scout não conseguiu gerar a análise agora. Tenta de novo.' })
    }
    return res.status(200).json({ sucesso: true, analise: texto })
  }

  return res.status(405).json({ error: 'method_not_allowed' })
}

import type { VercelRequest, VercelResponse } from '@vercel/node'
import Anthropic from '@anthropic-ai/sdk'
import { requireUser } from './_auth.js'

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
  if (req.method !== 'POST') return res.status(405).json({ error: 'method_not_allowed' })

  try {
    await requireUser(req)
  } catch {
    return res.status(401).json({ error: 'unauthorized' })
  }

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

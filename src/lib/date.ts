// Centraliza "qual é a data de hoje" no fuso de Brasília (America/Sao_Paulo).
// Nunca usar `new Date().toISOString().slice(0,10)` direto — isso pega o fuso UTC
// do navegador/servidor e desalinha "hoje" à noite (ex: 21h em Brasília já é
// o dia seguinte em UTC).

export function hojeBrasilia(): string {
  return new Date().toLocaleDateString('en-CA', { timeZone: 'America/Sao_Paulo' })
}

// Soma (ou subtrai, se negativo) dias numa data YYYY-MM-DD sem depender de fuso —
// trata a data como um calendário puro, não como instante no tempo.
export function deslocarDias(dataISO: string, dias: number): string {
  const [y, m, d] = dataISO.split('-').map(Number)
  const dt = new Date(Date.UTC(y, m - 1, d))
  dt.setUTCDate(dt.getUTCDate() + dias)
  return dt.toISOString().slice(0, 10)
}

// Formata uma data-só (YYYY-MM-DD, sem hora) pra DD/MM/AAAA sem NUNCA passar
// por `new Date(string)` — isso é o que causa o erro clássico de "um dia a menos"
// (o navegador lê a string como UTC meia-noite e ao exibir no fuso de Brasília
// isso volta pro dia anterior). Aqui é só reordenar o texto, sem fuso nenhum envolvido.
export function formatarDataBR(dataISO: string): string {
  const [y, m, d] = dataISO.slice(0, 10).split('-')
  return `${d}/${m}/${y}`
}

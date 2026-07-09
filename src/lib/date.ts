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

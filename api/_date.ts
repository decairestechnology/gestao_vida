// Mesma lógica de src/lib/date.ts, mas pro lado do backend (api/) —
// os dois lados não compartilham build, por isso duplicado aqui.

export function hojeBrasilia(): string {
  return new Date().toLocaleDateString('en-CA', { timeZone: 'America/Sao_Paulo' })
}

export function deslocarDias(dataISO: string, dias: number): string {
  const [y, m, d] = dataISO.split('-').map(Number)
  const dt = new Date(Date.UTC(y, m - 1, d))
  dt.setUTCDate(dt.getUTCDate() + dias)
  return dt.toISOString().slice(0, 10)
}

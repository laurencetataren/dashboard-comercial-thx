// Formata valor em reais (R$ 654.421)
export function fmtCurrency(value) {
  if (value === null || value === undefined) return 'R$ 0'
  return 'R$ ' + Math.round(value).toLocaleString('pt-BR')
}

// Formata valor em reais compacto (R$ 654K, R$ 1.07M)
export function fmtCurrencyShort(value) {
  if (!value) return 'R$ 0'
  if (value >= 1000000) return `R$ ${(value / 1000000).toFixed(2).replace('.', ',')}M`
  if (value >= 1000) return `R$ ${(value / 1000).toFixed(0)}K`
  return fmtCurrency(value)
}

// Formata percentual
export function fmtPct(value, decimals = 1) {
  if (value === null || value === undefined) return '0%'
  return `${value.toFixed(decimals)}%`
}

// Mes formato "Mar/26" a partir de "2026-03"
export function fmtMes(mesStr) {
  if (!mesStr) return ''
  const meses = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']
  const [ano, mes] = mesStr.split('-')
  const idx = parseInt(mes) - 1
  return `${meses[idx]}/${ano.slice(2)}`
}

// Mes formato completo "Marco 2026"
export function fmtMesFull(mesStr) {
  if (!mesStr) return ''
  const meses = ['Janeiro', 'Fevereiro', 'Marco', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro']
  const [ano, mes] = mesStr.split('-')
  const idx = parseInt(mes) - 1
  return `${meses[idx]} ${ano}`
}

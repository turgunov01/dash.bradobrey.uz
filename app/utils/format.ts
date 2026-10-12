export function formatDateTime(value?: string | null) {
  if (!value) {
    return 'Недоступно'
  }

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return value
  }

  return new Intl.DateTimeFormat('ru-RU', {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: 'Asia/Tashkent'
  }).format(date)
}

export function formatMoney(value?: number | string | null, currency = 'UZS') {
  const amount = Number(value || 0)

  return new Intl.NumberFormat('ru-RU', {
    currency,
    currencyDisplay: 'narrowSymbol',
    maximumFractionDigits: 0,
    style: 'currency'
  }).format(Number.isFinite(amount) ? amount : 0)
}

export function formatCount(value?: number | string | null) {
  const amount = Number(value || 0)

  return new Intl.NumberFormat('ru-RU').format(Number.isFinite(amount) ? amount : 0)
}

export function formatPercent(value?: number | string | null) {
  const amount = Number(value || 0)

  return `${amount.toFixed(1)}%`
}

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

const DASHBOARD_TIME_ZONE = 'Asia/Tashkent'

function datePartsInTimeZone(value = new Date(), timeZone = DASHBOARD_TIME_ZONE) {
  const parts = new Intl.DateTimeFormat('en-US', {
    day: '2-digit',
    month: '2-digit',
    timeZone,
    year: 'numeric'
  }).formatToParts(value)

  return {
    day: parts.find(part => part.type === 'day')?.value || '01',
    month: parts.find(part => part.type === 'month')?.value || '01',
    year: parts.find(part => part.type === 'year')?.value || '2000'
  }
}

export function currentDateInputValue(timeZone = DASHBOARD_TIME_ZONE) {
  const { day, month, year } = datePartsInTimeZone(new Date(), timeZone)
  return `${year}-${month}-${day}`
}

export function currentPeriodKey(timeZone = DASHBOARD_TIME_ZONE) {
  const { month, year } = datePartsInTimeZone(new Date(), timeZone)
  return `${year}-${month}`
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

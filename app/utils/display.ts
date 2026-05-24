const statusLabels: Record<string, string> = {
  active: 'Активно',
  called: 'Вызван',
  cancelled: 'Отменено',
  completed: 'Завершено',
  done: 'Завершено',
  error: 'Ошибка',
  inactive: 'Неактивно',
  in_progress: 'В работе',
  no_show: 'Не явился',
  not_in_time: 'Не вовремя',
  paid: 'Оплачено',
  pending: 'В ожидании',
  ready: 'Готово',
  started: 'Начато',
  success: 'Успешно',
  waiting: 'Ожидает'
}

const paymentLabels: Record<string, string> = {
  card: 'Карта',
  cash: 'Наличные',
  certificate: 'Сертификат',
  mixed: 'Смешанная',
  pending: 'Не указан'
}

const scopeLabels: Record<string, string> = {
  barber: 'Барбер',
  branch: 'Филиал',
  global: 'Общий'
}

function normalizeValue(value?: string | null) {
  return String(value || '').trim().toLowerCase()
}

export function formatStatusLabel(value?: string | null) {
  const normalized = normalizeValue(value)

  if (!normalized) {
    return 'Неизвестно'
  }

  return statusLabels[normalized] || String(value)
}

export function formatPaymentMethod(value?: string | null) {
  const normalized = normalizeValue(value)

  if (!normalized) {
    return 'Не указан'
  }

  return paymentLabels[normalized] || String(value)
}

export function formatScopeLabel(value?: string | null) {
  const normalized = normalizeValue(value)

  if (!normalized) {
    return 'Не выбран'
  }

  return scopeLabels[normalized] || String(value)
}

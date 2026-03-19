globalThis.__timing__.logStart('Load chunks/build/display-CyQec-Wd');const statusLabels = {
  active: "Активно",
  called: "Вызван",
  cancelled: "Отменено",
  completed: "Завершено",
  done: "Завершено",
  error: "Ошибка",
  inactive: "Неактивно",
  in_progress: "В работе",
  no_show: "Не явился",
  not_in_time: "Не вовремя",
  paid: "Оплачено",
  pending: "В ожидании",
  ready: "Готово",
  started: "Начато",
  success: "Успешно",
  waiting: "Ожидает"
};
const paymentLabels = {
  card: "Карта",
  cash: "Наличные",
  certificate: "Сертификат",
  pending: "Не указан"
};
const scopeLabels = {
  barber: "Барбер",
  branch: "Филиал",
  global: "Общий"
};
function normalizeValue(value) {
  return String(value || "").trim().toLowerCase();
}
function formatStatusLabel(value) {
  const normalized = normalizeValue(value);
  if (!normalized) {
    return "Неизвестно";
  }
  return statusLabels[normalized] || String(value);
}
function formatPaymentMethod(value) {
  const normalized = normalizeValue(value);
  if (!normalized) {
    return "Не указан";
  }
  return paymentLabels[normalized] || String(value);
}
function formatScopeLabel(value) {
  const normalized = normalizeValue(value);
  if (!normalized) {
    return "Не выбран";
  }
  return scopeLabels[normalized] || String(value);
}

export { formatStatusLabel as a, formatScopeLabel as b, formatPaymentMethod as f };;globalThis.__timing__.logEnd('Load chunks/build/display-CyQec-Wd');
//# sourceMappingURL=display-CyQec-Wd.mjs.map

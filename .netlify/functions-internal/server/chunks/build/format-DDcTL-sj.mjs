globalThis.__timing__.logStart('Load chunks/build/format-DDcTL-sj');function formatDateTime(value) {
  if (!value) {
    return "Недоступно";
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  return new Intl.DateTimeFormat("ru-RU", {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(date);
}
function formatMoney(value, currency = "UZS") {
  const amount = Number(value || 0);
  return new Intl.NumberFormat("ru-RU", {
    currency,
    currencyDisplay: "narrowSymbol",
    maximumFractionDigits: 0,
    style: "currency"
  }).format(Number.isFinite(amount) ? amount : 0);
}
function formatCount(value) {
  const amount = Number(value || 0);
  return new Intl.NumberFormat("ru-RU").format(Number.isFinite(amount) ? amount : 0);
}
function formatPercent(value) {
  const amount = Number(value || 0);
  return `${amount.toFixed(1)}%`;
}

export { formatMoney as a, formatCount as b, formatPercent as c, formatDateTime as f };;globalThis.__timing__.logEnd('Load chunks/build/format-DDcTL-sj');
//# sourceMappingURL=format-DDcTL-sj.mjs.map

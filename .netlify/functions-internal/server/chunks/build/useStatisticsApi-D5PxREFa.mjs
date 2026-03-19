globalThis.__timing__.logStart('Load chunks/build/useStatisticsApi-D5PxREFa');import { e as useApiClient } from './server.mjs';

const keyLabels = {
  amount: "Сумма",
  completed: "Завершено",
  completed_orders: "Завершенные заказы",
  count: "Количество",
  orders: "Заказы",
  queue_count: "Элементы очереди",
  revenue: "Выручка",
  total_amount: "Итоговая сумма",
  total_clients: "Всего клиентов",
  total_revenue: "Общая выручка"
};
function asNumber(value, fallback = 0) {
  const amount = Number(value);
  return Number.isFinite(amount) ? amount : fallback;
}
function pickValue(source, keys, fallback) {
  for (const key of keys) {
    const value = source?.[key];
    if (value !== void 0 && value !== null && value !== "") {
      return String(value);
    }
  }
  return fallback;
}
function toKeyLabel(key) {
  if (keyLabels[key]) {
    return keyLabels[key];
  }
  return key.replace(/_/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}
function useStatisticsApi() {
  const client = useApiClient();
  return {
    barber(barberId, query) {
      return client.request(`/api/statistics/barbers/${barberId}`, { query });
    },
    branch(branchId, query) {
      return client.request(`/api/statistics/branches/${branchId}`, { query });
    },
    global(query) {
      return client.request("/api/statistics", { query });
    }
  };
}

export { asNumber as a, pickValue as p, toKeyLabel as t, useStatisticsApi as u };;globalThis.__timing__.logEnd('Load chunks/build/useStatisticsApi-D5PxREFa');
//# sourceMappingURL=useStatisticsApi-D5PxREFa.mjs.map

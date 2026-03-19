globalThis.__timing__.logStart('Load chunks/build/usePromoApi-DE1sz-6g');import { e as useApiClient } from './server.mjs';

function usePromoApi() {
  const client = useApiClient();
  return {
    create(payload) {
      return client.request("/api/promo-code/dashboard/create", {
        body: payload,
        method: "POST",
        successMessage: "Промокод создан"
      });
    },
    dashboard() {
      return client.request("/api/promo-code/dashboard");
    },
    detail(id) {
      return client.request(`/api/promo-code/dashboard/${id}`);
    },
    remove(id) {
      return client.request(`/api/promo-code/dashboard/${id}`, {
        method: "DELETE",
        successMessage: "Промокод удален"
      });
    },
    update(id, payload) {
      return client.request(`/api/promo-code/dashboard/${id}`, {
        body: payload,
        method: "PATCH",
        successMessage: "Промокод обновлен"
      });
    },
    use(payload) {
      return client.request("/api/promo-code/use", {
        body: payload,
        method: "POST",
        successMessage: "Использование промокода зафиксировано"
      });
    },
    validate(payload) {
      return client.request("/api/promo-code/validate", {
        body: payload,
        method: "POST",
        successMessage: "Промокод проверен"
      });
    }
  };
}

export { usePromoApi as u };;globalThis.__timing__.logEnd('Load chunks/build/usePromoApi-DE1sz-6g');
//# sourceMappingURL=usePromoApi-DE1sz-6g.mjs.map

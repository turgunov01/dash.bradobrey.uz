globalThis.__timing__.logStart('Load chunks/build/useKioskApi-l3XfHmhL');import { e as useApiClient } from './server.mjs';

function useKioskApi() {
  const client = useApiClient();
  return {
    barbers(branchId) {
      return client.request(`/api/kiosk/barbers/${branchId}`);
    },
    book(payload) {
      return client.request("/api/kiosk/book", { body: payload, method: "POST", successMessage: "Запись создана" });
    },
    certificate(code) {
      return client.request(`/api/kiosk/certificate/${code}`);
    },
    config() {
      return client.request("/api/kiosk/config");
    },
    index() {
      return client.request("/api/kiosk");
    },
    register(payload) {
      return client.request("/api/kiosk/register", { body: payload, method: "POST", successMessage: "Киоск зарегистрирован" });
    },
    services(query) {
      return client.request("/api/kiosk/services", { query });
    }
  };
}

export { useKioskApi as u };;globalThis.__timing__.logEnd('Load chunks/build/useKioskApi-l3XfHmhL');
//# sourceMappingURL=useKioskApi-l3XfHmhL.mjs.map

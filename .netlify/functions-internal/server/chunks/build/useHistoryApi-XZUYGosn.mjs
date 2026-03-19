globalThis.__timing__.logStart('Load chunks/build/useHistoryApi-XZUYGosn');import { e as useApiClient } from './server.mjs';

function useHistoryApi() {
  const client = useApiClient();
  return {
    barber(query) {
      return client.request("/api/history/barber", { query });
    },
    branch(branchId, query) {
      return client.request("/api/history/branch", {
        query: {
          ...query,
          id: branchId
        }
      });
    },
    list(query) {
      return client.request("/api/history", { query });
    }
  };
}

export { useHistoryApi as u };;globalThis.__timing__.logEnd('Load chunks/build/useHistoryApi-XZUYGosn');
//# sourceMappingURL=useHistoryApi-XZUYGosn.mjs.map

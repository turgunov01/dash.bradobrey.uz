import type {
  BarberProfile,
  BarberRegisterPayload,
  BarberUpdatePayload,
  BarberUser,
  BreakPayload,
  EmployeePermission,
  LoginPayload,
  QueueCompletePayload,
  QueueEditBeforeCompletePayload,
  QueueItem,
  QueueUpdatePayload,
} from "~~/shared/schemas";

type BackendLoginResponse = {
  token?: string;
  user?: BarberUser | null;
  branches?: Array<{ id: string; name: string }>;
};

export type PendingQueueTransfer = {
  id: string;
  queue_entry_id: string;
  client_name?: string | null;
  client_phone?: string | null;
  from_barber_id?: string | null;
  from_barber_name?: string | null;
  service_id?: string | null;
  service_ids?: string[] | null;
  order_status?: string | null;
  requested_at?: string | null;
  expires_at?: string | null;
};

export function useBarbersApi() {
  const client = useApiClient();

  return {
    break(minutes: BreakPayload) {
      return client.request("/api/barbers/break", {
        body: minutes,
        method: "POST",
        successMessage: "Перерыв начат",
      });
    },
    callQueue(id: string) {
      return client.request(`/api/barbers/queue/${id}/call`, {
        method: "PATCH",
        successMessage: "Клиент вызван",
      });
    },
    completeQueue(id: string, payload: QueueCompletePayload = {}) {
      return client.request(`/api/barbers/queue/${id}/complete`, {
        body: payload,
        method: "PATCH",
        successMessage: "Запись очереди завершена",
      });
    },
    list(query?: Record<string, unknown>) {
      return client.request<{
        items: Array<{
          branch_id: string | null;
          active_branch_id?: string | null;
          id: string;
          is_active?: boolean | null;
          is_archived?: boolean | null;
          login: string | null;
          name?: string | null;
          permissions?: EmployeePermission[];
          photo_url?: string | null;
          phone: string | null;
          role: string | null;
          specialization?: string | null;
        }>;
        total?: number;
      }>("/api/barbers", {
        method: "GET",
        query,
      });
    },
    login(payload: LoginPayload) {
      const config = useRuntimeConfig();
      const baseURL = String(config.public.apiBase || "https://api.bradobrey.uz").replace(/\/+$/, "");

      // Local development uses the same-origin Nuxt BFF route so the browser
      // does not send a cross-origin preflight request to the production API.
      const isLocalDashboard =
        import.meta.client &&
        ["localhost", "127.0.0.1", "::1"].includes(window.location.hostname);

      return $fetch<BackendLoginResponse>("/api/barbers/login", {
        ...(isLocalDashboard ? {} : { baseURL }),
        body: {
          ...(payload.branch_id ? { branch_id: payload.branch_id } : {}),
          ...(payload.location ? { location: payload.location } : {}),
          login: payload.login,
          password: payload.password,
        },
        credentials: isLocalDashboard ? "include" : "omit",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        method: "POST",
      }).then(response => ({
        ...response,
        authenticated: Boolean(response?.token),
      }));
    },
    logout(payload?: Record<string, unknown>, options: { silent?: boolean } = {}) {
      return client.request("/api/barbers/logout", {
        body: payload,
        method: "POST",
        ...(!options.silent ? { successMessage: "Выход выполнен" } : {}),
      });
    },
    me(options: { silent?: boolean; token?: string } = {}) {
      return client.request<{
        barber: BarberProfile | null;
        user: BarberUser | null;
      }>("/api/barbers/me", {
        ...(options.token ? { headers: { Authorization: `Bearer ${options.token}` } } : {}),
        method: "GET",
        silent: options.silent,
      });
    },
    switchBranch(branch_id: string) {
      return client.request<BackendLoginResponse & { barber?: BarberProfile | null }>("/api/barbers/me/branch", {
        body: { branch_id },
        method: "POST",
      });
    },
    pendingTransfers() {
      return client.request<{ items: PendingQueueTransfer[] }>('/api/barbers/queue/transfers/pending', {
        method: 'GET',
        silent: true
      });
    },
    respondToTransfer(id: string, decision: 'accept' | 'reject') {
      return client.request(`/api/barbers/queue/transfers/${id}/${decision}`, {
        method: 'PATCH',
        successMessage: decision === 'accept' ? 'Передача клиента принята' : 'Передача клиента отклонена'
      });
    },
    queueHistory(query?: Record<string, unknown>) {
      return client.request<{ items: QueueItem[]; total?: number }>(
        "/api/history/barber",
        { query },
      );
    },
    queueItem(id: string, options: { silent?: boolean } = {}) {
      return client.rawRequest<QueueItem>(`/api/barbers/queue/${id}`, {
        method: "GET",
        silent: options.silent,
      });
    },
    register(payload: BarberRegisterPayload | FormData) {
      return client.request("/api/barbers/register", {
        body: payload,
        method: "POST",
        successMessage: "Сотрудник создан",
      });
    },
    archive(id: string) {
      return client.request(`/api/barbers/${id}/archive`, {
        method: "PATCH",
        successMessage: "Сотрудник уволен",
      });
    },
    restore(id: string) {
      return client.request(`/api/barbers/${id}/restore`, {
        method: "PATCH",
        successMessage: "Сотрудник восстановлен",
      });
    },
    returnFromBreak() {
      return client.request("/api/barbers/return", {
        method: "POST",
        successMessage: "Возврат с перерыва выполнен",
      });
    },
    startQueue(id: string) {
      return client.request(`/api/barbers/queue/${id}/start`, {
        method: "PATCH",
        successMessage: "Услуга начата",
      });
    },
    startShift() {
      return client.request("/api/barbers/shift/start", {
        method: "POST",
        successMessage: "Смена начата",
      });
    },
    endShift() {
      return client.request("/api/barbers/shift/end", {
        method: "POST",
        successMessage: "Смена завершена",
      });
    },
    update(id: string, payload: BarberUpdatePayload | FormData) {
      return client.request(`/api/barbers/${id}`, {
        body: payload,
        method: "PATCH",
        successMessage: "Сотрудник обновлен",
      });
    },
    updateMe(body: FormData | Record<string, unknown>) {
      return client.request("/api/barbers/me", {
        body,
        method: "PATCH",
        successMessage: "Профиль обновлен",
      });
    },
    updateQueue(id: string, payload: QueueUpdatePayload) {
      return client.request(`/api/barbers/queue/${id}`, {
        body: payload,
        method: "PATCH",
        successMessage: "Запись очереди обновлена",
      });
    },
    updateQueueBeforeComplete(
      id: string,
      payload: QueueEditBeforeCompletePayload,
    ) {
      return client.request(`/api/barbers/queue/${id}/edit-before-complete`, {
        body: payload,
        method: "PATCH",
        successMessage: "Корректировка перед завершением сохранена",
      });
    },
    updateQueueNoShow(id: string, payload?: { no_show?: boolean }) {
      return client.request(`/api/barbers/queue/${id}/no-show`, {
        body: payload,
        method: "PATCH",
        successMessage: "Запись отмечена как неявка",
      });
    },
    updateQueueNotInTime(id: string) {
      return client.request(`/api/barbers/queue/${id}/not-in-time`, {
        method: "PATCH",
        successMessage: "Запись отмечена как не вовремя",
      });
    },
  };
}

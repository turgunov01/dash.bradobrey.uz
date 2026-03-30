import type {
  BarberProfile,
  BarberRegisterPayload,
  BarberUpdatePayload,
  BarberUser,
  BreakPayload,
  EmployeePermission,
  LoginPayload,
  QueueEditBeforeCompletePayload,
  QueueItem,
  QueueUpdatePayload,
} from "~~/shared/schemas";

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
    completeQueue(id: string) {
      return client.request(`/api/barbers/queue/${id}/complete`, {
        method: "PATCH",
        successMessage: "Запись очереди завершена",
      });
    },
    list(query?: Record<string, unknown>) {
      return client.request<{
        items: Array<{
          branch_id: string | null;
          id: string;
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
      return client.request<any>("/api/barbers/login", {
        body: payload,
        method: "POST",
        successMessage: "Вход выполнен",
      });
    },
    logout(payload?: Record<string, unknown>) {
      return client.request("/api/barbers/logout", {
        body: payload,
        method: "POST",
        successMessage: "Выход выполнен",
      });
    },
    me(options: { silent?: boolean } = {}) {
      return client.request<{
        barber: BarberProfile | null;
        user: BarberUser | null;
      }>("/api/barbers/me", {
        method: "GET",
        silent: options.silent,
      });
    },
    queue() {
      return client.request<{ count: number; items: QueueItem[] }>(
        "/api/barbers/queue",
      );
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
    remove(id: string) {
      return client.request(`/api/barbers/${id}`, {
        method: "DELETE",
        successMessage: "Сотрудник удален",
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

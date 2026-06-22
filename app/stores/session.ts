import { computed, ref } from "vue";
import { defineStore } from "pinia";
import type {
  BarberProfile,
  BarberUser,
  LoginPayload,
} from "~~/shared/schemas";

type SessionStatus = "idle" | "loading" | "loaded";

type SessionSnapshot = {
  barber: BarberProfile | null;
  user: BarberUser | null;
};

export const useSessionStore = defineStore("session", () => {
  const barbersApi = useBarbersApi();
  const adminToken = useAdminToken();

  const barber = ref<BarberProfile | null>(null);
  const user = ref<BarberUser | null>(null);
  const status = ref<SessionStatus>("idle");

  const isAuthenticated = computed(() => Boolean(user.value));

  async function ensureLoaded(options: { force?: boolean } = {}): Promise<SessionSnapshot> {
    if (status.value === "loaded" && !options.force) {
      return { barber: barber.value, user: user.value };
    }

    status.value = "loading";

    try {
      const response = await barbersApi.me({ silent: true });

      barber.value = response?.barber ?? null;
      user.value = response?.user ?? null;
    } catch {
      barber.value = null;
      user.value = null;
    } finally {
      status.value = "loaded";
    }

    return { barber: barber.value, user: user.value };
  }

  async function login(payload: LoginPayload) {
    const response = await barbersApi.login(payload);

    if (response?.authenticated) {
      if (import.meta.client) {
        adminToken.set(typeof response?.token === "string" ? response.token : null);
      }

      await ensureLoaded({ force: true });
    }

    return response;
  }

  async function logout(payload?: Record<string, unknown>) {
    try {
      await barbersApi.logout(payload);
    } finally {
      if (import.meta.client) {
        adminToken.clear();
      }

      barber.value = null;
      user.value = null;
      status.value = "idle";
    }
  }

  function setSession(payload: SessionSnapshot) {
    barber.value = payload.barber;
    user.value = payload.user;
    status.value = "loaded";
  }

  return {
    barber,
    ensureLoaded,
    isAuthenticated,
    login,
    logout,
    setSession,
    status,
    user,
  };
});

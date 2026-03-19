import { defineStore } from "pinia";
import type {
  BarberProfile,
  BarberUser,
  LoginPayload,
} from "~~/shared/schemas";

type SessionStatus = "idle" | "loading" | "loaded";

type SessionState = {
  barber: BarberProfile | null;
  status: SessionStatus;
  user: BarberUser | null;
};

type SessionSnapshot = {
  barber: BarberProfile | null;
  user: BarberUser | null;
};

export const useSessionStore = defineStore("session", {
  state: (): SessionState => ({
    barber: null as BarberProfile | null,
    user: null as BarberUser | null,
    status: "idle" as SessionStatus,
  }),

  getters: {
    isAuthenticated: (state: SessionState): boolean => Boolean(state.user),
  },

  actions: {
    async ensureLoaded(options: { force?: boolean } = {}): Promise<SessionSnapshot> {
      if (this.status === "loaded" && !options.force) {
        return { barber: this.barber, user: this.user };
      }

      this.status = "loading";

      try {
        const response = await useBarbersApi().me({ silent: true });

        this.barber = response?.barber ?? null;
        this.user = response?.user ?? null;
      } catch (e) {
        this.barber = null;
        this.user = null;
      } finally {
        this.status = "loaded";
      }

      return { barber: this.barber, user: this.user };
    },

    async login(payload: LoginPayload) {
      const response = await useBarbersApi().login(payload);

      if (response?.authenticated) {
        await this.ensureLoaded({ force: true });
      }

      return response;
    },

    async logout(payload?: Record<string, unknown>) {
      try {
        await useBarbersApi().logout(payload);
      } finally {
        this.barber = null;
        this.user = null;
        this.status = "idle";
      }
    },

    setSession(payload: SessionSnapshot) {
      this.barber = payload.barber;
      this.user = payload.user;
      this.status = "loaded";
    },
  },
});

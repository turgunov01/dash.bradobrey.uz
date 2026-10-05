import { getEffectiveEmployeePermissions } from '~~/shared/auth/employees'
import { firstAllowedPath } from '~/utils/access'

export default defineNuxtRouteMiddleware(async () => {
  const sessionStore = useSessionStore();

  await sessionStore.ensureLoaded();

  if (sessionStore.isAuthenticated) {
    const role = String(sessionStore.user?.role || "").trim().toLowerCase();
    const marketplaceBarbershopId = String(sessionStore.user?.marketplace_barbershop_id || "").trim();
    const isMerchant = Boolean(marketplaceBarbershopId) || role === "merchant" || role === "partner";

    if (isMerchant) {
      return navigateTo('/merchant');
    }

    const permissions = new Set(getEffectiveEmployeePermissions(sessionStore.user));
    const fallback = firstAllowedPath(permissions);

    if (fallback) {
      return navigateTo(fallback);
    }

    // Do not trap a permission-less stale session between /login and /.
    await sessionStore.logout().catch(() => undefined);
  }
});

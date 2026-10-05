import { getEffectiveEmployeePermissions } from '~~/shared/auth/employees'
import { canAccessPath, firstAllowedPath, requiredForPath } from '~/utils/access'

export default defineNuxtRouteMiddleware(async (to) => {
  if (to.path === "/login") {
    return;
  }

  const sessionStore = useSessionStore();

  if (import.meta.client) {
    useAdminToken().clearExpired();
  }

  await sessionStore.ensureLoaded();

  if (!sessionStore.isAuthenticated) {
    return navigateTo("/login");
  }

  const sessionBranchId = sessionStore.barber?.branch_id || sessionStore.user?.branch_id || null;

  if (sessionBranchId) {
    useBranchStore().setActiveBranch(sessionBranchId);
  }

  const role = String(sessionStore.user?.role || "").trim().toLowerCase();
  const marketplaceBarbershopId = String(sessionStore.user?.marketplace_barbershop_id || "").trim();
  const isMerchant = Boolean(marketplaceBarbershopId) || role === "merchant" || role === "partner";

  if (isMerchant && !to.path.startsWith("/merchant")) {
    return navigateTo("/merchant");
  }

  if (!isMerchant && to.path.startsWith("/merchant")) {
    return navigateTo("/");
  }

  if (!isMerchant && requiredForPath(to.path)) {
    const permissions = new Set(getEffectiveEmployeePermissions(sessionStore.user))

    if (!canAccessPath(permissions, to.path)) {
      const fallback = firstAllowedPath(permissions)

      if (fallback && fallback !== to.path) {
        return navigateTo(fallback)
      }

      return abortNavigation(createError({
        statusCode: 403,
        message: 'Недостаточно прав для доступа к разделу.'
      }))
    }
  }
});

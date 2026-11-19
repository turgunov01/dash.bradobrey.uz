import { getEffectiveEmployeePermissions } from '~~/shared/auth/employees'
import { canAccessPath, firstAllowedPath, requiredForPath } from '~/utils/access'
import { canManagePlatformOwners, isPlatformAreaPath } from '~~/shared/auth/tenancy'

const PLATFORM_HOME = '/platform/companies'
const PLATFORM_OWNERS_SETTINGS_PATH = '/settings/platform-owners'

export default defineNuxtRouteMiddleware(async (to) => {
  if (to.path === "/login" || to.path === "/platform/login") {
    return;
  }

  // Platform owner (MULTI_TENANCY D4): only the /platform area, never company
  // pages. Company users never get a platform session, so /platform/* sends
  // them to the platform login.
  const platformSession = usePlatformSessionStore();
  await platformSession.ensureLoaded();

  if (isPlatformAreaPath(to.path)) {
    return platformSession.isAuthenticated ? undefined : navigateTo("/platform/login");
  }

  if (platformSession.isAuthenticated) {
    return navigateTo(PLATFORM_HOME);
  }

  const sessionStore = useSessionStore();

  if (import.meta.client) {
    useAdminToken().clearExpired();
  }

  await sessionStore.ensureLoaded();

  if (!sessionStore.isAuthenticated) {
    return navigateTo(sessionStore.endReason
      ? { path: "/login", query: { reason: sessionStore.endReason } }
      : "/login");
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

  if (to.path === PLATFORM_OWNERS_SETTINGS_PATH && !canManagePlatformOwners(role)) {
    return navigateTo(firstAllowedPath(new Set(getEffectiveEmployeePermissions(sessionStore.user))) || "/");
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

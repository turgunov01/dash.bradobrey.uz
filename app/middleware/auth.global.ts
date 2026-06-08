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

  const role = String(sessionStore.user?.role || "").trim().toLowerCase();
  const marketplaceBarbershopId = String(sessionStore.user?.marketplace_barbershop_id || "").trim();
  const isMerchant = Boolean(marketplaceBarbershopId) || role === "merchant" || role === "partner";

  if (isMerchant && !to.path.startsWith("/merchant")) {
    return navigateTo("/merchant");
  }

  if (!isMerchant && to.path.startsWith("/merchant")) {
    return navigateTo("/");
  }
});

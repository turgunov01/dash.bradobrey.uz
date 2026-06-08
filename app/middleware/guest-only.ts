export default defineNuxtRouteMiddleware(async () => {
  const sessionStore = useSessionStore();

  await sessionStore.ensureLoaded();

  if (sessionStore.isAuthenticated) {
    const role = String(sessionStore.user?.role || "").trim().toLowerCase();
    const marketplaceBarbershopId = String(sessionStore.user?.marketplace_barbershop_id || "").trim();
    const isMerchant = Boolean(marketplaceBarbershopId) || role === "merchant" || role === "partner";

    return navigateTo(isMerchant ? "/merchant" : "/");
  }
});

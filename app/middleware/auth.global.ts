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
  const isMerchant = role === "merchant" || role === "partner";

  if (isMerchant && !to.path.startsWith("/merchant")) {
    return navigateTo("/merchant");
  }

  if (!isMerchant && to.path.startsWith("/merchant")) {
    return navigateTo("/");
  }
});

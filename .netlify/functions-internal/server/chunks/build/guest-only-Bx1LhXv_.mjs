globalThis.__timing__.logStart('Load chunks/build/guest-only-Bx1LhXv_');import { M as executeAsync } from '../_/nitro.mjs';
import { a1 as defineNuxtRouteMiddleware, f as useSessionStore, n as navigateTo } from './server.mjs';
import 'node:crypto';
import 'node:http';
import 'node:https';
import 'node:events';
import 'node:buffer';
import 'node:util';
import 'node:path';
import 'node:process';
import 'node:tty';
import 'node:fs';
import 'file://D:/projects/bradobrey-dashboard/node_modules/.pnpm/vue@3.5.30_typescript@5.9.3/node_modules/vue/index.mjs';
import 'file://D:/projects/bradobrey-dashboard/node_modules/.pnpm/pinia@3.0.4_typescript@5.9.3_vue@3.5.30_typescript@5.9.3_/node_modules/pinia/dist/pinia.prod.cjs';
import 'file://D:/projects/bradobrey-dashboard/node_modules/vue-router/vue-router.node.mjs';
import 'file://D:/projects/bradobrey-dashboard/node_modules/.pnpm/perfect-debounce@2.1.0/node_modules/perfect-debounce/dist/index.mjs';
import 'file://D:/projects/bradobrey-dashboard/node_modules/@vue/shared/dist/shared.cjs.prod.js';
import 'file://D:/projects/bradobrey-dashboard/node_modules/.pnpm/tailwindcss@4.2.1/node_modules/tailwindcss/dist/colors.mjs';
import 'file://D:/projects/bradobrey-dashboard/node_modules/@iconify/vue/dist/iconify.mjs';
import 'file://D:/projects/bradobrey-dashboard/node_modules/.pnpm/vue@3.5.30_typescript@5.9.3/node_modules/vue/server-renderer/index.mjs';
import 'file://D:/projects/bradobrey-dashboard/node_modules/reka-ui/dist/index.js';
import 'file://D:/projects/bradobrey-dashboard/node_modules/tailwind-variants/dist/index.js';
import 'file://D:/projects/bradobrey-dashboard/node_modules/.pnpm/unhead@2.1.12/node_modules/unhead/dist/plugins.mjs';
import 'file://D:/projects/bradobrey-dashboard/node_modules/.pnpm/unhead@2.1.12/node_modules/unhead/dist/utils.mjs';

const guestOnly = defineNuxtRouteMiddleware(async () => {
  let __temp, __restore;
  const sessionStore = useSessionStore();
  [__temp, __restore] = executeAsync(() => sessionStore.ensureLoaded()), await __temp, __restore();
  if (sessionStore.isAuthenticated) {
    return navigateTo("/");
  }
});

export { guestOnly as default };;globalThis.__timing__.logEnd('Load chunks/build/guest-only-Bx1LhXv_');
//# sourceMappingURL=guest-only-Bx1LhXv_.mjs.map

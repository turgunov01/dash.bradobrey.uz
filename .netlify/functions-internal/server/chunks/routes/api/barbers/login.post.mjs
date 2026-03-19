globalThis.__timing__.logStart('Load chunks/routes/api/barbers/login.post');import { d as defineEventHandler, r as readBody, f as findSupabaseUserByLogin, c as createError, a as ensureAdminNetworkAccess, b as clearBarberToken, h as clearAdminSession, s as setAdminSession, t as toDashboardUser, i as backendRequest, k as setBarberToken } from '../../../_/nitro.mjs';
import { compare } from 'file://D:/projects/bradobrey-dashboard/node_modules/bcryptjs/index.js';
import { l as loginSchema } from '../../../_/index.mjs';
import 'file://D:/projects/bradobrey-dashboard/node_modules/zod/index.js';
import 'node:crypto';
import 'node:http';
import 'node:https';
import 'node:events';
import 'node:buffer';
import 'file://D:/projects/bradobrey-dashboard/node_modules/@iconify/utils/lib/index.js';
import 'file://D:/projects/bradobrey-dashboard/node_modules/consola/dist/index.mjs';
import 'node:fs';
import 'node:path';

const login_post = defineEventHandler(async (event) => {
  var _a, _b, _c, _d, _e, _f, _g, _h;
  const payload = loginSchema.parse(await readBody(event));
  const supabaseUser = await findSupabaseUserByLogin(event, payload.login, { includePasswordHash: true });
  if (supabaseUser) {
    const hasValidPassword = Boolean(
      supabaseUser.password_hash && await compare(payload.password, supabaseUser.password_hash)
    );
    if (!hasValidPassword) {
      throw createError({
        statusCode: 401,
        statusMessage: "\u041D\u0435\u0432\u0435\u0440\u043D\u044B\u0439 \u043B\u043E\u0433\u0438\u043D \u0438\u043B\u0438 \u043F\u0430\u0440\u043E\u043B\u044C."
      });
    }
    const accessUser2 = await ensureAdminNetworkAccess(event, {
      id: supabaseUser.id,
      login: supabaseUser.login || payload.login
    });
    clearBarberToken(event);
    clearAdminSession(event);
    setAdminSession(event, {
      id: String(accessUser2.id),
      login: accessUser2.login || payload.login
    });
    return {
      authenticated: true,
      user: toDashboardUser(accessUser2),
      token: void 0
      // Supabase login doesn't provide a token
    };
  }
  const backendPayload = {
    login: payload.login,
    password: payload.password,
    ...payload.branch_id ? { branch_id: payload.branch_id } : {}
  };
  const response = await backendRequest(event, {
    auth: "none",
    body: backendPayload,
    method: "POST",
    path: "/api/barbers/login"
  });
  const accessUser = await ensureAdminNetworkAccess(event, {
    id: (_b = (_a = response.data) == null ? void 0 : _a.user) == null ? void 0 : _b.id,
    login: ((_d = (_c = response.data) == null ? void 0 : _c.user) == null ? void 0 : _d.login) || payload.login
  });
  if ((_e = response.data) == null ? void 0 : _e.token) {
    clearAdminSession(event);
    setBarberToken(event, response.data.token);
  }
  return {
    authenticated: Boolean((_f = response.data) == null ? void 0 : _f.token),
    user: ((_g = response.data) == null ? void 0 : _g.user) ? {
      ...response.data.user,
      ...(accessUser == null ? void 0 : accessUser.role) ? { role: accessUser.role } : {}
    } : null,
    token: (_h = response.data) == null ? void 0 : _h.token
  };
});

export { login_post as default };;globalThis.__timing__.logEnd('Load chunks/routes/api/barbers/login.post');
//# sourceMappingURL=login.post.mjs.map

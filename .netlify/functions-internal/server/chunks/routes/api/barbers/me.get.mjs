globalThis.__timing__.logStart('Load chunks/routes/api/barbers/me.get');import { d as defineEventHandler, o as getAdminSession, a as ensureAdminNetworkAccess, t as toDashboardUser, h as clearAdminSession, i as backendRequest, q as setResponseStatus, b as clearBarberToken } from '../../../_/nitro.mjs';
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

const me_get = defineEventHandler(async (event) => {
  var _a, _b, _c, _d, _e, _f;
  const adminSession = getAdminSession(event);
  if (adminSession) {
    try {
      const accessUser = await ensureAdminNetworkAccess(event, adminSession);
      return {
        barber: null,
        user: toDashboardUser(accessUser)
      };
    } catch (error) {
      clearAdminSession(event);
      throw error;
    }
  }
  const response = await backendRequest(event, {
    auth: "required",
    method: "GET",
    path: "/api/barbers/me"
  });
  try {
    const accessUser = await ensureAdminNetworkAccess(event, {
      id: (_b = (_a = response.data) == null ? void 0 : _a.user) == null ? void 0 : _b.id,
      login: (_d = (_c = response.data) == null ? void 0 : _c.user) == null ? void 0 : _d.login
    });
    setResponseStatus(event, response.status);
    return {
      ...response.data,
      user: ((_e = response.data) == null ? void 0 : _e.user) ? {
        ...response.data.user,
        ...(accessUser == null ? void 0 : accessUser.role) ? { role: accessUser.role } : {}
      } : null
    };
  } catch (error) {
    if (((error == null ? void 0 : error.statusCode) || ((_f = error == null ? void 0 : error.response) == null ? void 0 : _f.status)) === 403) {
      clearAdminSession(event);
      clearBarberToken(event);
    }
    throw error;
  }
});

export { me_get as default };;globalThis.__timing__.logEnd('Load chunks/routes/api/barbers/me.get');
//# sourceMappingURL=me.get.mjs.map

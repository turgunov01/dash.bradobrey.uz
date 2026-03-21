globalThis.__timing__.logStart('Load chunks/routes/api/barbers/logout.post');import { d as defineEventHandler, r as readBody, m as getBarberToken, i as backendRequest, h as clearAdminSession, b as clearBarberToken } from '../../../_/nitro.mjs';
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

const logout_post = defineEventHandler(async (event) => {
  const payload = await readBody(event).catch(() => ({}));
  try {
    if (getBarberToken(event)) {
      await backendRequest(event, {
        auth: "required",
        body: payload,
        method: "POST",
        path: "/api/barbers/logout"
      });
    }
  } finally {
    clearAdminSession(event);
    clearBarberToken(event);
  }
  return { success: true };
});

export { logout_post as default };;globalThis.__timing__.logEnd('Load chunks/routes/api/barbers/logout.post');
//# sourceMappingURL=logout.post.mjs.map

globalThis.__timing__.logStart('Load chunks/routes/api/barbers/me.patch');import { d as defineEventHandler, i as backendRequest, v as readIncomingBody, q as setResponseStatus } from '../../../_/nitro.mjs';
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

const me_patch = defineEventHandler(async (event) => {
  const response = await backendRequest(event, {
    auth: "required",
    body: await readIncomingBody(event),
    method: "PATCH",
    path: "/api/barbers/me"
  });
  setResponseStatus(event, response.status);
  return response.data;
});

export { me_patch as default };;globalThis.__timing__.logEnd('Load chunks/routes/api/barbers/me.patch');
//# sourceMappingURL=me.patch.mjs.map

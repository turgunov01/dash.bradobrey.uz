globalThis.__timing__.logStart('Load chunks/routes/api/barbers/me.patch');import { d as defineEventHandler, i as backendRequest, v as readIncomingBody, q as setResponseStatus } from '../../../_/nitro.mjs';
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

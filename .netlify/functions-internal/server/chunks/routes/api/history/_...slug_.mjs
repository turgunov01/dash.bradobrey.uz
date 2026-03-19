globalThis.__timing__.logStart('Load chunks/routes/api/history/_...slug_');import { d as defineEventHandler, p as proxyBackend } from '../../../_/nitro.mjs';
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

const ____slug_ = defineEventHandler(async (event) => {
  var _a;
  const slug = ((_a = event.context.params) == null ? void 0 : _a.slug) || "";
  const auth = slug.startsWith("barber") ? "required" : "none";
  return proxyBackend(event, `/api/history/${slug}`, auth);
});

export { ____slug_ as default };;globalThis.__timing__.logEnd('Load chunks/routes/api/history/_...slug_');
//# sourceMappingURL=_...slug_.mjs.map

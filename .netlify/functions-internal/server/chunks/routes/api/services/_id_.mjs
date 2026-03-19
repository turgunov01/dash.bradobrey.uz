globalThis.__timing__.logStart('Load chunks/routes/api/services/_id_');import { d as defineEventHandler, p as proxyBackend } from '../../../_/nitro.mjs';
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

const _id_ = defineEventHandler(async (event) => {
  var _a;
  return proxyBackend(event, `/api/services/${(_a = event.context.params) == null ? void 0 : _a.id}`, "none");
});

export { _id_ as default };;globalThis.__timing__.logEnd('Load chunks/routes/api/services/_id_');
//# sourceMappingURL=_id_.mjs.map

globalThis.__timing__.logStart('Load chunks/routes/api/index2');import { d as defineEventHandler, p as proxyBackend } from '../../_/nitro.mjs';
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

const index = defineEventHandler(async (event) => {
  return proxyBackend(event, "/api/services", "none");
});

export { index as default };;globalThis.__timing__.logEnd('Load chunks/routes/api/index2');
//# sourceMappingURL=index2.mjs.map

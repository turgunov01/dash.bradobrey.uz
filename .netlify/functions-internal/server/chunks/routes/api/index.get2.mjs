globalThis.__timing__.logStart('Load chunks/routes/api/index.get2');import { d as defineEventHandler, p as proxyBackend } from '../../_/nitro.mjs';
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

const index_get = defineEventHandler(async (event) => {
  return proxyBackend(event, "/api/history", "none");
});

export { index_get as default };;globalThis.__timing__.logEnd('Load chunks/routes/api/index.get2');
//# sourceMappingURL=index.get2.mjs.map

globalThis.__timing__.logStart('Load chunks/routes/api/health.get');import { d as defineEventHandler, p as proxyBackend } from '../../_/nitro.mjs';
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

const health_get = defineEventHandler(async (event) => {
  return proxyBackend(event, "/health", "none");
});

export { health_get as default };;globalThis.__timing__.logEnd('Load chunks/routes/api/health.get');
//# sourceMappingURL=health.get.mjs.map

globalThis.__timing__.logStart('Load chunks/routes/api/services/_id_');import { d as defineEventHandler, p as proxyBackend } from '../../../_/nitro.mjs';
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

const _id_ = defineEventHandler(async (event) => {
  var _a;
  return proxyBackend(event, `/api/services/${(_a = event.context.params) == null ? void 0 : _a.id}`, "none");
});

export { _id_ as default };;globalThis.__timing__.logEnd('Load chunks/routes/api/services/_id_');
//# sourceMappingURL=_id_.mjs.map

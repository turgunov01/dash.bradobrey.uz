globalThis.__timing__.logStart('Load chunks/routes/api/barbers/_...slug_');import { d as defineEventHandler, p as proxyBackend } from '../../../_/nitro.mjs';
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

const ____slug_ = defineEventHandler(async (event) => {
  var _a;
  const slug = ((_a = event.context.params) == null ? void 0 : _a.slug) || "";
  const path = `/api/barbers/${slug}`;
  const auth = slug === "register" ? "none" : "required";
  return proxyBackend(event, path, auth);
});

export { ____slug_ as default };;globalThis.__timing__.logEnd('Load chunks/routes/api/barbers/_...slug_');
//# sourceMappingURL=_...slug_.mjs.map

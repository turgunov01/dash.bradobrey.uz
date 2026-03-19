globalThis.__timing__.logStart('Load chunks/routes/api/index.get');import { d as defineEventHandler, e as ensureDashboardAccess, l as listSupabaseUsers } from '../../_/nitro.mjs';
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

const index_get = defineEventHandler(async (event) => {
  await ensureDashboardAccess(event);
  const items = await listSupabaseUsers(event, { role: "barber" });
  return {
    items: items.map((item) => ({
      branch_id: item.branch_id || null,
      id: String(item.id),
      login: item.login || null,
      role: item.role || null
    })),
    total: items.length
  };
});

export { index_get as default };;globalThis.__timing__.logEnd('Load chunks/routes/api/index.get');
//# sourceMappingURL=index.get.mjs.map

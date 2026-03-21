globalThis.__timing__.logStart('Load chunks/routes/api/index.get');import { d as defineEventHandler, e as ensureDashboardAccess, l as listSupabaseUsers } from '../../_/nitro.mjs';
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

# Project Memory

## Durable conventions

- Use npm and `package-lock.json` for local verification and CI. Legacy pnpm files still exist and should be removed only after confirming no external deployment depends on them.
- Run `npm run typecheck`, `npm run test` and `npm run build` before delivery.
- Keep the dashboard as SSR/Nitro; static hosting breaks BFF authentication and proxy routes.
- Preserve compatibility for existing `/barbers` and backend API paths during the employee terminology migration.
- Resolve effective permissions through `getEffectiveEmployeePermissions()` rather than adding new direct role checks.
- `admin_network` maps to the admin permission preset and `admin_branch` maps to the manager preset for legacy compatibility.
- Legacy role mappings are transitional business assumptions; confirm them with the backend before expanding the permission catalog.
- An absent permissions field falls back to the role preset. An explicit array, including `[]`, is authoritative so access can be fully revoked.

## Known operational facts

- The signed admin session now carries normalized permissions so a page refresh does not silently lose custom access.
- Client navigation and route middleware are UX controls only. Sensitive BFF handlers still require server-side permission enforcement.
- The external backend owns database migrations except for the reference SQL files kept under `scripts/postgres/`.

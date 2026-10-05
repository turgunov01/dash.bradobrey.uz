# Project Memory

## Durable conventions

- Use npm and `package-lock.json` for local verification and CI. Legacy pnpm files still exist and should be removed only after confirming no external deployment depends on them.
- Run `npm run typecheck`, `npm run test` and `npm run build` before delivery.
- Keep the dashboard as SSR/Nitro; static hosting breaks BFF authentication and proxy routes.
- Preserve compatibility for existing `/barbers` and backend API paths during the employee terminology migration.
- Resolve effective permissions through `getEffectiveEmployeePermissions()` rather than adding new direct role checks.
- `admin_network` maps to the admin permission preset and `admin_branch` maps to the manager preset for legacy compatibility.
- Legacy role mappings are transitional business assumptions; confirm them with the backend before expanding the permission catalog.
- An absent permissions field falls back to the role preset. An explicit non-empty array is authoritative; an empty array on `admin`/`admin_network` means no per-user permissions were provisioned and resolves to the full admin preset.

## Known operational facts

- The signed admin session now carries normalized permissions so a page refresh does not silently lose custom access.
- Client navigation and route middleware are UX controls only. Sensitive BFF handlers still require server-side permission enforcement.
- The external backend owns database migrations except for the reference SQL files kept under `scripts/postgres/`.
- `/statistics/employees` and `/statistics/branch` now render the server-provided `employee-quality-v1` rank. The former revenue Top-list is removed; revenue remains only in a clearly labelled informational breakdown/column.
- Employee ranking must not penalize `no_show`, `not_in_time`, or unattributed cancellations. Only explicitly employee-attributed terminal failures may reduce rank.
- Suspicious-order classification is currently duplicated and inconsistent across History, dashboard statistics, backend manager statistics, and notifications. The durable target is one versioned server-side rule using `started_at -> finished_at` and an immutable expected-duration snapshot.
- Revenue is informational only for employee quality ranking and must not participate in ordering.
- The 2026-10-04 release audit is a hard FAIL: the external API exposes anonymous privileged operations, Marketplace banner upload is a public 5 GB in-memory path, and History/Statistics/realtime scope can disclose PII. Do not treat passing build/unit tests as production approval.
- Dashboard automated tests currently cover only four imported utility/domain files out of a much larger surface (about 47 pages, 96 BFF handlers, and 30 composables). Critical workflows require integration/E2E/contract coverage.
- The external API's global employee-access middleware does not deny a missing token; every sensitive route must enforce authentication and permission/scope explicitly until a deny-by-default design is implemented.
- Employee-quality v1 ranks only snapshotted `barber`/`super-barber` outcomes, uses immutable completion branch attribution, authoritative live snapshots for eligibility, server-derived outcome reasons, and an append-only no-self-review workflow.
- Dashboard aggregate, evidence, and review BFF routes independently validate permissions/scope, bind the upstream response to the authorized request, allowlist PII-free DTOs, and fail closed on malformed invariants.
- The external API implementation and migration exist in `D:\api.bradobrey.uz`, but the migration is not deployed. Until it is applied and explicit permissions are provisioned, quality endpoints safely return unavailable/forbidden states rather than falling back to a revenue ranking.
- Employee-quality API schema detection treats PostgreSQL undefined-table (`42P01`) and undefined-column (`42703`) errors as an unavailable migration, so partially applied quality migrations fail closed with actionable `501` responses instead of generic `500` errors.
- `barbers.is_active` represents temporary availability/break and must never determine ranking eligibility; only archived/employment state may exclude official rank.
- Generic cancellation transitions remain neutral until terminal routes atomically persist server-derived actor/reason. Never infer employee blame from the final `barber_id`.
- The Dashboard review UI contract (`decision`/`reason`) is intentionally translated by its dedicated BFF to the external API contract (`review_state`/`review_comment`). Supported review states are only `confirmed` and `dismissed`; both sides use the same 8-100 character safe idempotency-key rule.
- Terminal queue records are immutable for status, services, and payment method through both the generic PATCH and dedicated completion paths. Completion accepts only `in_progress -> completed`, uses a prior-status CAS guard, and preserves completed retries as read-only/idempotent. Persisted quality notifications must use assessment snapshot duration fields, never the current service catalog.
- Client-only Statistics requests use `immediate: false` and start from `onMounted`; do not start them during hydration because loading icons and conditional branches then diverge from SSR HTML.
- Dashboard identity and BFF authorization must use permissions refreshed from backend `/api/barbers/me`; the signed cookie is not an authoritative permission source.
- All `useAdminToken()` consumers must share the same Nuxt `useState` value. Independent storage refs can leave the API client stale during the immediate post-login `/api/barbers/me` request.
- After a successful login, redirect non-merchants through `firstAllowedPath()` using refreshed permissions; never assume `/` is permitted. Clear an authenticated session and show an access-configuration message if no route is allowed.
- Dashboard login now calls the canonical external `POST https://api.bradobrey.uz/api/barbers/login` endpoint directly from the browser with exactly `{ login, password }` and `credentials: omit`; the returned bearer token is then used for protected Dashboard BFF requests. The Nitro `/api/barbers/login` proxy remains a compatibility path and still requires `NUXT_ADMIN_SESSION_SECRET`.
- Vite resolves `.ts`/`.tsx` before `.js`/`.jsx` because emitted JavaScript files in `app/` can shadow Nuxt TypeScript sources and retain unresolved `~~/shared/*` aliases in SSR.
- Generated `.js` files alongside `.ts` sources under `app/`, `server/`, or `shared/` are not project source and can shadow Nuxt modules/routes; remove only confirmed untracked build outputs. Login failures should appear in the form, not as a duplicate generic API toast.
- Leave `NUXT_COOKIE_SECURE` unset when protocol auto-detection is reliable. Use `false` only for local HTTP behind a misreporting proxy and `true` for an explicit HTTPS override.
- Production Nitro/PM2 does not automatically load the dashboard `.env`; provision `NUXT_ADMIN_SESSION_SECRET` in the server process environment and restart PM2 with `--update-env`. The ecosystem config forwards that server-only value and must never contain the secret itself.
- The PM2 ecosystem config now loads the deployment-local `.env` with Node's built-in `loadEnvFile()` before reading runtime values and fails fast if `NUXT_ADMIN_SESSION_SECRET` is absent. Explicit process-manager environment values remain authoritative.
- A live login check on 2026-10-05 showed direct external API login succeeds while dashboard `/api/barbers/login` returns 500 when the deployed Nitro process lacks `NUXT_ADMIN_SESSION_SECRET`; the client-side login path therefore bypasses that BFF session-signing dependency. The BFF route must still be repaired and redeployed before being treated as a working compatibility path.
- The first `/api/barbers/me` request after direct login receives the fresh token explicitly through the request headers; do not rely only on the reactive/localStorage token update, because that caused login to appear successful only after a page refresh.
- After validating that explicit Bearer on `/api/barbers/me`, the Dashboard BFF persists the same token in the HttpOnly `brado_admin_backend_token` cookie. This cookie bridge is required because direct cross-origin login intentionally uses `credentials: omit`; without it SSR/full-page reloads cannot see localStorage.
- History and Statistics BFF routes must use `auth: 'required'`; the external API rejects anonymous requests and admin accounts may otherwise be misdiagnosed as 401/403 during SSR or hydration.

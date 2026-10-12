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
- `/statistics/branch` renders the server-provided `employee-quality-v1` rank. The ranking module was removed from `/statistics/employees` on 2026-10-07 at the project owner's request; its existing revenue breakdown remains.
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
- Marketplace no-show settings use the backend contract `{ value: { enabled, automatic, first_violation_minutes, second_violation_minutes, third_plus_violation_minutes, lookback_days } }`; the Dashboard converts hours/days to canonical minutes and must strip the internal `__skipBranchScope` query flag for mutations before sending the request.
- Marketplace no-show settings GET/PATCH must not set `skipAuth: true`; the backend requires the authenticated admin bearer token. The composable now relies on the standard API client auth injection.
- Production `dash.bradobrey.uz` serves HTML with `Cache-Control: no-store` so stale Nuxt HTML cannot pin an older hashed no-show bundle after deploy; `_nuxt` assets remain immutable-cached.
- Statistics employee detail is derived from the already loaded, permission-scoped history snapshot; explicit backend record ids are deduplicated, partial source failures are surfaced, and the modal performs no extra request.
- Employee Quality v1 production schema and permission backfill were applied idempotently on 2026-10-11. API and Dashboard were restarted separately; unauthenticated direct verification returns 401 as expected. Authenticated ranking data requires a real user session for end-to-end verification.
- Dashboard production deployment verified on 2026-10-11 at commit `94724d8`: the deployment-local `.env` was provisioned on `dash.bradobrey.uz`, PM2 restarted only `bradobrey-dashboard` with `--update-env`, and public smoke checks returned `/login` 200 and `/` 302. Existing untracked `.env.swo` and `node-compile-cache/` on the server were preserved.

## Leaflet location picker (2026-10-12)

- `app/pages/branches.vue` now owns a browser-only Leaflet + OpenStreetMap picker for branch geocontrol. It preserves the API contract `{ latitude, longitude, radius_meters, is_enabled }` through `useBranchesApi().saveLocation()`; server-side geofence validation remains outside the frontend.
- The picker uses a fixed center pin, updates draft coordinates on Leaflet `moveend`, supports browser geolocation, and only copies coordinates into the existing form after explicit “Применить”. When creating a branch without saved coordinates, it requests the browser's current location automatically; if permission is unavailable, it falls back to Tashkent instead of an invalid/ocean center. Leaflet is dynamically imported after the modal transition and removed on modal close.
- Explicit address search accepts Uzbek/Russian address text (for example `Mirzo Ulug'bek shoh ko'chasi 43, Toshkent`) and moves the map to the selected Nominatim result. Existing branch coordinates remain the initial center during editing.
- Address search and reverse geocoding use Nominatim only on explicit search or debounced map-idle events, with a minimum 1.1-second request interval and no public proxy. The provider is replaceable if production traffic requires a managed geocoder.
- OpenStreetMap tiles require visible attribution and are not an unlimited production tile service. Monitor usage and move to a suitable tile/geocoder provider if traffic grows; no Google/Yandex API keys or billing are needed by the picker.
- Branches and Verifix location-event timestamps use the shared `formatDateTime()` helper with `Asia/Tashkent`; do not use bare `Date#toLocaleString()` in SSR-rendered templates.

## Barber transfer realtime (2026-10-11)

- Queue reassignment is a two-phase backend flow: `PATCH /api/barbers/queue/:id/reassign` creates a `transfer_pending` record, and the recipient must accept or reject it through `/api/barbers/queue/transfers/:transferId/{accept|reject}`.
- Socket.IO `queue:update`, `barber_changed`, and `queue.barber_changed` events are wake-up signals only; they are not durable and can be missed during reconnects. The dashboard workspace therefore refetches `GET /api/barbers/queue/transfers/pending` on initial load, relevant events, and socket reconnect.
- The recipient UI keeps pending transfers visible until an explicit accept/reject response succeeds. Do not infer incoming transfers from the ordinary queue list because `transfer_pending` entries are intentionally excluded by the backend.

# Barber login geolocation control (2026-10-11)

- Added branch geolocation policy editing and PII-minimized login-location event history to the existing Branches page through authenticated Nitro BFF routes. Backend migration/deployment remains a separate release step.
- Verifix location history now has a per-event "Карта" action. The modal renders an OpenStreetMap view with the device entry point and branch coordinates; it requires coordinates returned by the protected admin location-events endpoint.
- Production diagnosis on 2026-10-12 found the backend login path skipped `barber_login_location_events` entirely when a branch had no enabled location policy (`event: null`), so successful barber logins were invisible in the history. The API now persists an auditable `rejected` row with reason `LOCATION_NOT_CONFIGURED` while preserving the existing successful-login behavior. Missing/invalid geolocation is also persisted with null device coordinates and an explicit reason before a required-location rejection; no coordinates are fabricated.
- Production verification on 2026-10-12: Tashkent-day query returned 131 location rows (1 inside, 1 outside, 129 rejected, mostly historical `LOCATION_NOT_CONFIGURED`); the authenticated API returned HTTP 200 with rows; API health returned 200. API PM2 was restarted independently from the Dashboard.
- Dashboard login now requests browser geolocation and forwards validated `{ latitude, longitude, accuracy_meters, measured_at, client_event_id }` to the barber login endpoint. Location history accepts snake_case and camelCase timestamps and explicitly renders coordinates, distance, status, and Tashkent-local date/time.
- Verifix geocontrol event cards now hide raw coordinates and open a browser-only Leaflet/OpenStreetMap map on click. The employee event marker is centered and opens a safe popup with employee, event time, and status; the branch marker and configured radius circle are loaded from the branch location policy when available. Invalid or missing employee coordinates open the map dialog with a clear absence message.
- The Branches geocontrol history surfaces an outside-radius alert and keeps the Leaflet loader visible only during map initialization. `0,0` is treated as an unset coordinate pair; missing event coordinates show a dedicated warning, while missing branch coordinates explain that the branch marker/radius cannot be rendered until a valid point is saved.


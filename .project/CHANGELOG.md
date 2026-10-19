# Changelog

## 2026-10-19

- Fixed location-warning notifications that could not open their event because a historical notification's branch ID did not match the event's authoritative branch. The Dashboard now requests by exact event ID, relies on the authenticated API for branch scope, and loads branch geocontrol from the returned event. If the event is unavailable, the modal still shows the notification timestamp and clarifies it is not the event time.

## 2026-10-12

- Улучшена карта «Геоконтроля входа»: события в истории стали кликабельными, координаты убраны из карточек, а интерактивная Leaflet-карта показывает фактическую метку сотрудника, popup с данными события и контрольную точку с радиусом при доступной настройке филиала.
- Fixed barber login geolocation auditing: the dashboard now forwards the browser position to the login API, and `История входов` displays the event date/time and coordinates even when API timestamp fields use either snake_case or camelCase.
- Fixed the backend login-location audit gap: successful barber logins on branches without an enabled geocontrol policy now remain visible as explicit `LOCATION_NOT_CONFIGURED` audit events, and missing/invalid geolocation attempts are persisted without fabricated coordinates before enforcement rejects them. Added backend regression tests and deployed/restarted only the API process.
- Replaced the billing-dependent Google Maps branch picker with a Leaflet + OpenStreetMap picker using a fixed center pin, explicit Nominatim search/reverse geocoding, browser geolocation, rate limiting, and the existing coordinate-save contract. New branch pickers now start from the browser location when permission is available, and address search moves the map to the selected address; Tashkent is the safe fallback.
- Made SSR-sensitive current date/period defaults use the explicit `Asia/Tashkent` timezone across dashboard pages and workspaces, reducing server/browser hydration drift.
- Added a strict map-container element check before Google Maps picker initialization.
- Documented that the remaining `ApiNotActivatedMapError` and related observer exception require Google Cloud Maps JavaScript API activation for the configured browser key.

- Fixed SSR hydration drift in branch and Verifix location-event timestamps by formatting dates with the explicit `Asia/Tashkent` timezone. Google Maps initialization remains blocked until `Maps JavaScript API` is enabled for the configured browser key; the picker reports that configuration error and can be retried after the key is corrected.

## 2026-10-11

- Fixed the Google Maps picker DOM/lifecycle regression: Google now receives an isolated map host, initialization waits for the modal enter transition, cleanup runs after leave, and location-event timestamps use a deterministic Tashkent timezone for SSR hydration. Migrated to `AdvancedMarkerElement`, `loading=async`, and public Map ID configuration.
- Repaired the Branches Google Maps picker: the loader now waits for the Maps API callback and resolves the `maps`/`marker` libraries before constructing controls, fixing `google.maps.Map is not a constructor`. Added draggable-marker updates, manual-coordinate synchronization, permission-aware browser geolocation, explicit loading/error states, and preserved the existing location API contract.
- Fixed barber-to-barber queue transfer visibility: the recipient workspace now restores pending transfers from the durable API, shows a persistent notification with accept/reject actions, and displays a toast for newly received transfers. Socket queue/barber events and reconnects refresh the pending-transfer state so a missed event does not hide the client.
- Deployed Dashboard commit `94724d8` to `dash.bradobrey.uz`; provisioned the server-only PM2 environment, rebuilt Nitro, restarted only `bradobrey-dashboard`, and verified public SSR smoke routes.

## 2026-10-04

- Fixed the local login bounce after a successful backend response: all client API consumers now share one Nuxt-scoped admin-token state, the post-login profile refresh surfaces failures before showing success, and cookie security now uses protocol auto-detection by default.
- Redacted passwords, bearer tokens, cookies, and related secrets from the client API debug stream.
- Fixed Statistics SSR hydration mismatches by deferring client-only analytics/ranking requests until after mount; added a regression contract test.
- Dashboard sessions and protected BFF handlers now refresh authoritative backend permissions instead of trusting stale role-derived permissions stored in the session cookie.
- Access-error recovery now clears the Nuxt error state to `/login` for 401/403 responses instead of sending a user without permissions back into the protected root route.
- Guest-route middleware no longer loops permission-less stale sessions between `/login` and `/`; it logs out the unusable session and leaves the login form available.
- Nuxt UI toaster is now mounted only after hydration; error pages disable it, preventing toast portal nodes from causing SSR/client mismatches during login failures.
- Implemented the quality-first employee ranking in Dashboard and external API; removed both misleading revenue Top-lists while keeping revenue informational only.
- Added immutable service-plan/completion evidence, authoritative versus approximate source handling, deterministic competition ranks, strict `<50%` suspicious classification, and eligibility thresholds.
- Added protected aggregate, cursor-paginated PII-free evidence, and versioned/idempotent review contracts with independent Dashboard BFF and external API authorization.
- Added permission-aware self/branch/global UI, exact request/response binding, fail-closed contract validation, insufficient-data states, formula disclosure, evidence pagination, and review permission provisioning UI.
- Added regression coverage for formula ordering, revenue non-influence, ties, eligibility, date/scope validation, PII, pagination, review idempotency, terminal-state reopen prevention, and break-versus-employment semantics.
- Reconciled the quality-review contract end to end: Dashboard now translates to the API `review_state`/`review_comment` DTO, consumes the real `{ assessment, idempotent }` response, rejects unsupported reopen operations, and enforces the same idempotency-key format.
- Fixed two final backend integrity regressions: persisted duration notifications no longer render `NaN`, and terminal orders reject service/payment mutations while preserving idempotent status retries.
- Closed the dedicated queue-completion bypass: only `in_progress -> completed` is accepted, completed retries are read-only/idempotent, conflicting states are rejected, and status updates use compare-and-set protection.
- Verified Dashboard typecheck, 30/30 tests and production build; verified external API 70/70 tests and 111-file syntax check. PostgreSQL integration remained unavailable and the migrations were not applied.
- Added the product and technical specification for replacing the revenue-first employee Top-list with a transparent quality-first ranking.
- Defined ranking eligibility, suspicious-order classification, employee-failure attribution, neutral outcomes, API/UX contracts, security constraints, acceptance tests, and staged rollout requirements.
- Hardened the ranking specification with immutable cohort/branch attribution, review permissions and concurrency, controlled reason codes, mixed-source confidence, anti-gaming controls, canonical cross-module classification, and adversarial acceptance tests.
- Completed a full PM/QA/security audit across the Dashboard and external API; recorded the release-gate failure, module risk matrix, executed verification, and prioritized remediation plan in `FULL_AUDIT_2026-10-04.md`.

## 2026-10-05

- Fixed the Employee Quality API migration guard: partially applied schemas with missing quality columns now return the documented `501` unavailable response instead of masking the deployment issue as `500`; added API regression coverage.
- Replaced the unavailable `lucide:broadcast` reference with the installed `lucide:radio-tower` icon so the realtime status menu renders without an Iconify warning.
- Disabled login request diagnostics in production; sanitized diagnostics remain available during development only.
- Fixed admin login access when the backend returns `permissions: []`: `admin` and legacy `admin_network` accounts now receive the full admin permission preset.
- Fixed History/Statistics 401/403 responses by requiring the authenticated backend session in their BFF proxy routes; added a regression contract test for the auth mode.
- Dashboard admin authentication now uses only `POST /api/barbers/login` with the exact `{ login, password }` JSON payload and no `/api/barbers/admin/login` fallback.
- Changed the browser login request to call `https://api.bradobrey.uz/api/barbers/login` directly with `credentials: omit`; this avoids the production dashboard BFF 500 caused by a missing session-signing secret while preserving Bearer authorization for subsequent BFF calls.
- Fixed the immediate post-login `/api/barbers/me` race by explicitly forwarding the newly received Bearer token on that first profile request; login no longer depends on a page refresh to hydrate the session.
- Persisted the validated direct-login Bearer token in the Dashboard HttpOnly backend-token cookie during `/api/barbers/me`, so SSR and full-page reloads retain the authenticated session.
- Fixed successful-login redirects for restricted users: route to the first section allowed by the refreshed permissions, and clear the session with an actionable message when no dashboard section is permitted.
- Prevented emitted JavaScript copies from shadowing TypeScript sources; removed untracked generated copies under `app/`, `server/`, and `shared/` that caused SSR module-resolution failures.
- Distinguished invalid/missing login input from server failures (HTTP 400) and stopped the generic API toast from obscuring the login form's credential error.
- Forwarded the externally provisioned `NUXT_ADMIN_SESSION_SECRET` through the PM2 ecosystem config and documented production environment updates; PM2/Nitro production does not automatically load the project `.env`.
- Verified 36 Dashboard unit tests, Nuxt typecheck, local SSR `/login` (HTTP 200), protected-root redirect, and malformed login payload rejection (HTTP 400 after a clean Nuxt restart). Production build could not complete in this environment because Node exited on out-of-memory; no production deployment was performed.
- Recorded critical release blockers: anonymous privileged API paths, public 5 GB memory upload, History/Statistics PII scope gaps, manager branch escalation, realtime disclosure, and production dependency audit failures.
- Added the implementation workstream to project tasks and recorded the durable ranking decisions in project memory.

## 2026-10-03

### Changed

- Centralized effective permissions and legacy-role compatibility.
- Persisted normalized permissions through login and signed admin sessions.
- Enabled permission-aware route middleware and navigation filtering.
- Added protection for original and aliased loyalty/cashback routes.
- Replaced stale template README with project-specific setup and verification instructions.

### Quality

- Added `npm run test` and permission/access regression tests.
- Updated CI to run typecheck, tests and production build.
- Aligned CI with the current npm lockfile after local pnpm dependency reconciliation proved unreliable.
- Fixed Node ESM resolution in queue authorization tests.

### Security

- Removed `.env` from Git tracking while preserving the ignored local file.
- Recorded the required secret rotation and outstanding BFF authorization/dependency risks.
# 2026-10-05

- Audited the production login path against both domains. Confirmed the external API endpoint succeeds and the dashboard BFF forwards to the same `/api/barbers/login` contract.
- Fixed PM2 runtime configuration to load the deployment-local `.env` before reading `NUXT_ADMIN_SESSION_SECRET`, with fail-fast startup when the signing secret is missing.
- Fixed login session cookie ordering so a failed dashboard-session signature cannot leave an upstream backend token cookie behind.
## 2026-10-11

- Fixed Marketplace no-show settings PATCH requests leaking the internal `__skipBranchScope` query parameter on mutations. The request now preserves the authenticated API contract and sends only the allowlisted settings payload.
- Fixed Marketplace no-show settings GET/PATCH requests to include the authenticated admin bearer token.
- Updated production nginx cache policy for Dashboard HTML to prevent stale hashed bundles from persisting after deployments.
- Added employee statistics drill-down modal with scoped metrics, service/payment breakdowns, accessible keyboard activation, loading/empty/error states, and no extra API request.
- Deduplicated explicit history record ids and surfaced partial statistics source failures instead of silently treating them as empty data.
- Audited Employee Quality v1 end to end; improved safe error-code propagation and aligned Dashboard ranking validation with the backend quality tie-break rules.

# 2026-10-11 — barber login geolocation control

- Added branch geolocation policy controls and login-location event history to the existing Branches page, with authenticated BFF proxy routes.

# 2026-10-12 — Google Maps picker hardening

- Hardened the browser Maps loader with explicit Maps/marker constructor fallback, timeout cleanup, retry after failed loads, and actionable API-key errors.
- Production smoke testing confirmed the current Google Cloud key reaches the Maps JavaScript endpoint but the project returns `ApiNotActivatedMapError`; the Maps JavaScript API must be enabled in Google Cloud before the picker can render.

# 2026-10-12 — geocontrol map edge cases

- Added an explicit outside-radius alert in the Branches geocontrol history and limited the map loader overlay to Leaflet initialization.
- Treat `0,0` as an unset branch/event coordinate pair. Events without valid coordinates now open a clear warning instead of an empty map; an unset branch point explains why the radius circle is unavailable.
- Made the missing-coordinate notices persistent inline blocks in both the geocontrol form and event map dialog, including events that still have a valid employee point but no branch control point.

- 2026-10-12: Rebuilt the Dashboard production artifact after the geocontrol and employee active-branch fixes. Typecheck, 48 unit tests, and production build passed; production PM2 restart completed successfully.
# 2026-10-12

- Added the login-time active branch selection flow and forwarded the selected branch through the dashboard login compatibility path.
- Added an authorized in-workspace branch switcher, branch-specific shift transition handling, and cross-branch work/finance summary in the barber workspace.
# 2026-10-12

- Employee directory now displays and filters a barber by the persisted active work branch without changing the permanent branch assignment used by employee editing.

# 2026-10-18 — notification geolocation details

- Geolocation warning notifications now open the shared employee entry-location modal using their exact event and branch IDs. The modal loads branch policy through the authenticated API and keeps the notifications list and filters mounted while open.
- Extracted the existing Leaflet event modal from `/branches` into a reusable component; missing event coordinates render an explicit message.

# 2026-10-19 — device-aware browser push

- Detect phone, tablet, or computer using browser device hints together with touch and pointer capabilities. Check secure context, Service Worker, Notifications API, Push API, and the configured VAPID key before exposing enable controls.
- Show current-browser registration only after the authenticated backend confirms the subscription. Keep an existing browser subscription during re-registration and send test notifications to that browser endpoint only.

# 2026-10-19 — statistics audit fixes

- Scoped dashboard history loading to the selected date range with bounded pagination and refresh on period/active-branch changes.
- Preserved new/repeat client accuracy with server-provided `first_visit_date`, counted `rejected` as refusal, surfaced history errors/loading, and validated reversed date ranges.
- Added regression coverage and recorded the audit at `C:\project\bradobrey-audit-report\2026-10-19-statistics\AUDIT_REPORT.md`.


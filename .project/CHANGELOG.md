# Changelog

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

- Replaced the unavailable `lucide:broadcast` reference with the installed `lucide:radio-tower` icon so the realtime status menu renders without an Iconify warning.
- Disabled login request diagnostics in production; sanitized diagnostics remain available during development only.
- Fixed admin login access when the backend returns `permissions: []`: `admin` and legacy `admin_network` accounts now receive the full admin permission preset.
- Fixed History/Statistics 401/403 responses by requiring the authenticated backend session in their BFF proxy routes; added a regression contract test for the auth mode.
- Dashboard admin authentication now uses only `POST /api/barbers/login` with the exact `{ login, password }` JSON payload and no `/api/barbers/admin/login` fallback.
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

# Tasks

Last updated: 2026-10-04

## DONE

- [x] Centralize effective role/permission resolution, including legacy dashboard roles.
- [x] Preserve normalized permissions in signed admin sessions and `/api/barbers/me` responses.
- [x] Apply the existing route access policy to global middleware and dashboard navigation.
- [x] Protect both marketplace aliases and original cashback/loyalty settings paths in the client route map.
- [x] Add a working test script and CI test/build steps; repair Node ESM test execution.
- [x] Remove the local `.env` from Git tracking while preserving the ignored working copy.
- [x] Establish minimal persistent project context and replace the stale template README.
- [x] Fix the successful-login redirect loop by sharing client token state and making local HTTP cookie configuration protocol-compatible.

## SECURITY

- [ ] BLOCKING FOR RELEASE: rotate the exposed admin-session signing secret in every environment; the old `.env` content remains in Git history.
- [ ] BLOCKING FOR RELEASE: make external API authentication deny-by-default and close anonymous employee/admin, branch, service, History, Statistics, and Marketplace mutation/read paths.
- [ ] BLOCKING FOR RELEASE: remove manager login branch escalation; derive branch/network scope only from server-side assignments.
- [ ] BLOCKING FOR RELEASE: replace the public 5 GB in-memory Marketplace banner upload with authenticated, streamed, size-limited, signature-validated handling.
- [ ] BLOCKING FOR RELEASE: protect History/Statistics and Socket.IO rooms from anonymous and cross-branch access; remove PII from aggregate/realtime payloads.
- [ ] BLOCKING FOR RELEASE: restrict or disable `/api-debug` in production and enforce permission/scope on every Dashboard BFF handler.
- [ ] BLOCKING FOR RELEASE: remediate production dependency audit findings in Dashboard (13 high) and API (1 critical, 17 high), then rerun full regression/audit gates.
- [ ] Add server-side `requirePermission`/scope guards to sensitive and mutating BFF routes, starting with marketplace clients, services, statistics and admin settings.
- [ ] Stop returning the backend bearer token to browser code and remove its localStorage persistence after a cookie-only flow is verified.
- [ ] Review and stop trusting client-supplied `x-forwarded-*` headers in upstream requests.
- [ ] Add expiry/version fields to signed admin sessions and enforce them server-side.
- [ ] Revalidate role/permission changes for active signed sessions instead of caching authorization for up to 12 hours.
- [ ] Upgrade vulnerable dependencies and remove legacy pnpm files after confirming no external deployment depends on them.

## BACKLOG

- [x] Complete the current client permission route matrix for branches, finance, warehouse, Verifix, notifications and settings.
- [ ] Replace remaining direct role checks with permission/scope checks.
- [ ] Add authenticated integration tests for refresh persistence, denied routes and BFF authorization.
- [ ] Add and configure a real lint tool; CI currently runs typecheck, tests and production build.
- [ ] Complete employee route aliases and user-facing terminology without breaking `/barbers` compatibility.

## P1 RELIABILITY AND QA — audit 2026-10-04

- [ ] Fix History all-page loading so response metadata, not first-page size alone, determines completion.
- [ ] Remove global-scope defaults/fallbacks for branch users in Home, History, Statistics, and Employees.
- [ ] Replace swallowed source failures with explicit empty, partial, stale, and error states.
- [ ] Add Dashboard/API contract tests and authenticated integration/E2E suites for every critical module.
- [ ] Add a real lint tool and CI lint gate.
- [ ] Run local and CI verification on the same supported Node 22 runtime.
- [ ] Replace localStorage-only payroll drafts with an authoritative, auditable workflow or formally constrain and warn about local-only behavior.

## EMPLOYEE QUALITY RANKING — code complete, rollout pending

- [ ] PRODUCTION BLOCKER (verified 2026-10-05): live `GET /api/statistics/employees` returns `501` because the external API database does not have the Employee Quality schema. Apply the API migration/backfill, provision the required statistics permissions, then rerun the authenticated smoke test.
- [ ] Audit suspicious-order classification coverage and terminal-outcome attribution for the selected pilot period.
- [x] Centralize and version the suspicious-order rule; snapshot expected service duration and persist review state.
- [ ] Record actor type and reason for terminal outcomes before applying employee cancellation penalties.
- [x] Add a permission- and scope-protected PII-free `/api/statistics/employees` aggregate contract.
- [x] Add a scoped employee-ranking drill-down contract whose totals reconcile with suspicious/failure aggregates.
- [x] Add append-only quality review events, `statistics.quality.review`, no-self-review, optimistic concurrency, and idempotency.
- [x] Replace the revenue-first Top-lists on `/statistics/employees` and `/statistics/branch` with the quality-first ranking defined in `PRODUCT_SPEC_EMPLOYEE_QUALITY_RANKING.md`.
- [x] Make History, Notifications, and manager Statistics prefer persisted canonical quality assessments with explicitly approximate pre-migration fallback.
- [ ] Replace the remaining employee-detail duration heuristic with the canonical assessment contract.
- [x] Add ranking, boundary, permission, PII, pagination, review, anti-reopen, and Dashboard contract regression tests.
- [ ] Apply `db/postgres/employee_quality_ranking.sql` in an isolated staging database twice and verify rollback/idempotency, concurrency, query plans and p95.
- [ ] Explicitly provision `statistics.read.*`, `history.read.*`, and `statistics.quality.review`; the migration intentionally performs no role-based auto-grant.
- [ ] Configure a non-owner runtime database role with reviewed `GRANT/REVOKE` for audit tables and functions.
- [ ] Run a shadow/pilot rollout before making the quality ranking authoritative.

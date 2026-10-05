# Security Status

Last reviewed: 2026-10-05

## Release status

**FAIL — not approved for production release.** In addition to secret rotation, the audit confirmed anonymous administrative/API paths, a public 5 GB in-memory upload, History/Statistics PII scope failures, login branch escalation, realtime/notification disclosure, and critical/high dependency findings. Full evidence and retest requirements are in `FULL_AUDIT_2026-10-04.md`.

## Confirmed findings

### Anonymous privileged API operations

- Severity: Critical
- Evidence: employee registration accepts privileged role/permission input without a mandatory caller guard; branch/service and other administrative routes show the same deny-by-omission pattern.
- Required fix: deny by default and enforce authenticated permission plus server-derived scope on every read/mutation.
- Status: Open; release blocker.

### Public 5 GB memory upload

- Severity: Critical
- Evidence: Marketplace banner upload uses public `multer.memoryStorage()` with a 5 GB limit.
- Required fix: authenticate/authorize, stream, sharply cap size, verify signatures/MIME, and rate-limit.
- Status: Open; release blocker.

### History/Statistics and realtime PII exposure

- Severity: Critical/High
- Evidence: optional/no-auth History and Statistics paths, anonymous Socket.IO branch joins, and network-wide suspicious notifications can disclose client/order data outside authorized scope.
- Required fix: independent BFF/API/socket permission and scope enforcement; PII-free aggregates; least-privilege recipients.
- Status: Employee-quality aggregate/evidence/review and external legacy History/Statistics routes are fixed in code with independent JWT/permission/scope enforcement and PII-free quality DTOs. Anonymous Socket.IO, notification recipient scoping, and broader legacy BFF/API surfaces remain open release blockers.

### Login branch escalation

- Severity: High
- Evidence: manager-compatible roles can submit a branch during login and have it persisted/signed.
- Required fix: derive scope only from server-side assignments and test cross-branch denial.
- Status: Open; release blocker.

### Tracked environment secret

- Severity: Critical
- Evidence: `.env` was tracked for nine commits and contains a non-placeholder admin-session signing secret. The value is intentionally not recorded here.
- Affected component: session-cookie signing and repository history.
- Fix applied: `.env` was removed from the Git index; the ignored local file was preserved and `.env.example` remains sanitized.
- Required owner/operations action: rotate `NUXT_ADMIN_SESSION_SECRET` in every deployed environment, invalidate old sessions, then decide whether repository history must be purged.
- Retest: confirm the deployed secret changed, old signed sessions fail, `git ls-files .env` is empty, and history scanning no longer reports live credentials.

### Production login BFF session configuration

- Severity: High availability / session integrity
- Evidence: on 2026-10-05, direct `POST https://api.bradobrey.uz/api/barbers/login` returned 200 for the supplied JSON contract, while `POST https://dash.bradobrey.uz/api/barbers/login` returned 500 after obtaining the upstream token. The dashboard process had no usable `NUXT_ADMIN_SESSION_SECRET` to sign its session cookie.
- Affected component: Dashboard Nitro BFF login route and PM2 runtime configuration.
- Fix applied: PM2 now loads the deployment-local `.env` before reading runtime values and fails fast when the signing secret is absent. The login handler signs the dashboard session before issuing the upstream token cookie.
- Status: Fixed in source; production deployment/restart remains pending.
- Retest: after deployment, the dashboard route must return 200, set both dashboard session and backend-token cookies, and complete `/api/barbers/me`; a missing secret must prevent process startup rather than produce a partial login.

The browser login path currently uses the canonical external API directly as a compatibility mitigation. This avoids the broken BFF route, but it keeps the bearer token in browser state and therefore does not resolve the separate cookie-only authentication finding below. The BFF secret/configuration still requires production remediation.

### Incomplete server-side authorization

- Severity: High
- Evidence: multiple BFF handlers use `auth: 'none'`, optional upstream auth, or only coarse dashboard access. Client middleware cannot protect direct HTTP calls.
- Affected component: marketplace clients, services, statistics and other administrative proxy routes.
- Recommended fix: introduce permission/scope guards on the server and verify anonymous, wrong-role and intended-role behavior for every mutation.
- Status: Open.

### Browser-accessible backend token

- Severity: High
- Evidence: login returns the bearer token and client code persists it in localStorage even though HttpOnly cookie support exists.
- Recommended fix: complete a cookie-only BFF flow and remove token exposure to browser JavaScript.
- Status: Open.

### Dependency vulnerabilities and lockfile drift

- Severity: High
- Evidence: on 2026-10-04, `npm audit --omit=dev` reported 14 Dashboard findings (13 high) and 25 external API findings (1 critical, 17 high, 6 moderate). Legacy pnpm lockfile drift remains a separate reproducibility risk.
- Recommended fix: keep npm/`package-lock.json` canonical, update dependencies in a controlled branch, remove legacy pnpm files after deployment confirmation, use `npm ci` and rerun verification/audits.
- Status: Open.

## Positive checks

- No `v-html`, `eval`, `new Function` or `child_process` patterns were found in application code during the review.
- Login debug helpers redact password/token fields, though production logging still needs minimization.
- Typecheck, unit tests and production build pass after the 2026-10-03 permission changes.
- Employee-quality aggregate, evidence and review routes enforce self/branch/global scope at both Dashboard BFF and external API layers; responses are allowlisted and request-bound.
- Dashboard typecheck, 30/30 tests and production build pass. External API 70/70 tests and syntax checks for 111 JavaScript files pass.
- The Dashboard/API review DTO mismatch found during independent retest is fixed and covered by canonical request, response, and replay fixtures. Unsupported `reopen` is rejected on both sides.
- Persisted suspicious notifications no longer expose undefined/`NaN` duration values. Terminal service/payment mutations and the dedicated completion-route terminal/race bypass are blocked with regression coverage.
- PostgreSQL migration, concurrent review, DB privileges and query-plan/p95 checks remain unverified because no isolated staging database was available.
- Production dependency audits still fail: Dashboard has 14 findings (13 high) and API has 25 findings (1 critical, 17 high, 6 moderate, 1 low).

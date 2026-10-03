# Security Status

Last reviewed: 2026-10-03

## Release status

Not approved for production release until the exposed admin-session secret is rotated and sensitive BFF routes receive server-side authorization review.

## Confirmed findings

### Tracked environment secret

- Severity: Critical
- Evidence: `.env` was tracked for nine commits and contains a non-placeholder admin-session signing secret. The value is intentionally not recorded here.
- Affected component: session-cookie signing and repository history.
- Fix applied: `.env` was removed from the Git index; the ignored local file was preserved and `.env.example` remains sanitized.
- Required owner/operations action: rotate `NUXT_ADMIN_SESSION_SECRET` in every deployed environment, invalidate old sessions, then decide whether repository history must be purged.
- Retest: confirm the deployed secret changed, old signed sessions fail, `git ls-files .env` is empty, and history scanning no longer reports live credentials.

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
- Evidence: on 2026-10-03, `pnpm audit --prod` reported 106 findings (4 critical, 51 high) and `npm audit --omit=dev` reported 14 findings (13 high). The two lockfiles resolve materially different graphs.
- Recommended fix: keep npm/`package-lock.json` canonical, update dependencies in a controlled branch, remove legacy pnpm files after deployment confirmation, use `npm ci` and rerun verification/audits.
- Status: Open.

## Positive checks

- No `v-html`, `eval`, `new Function` or `child_process` patterns were found in application code during the review.
- Login debug helpers redact password/token fields, though production logging still needs minimization.
- Typecheck, unit tests and production build pass after the 2026-10-03 permission changes.

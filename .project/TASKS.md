# Tasks

Last updated: 2026-10-03

## DONE

- [x] Centralize effective role/permission resolution, including legacy dashboard roles.
- [x] Preserve normalized permissions in signed admin sessions and `/api/barbers/me` responses.
- [x] Apply the existing route access policy to global middleware and dashboard navigation.
- [x] Protect both marketplace aliases and original cashback/loyalty settings paths in the client route map.
- [x] Add a working test script and CI test/build steps; repair Node ESM test execution.
- [x] Remove the local `.env` from Git tracking while preserving the ignored working copy.
- [x] Establish minimal persistent project context and replace the stale template README.

## SECURITY

- [ ] BLOCKING FOR RELEASE: rotate the exposed admin-session signing secret in every environment; the old `.env` content remains in Git history.
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

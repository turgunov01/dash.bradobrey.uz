# Changelog

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

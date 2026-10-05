# Full project audit — 2026-10-04

Audit roles: Senior Project Manager, QA Lead, Application Security, Product/Business Analyst  
Scope: `D:\bradobrey-dashboard`, its BFF/API integration, and the external backend at `D:\api.bradobrey.uz`  
Decision: **RELEASE GATE — FAIL**

Post-audit implementation update: the employee-quality module described in section 6 has since been implemented in code in both repositories and its focused unit/contract/build checks pass (Dashboard 30/30 plus typecheck/build; API 70/70 plus 111-file syntax check). The final Dashboard/API review-contract mismatch, notification duration mapping defect, terminal service/payment mutation gap, dedicated completion-route terminal/race bypass, Statistics hydration mismatch, and session/API permission drift were fixed. Database migration/backfill application and staging validation are still pending. The project-wide release decision remains **FAIL** because the unrelated P0 findings and dependency vulnerabilities in this report remain open.

## 1. Executive verdict

The Dashboard compiles, its existing unit tests pass, and a basic local SSR authentication smoke test succeeds. This is not sufficient for production approval. The audit confirmed release-blocking authorization, privacy, upload, and dependency risks in the Dashboard/API boundary. Most business modules have no behavioral automated coverage, so a passing build does not prove that they work correctly.

The employee-quality ranking was implemented after the original audit and no longer orders employees by revenue. Its code-level acceptance suite passes, but it is not operationally accepted until the database migration, explicit permission provisioning, staging PostgreSQL checks, and pilot rollout are completed.

## 2. Verification actually executed

### Dashboard

| Check | Result |
|---|---|
| `npm ls --depth=0` | PASS |
| `npm run typecheck` | PASS |
| `npm run test` | PASS — 13/13 |
| coverage run | PASS, but only 4 imported source files are measured |
| `npm run build` | PASS; Node deprecation/plugin timing warnings only |
| local production SSR smoke | PASS — `/login` = 200; unauthenticated `/` = 302 to `/login` |
| `git diff --check` | PASS before documentation update |
| lint | NOT AVAILABLE — no lint tool/script configured |
| E2E/component/contract tests | NOT AVAILABLE |
| production deployment smoke | NOT PERFORMED |
| `npm audit --omit=dev` | FAIL — 14 findings: 13 high, 1 low |

Coverage is not whole-application coverage: the test run imports only `access.ts`, `penalty.ts`, `employees.ts`, and `queue.ts`. The repository contains approximately 47 Vue pages, 96 BFF handlers, and 30 composables.

### External API

| Check | Result |
|---|---|
| `npm test` | PASS — 46/46 |
| JavaScript syntax check | PASS — 88 files |
| `npm run test:integration` | SKIPPED — requires `MARKETPLACE_INTEGRATION=1` |
| `npm audit --omit=dev` | FAIL — 25 findings: 1 critical, 17 high, 6 moderate, 1 low |

### Environment/repository

- Dashboard runtime used for this audit: Node 24.15.0 / npm 11.12.1; CI/documentation target Node 22. This is a parity risk.
- `.env` is currently untracked, but repository history contains prior `.env` changes. Rotation of the previously exposed session-signing secret is not verified.

## 3. P0 — release blockers

### P0-01: unauthenticated employee/admin creation and administrative mutation

- Evidence: `D:\api.bradobrey.uz\src\routers\barbers.js:15`; `D:\api.bradobrey.uz\src\models\barbers.js:1716`; analogous unguarded mutations in `src\routers\branches.js:8` and `src\routers\services.js:11`.
- Risk: an anonymous caller can submit role/permission data, including administrative values, and mutate business configuration.
- Root cause: the global employee-access layer validates a token when present but does not deny requests when the token is absent.
- Required fix: deny by default; require authenticated identity and explicit permission/scope on every create/update/delete route; ignore client-supplied privileged role/permission fields unless the caller has the dedicated administration permission.
- Retest: anonymous, expired-token, wrong-role, cross-branch, permitted manager, and network-admin matrices for every mutation.

### P0-02: public 5 GB in-memory banner upload

- Evidence: `D:\api.bradobrey.uz\src\routers\marketplace\banner.js:7` uses `multer.memoryStorage()` with a 5 GB limit and public create/update paths.
- Risk: trivial out-of-memory denial of service, resource exhaustion, and unsafe file handling.
- Required fix: require mutation permission, reduce the limit to a business-justified size, stream to controlled storage, verify file signatures/MIME, reject malformed files, and rate-limit.
- Retest: anonymous upload, oversized body, concurrent uploads, MIME spoofing, truncated image, and authorized success.

### P0-03: unauthenticated/cross-scope History and Statistics with client PII

- Evidence: History API can return client name, phone, rank, and visit information without a mandatory guard; Dashboard Statistics BFF uses no upstream auth and History is optional.
- Risk: client privacy breach, cross-branch IDOR, and business-data disclosure.
- Required fix: mandatory authentication and independent scope enforcement in both BFF and external API; aggregate statistics must be PII-free; History permission is separately required for evidence rows.
- Retest: self/branch/global matrix at both layers, forged query parameters, direct API calls, and PII schema assertions.

### P0-04: manager branch escalation during login

- Evidence: `D:\api.bradobrey.uz\src\models\barbers.js:1597` and `:1617-1632` allow overlapping manager/workspace roles to submit a branch and persist/sign it.
- Risk: a manager may move their effective scope to another branch and receive data or operations outside their assignment.
- Required fix: derive allowed branch/network scope only from server-side membership; never persist login-supplied branch identity without an authorized assignment workflow.
- Retest: manager requests foreign branch, invalid branch, archived membership, network role, and legitimate multi-branch selection.

### P0-05: authorization gaps across Dashboard modules

Only 4 of 96 inspected BFF files explicitly call the central dashboard-access guard; many handlers merely require a token, use optional/default auth, or use none. High-risk examples include `/api-debug`, Employees mutations, Services/Categories mutations, Marketplace client/banner mutations, History, and Statistics.

- Risk: direct HTTP calls bypass navigation and route middleware.
- Required fix: create a deny-by-default BFF authorization matrix and apply explicit permission plus scope to every handler. Remove or strictly restrict `/api-debug` in production.

### P0-06: exposed session secret remains operationally unresolved

- Current repository state is improved: `.env` is ignored and not tracked in the current index.
- Blocker: history contains prior secret material and deployed secret rotation/session invalidation have not been verified.
- Required owner/operations action: rotate the secret in every environment, invalidate old sessions, scan history, then decide whether history rewriting is required.

### P0-07: dependency vulnerability gate fails

- Dashboard production graph: 14 findings, including 13 high.
- API production graph: 25 findings, including 1 critical and 17 high.
- Required fix: controlled dependency upgrades using the canonical lockfile, regression verification, and a repeated production-only audit. Do not approve release solely because unit tests still pass.

## 4. P1 — correctness, reliability, and product risks

### Access and data scope

- `/history` defaults to global loading and may skip branch scoping for users who only have branch permission.
- Statistics defaults to global and exposes all scope options without matching them to effective permission.
- Home allows branch-statistics users but fetches global all-history using an explicit branch-scope bypass.
- Employee listing retries without `branch_id` after an empty branch response and may display network-wide employees.
- Services, Categories, Employees, Marketplace, and Settings expose mutation UI or handlers without consistent write-permission enforcement.

### Silent false-success states

- Statistics uses `Promise.allSettled` and converts failed sources to empty arrays; an outage can be displayed as “no data”.
- Branch loading can swallow failure and mark the store loaded.
- Overview catches source failures and can display zero activity instead of a service error.
- Required product behavior: distinguish loading, legitimate empty data, partial data, stale data, and source failure.

### History completeness

`useHistoryApi.loadAll()` can stop when the first page is smaller than 500 even if metadata indicates more rows. The current backend `all=true` behavior may mask this, but the client contract is fragile and can truncate Statistics, Overview, Clients, and Finance if the upstream introduces a cap.

### Authentication/session design

- Login returns the backend bearer token to browser code and it is persisted in localStorage despite HttpOnly-cookie support.
- Signed admin sessions do not include a separately enforced identity/session version; role or permission changes may remain effective until the 12-hour cookie expires.
- Legacy login lacks robust rate limiting; the current limiter can be keyed using unverified decoded JWT data.

### Realtime and privacy

- Socket.IO accepts anonymous branch-room joins (`D:\api.bradobrey.uz\src\server.js:28-48`); emitted payloads may contain client identifiers/names.
- Suspicious-order notifications contain client information and are broadcast to all `super-barber` users network-wide rather than authorized scope.

### Forwarded-host trust

Dashboard forwards client-supplied `x-forwarded-host/proto`; the API can use those values to construct media URLs when no canonical public base URL is configured. This permits stored host poisoning.

### Finance durability

Salary/advance/penalty drafts use localStorage. Reset behavior lacks confirmation and persists an empty draft. This is vulnerable to browser loss, shared-device leakage, and accidental deletion; it is not an authoritative payroll workflow.

## 5. Module risk matrix

| Module | Build/static status | Behavioral coverage | Principal risk | Priority |
|---|---|---|---|---|
| Login/session/access | Compiles | narrow unit coverage | branch escalation, token exposure, stale permissions, rate limit | P0 |
| Overview | Compiles | none | global over-read; failures shown as zero activity | P0/P1 |
| Employees/Branches | Compiles | utility tests only | mutation authorization; branch fallback | P0 |
| History/Clients | Compiles | none | PII exposure, cross-branch access, possible truncation | P0 |
| Statistics | Compiles | none | unauthenticated data, wrong scope, silent partial failure | P0 |
| Services/Categories | Compiles | none | read permission can reach mutation flows | P0 |
| Marketplace/Settings | Compiles | none; API integration skipped | public mutations and 5 GB upload | P0 |
| Finance/Payroll | Compiles | penalty utility only | local-only draft state and shared upstream data risks | P1 |
| Warehouse/Expenses/Penalties/Verifix | Compiles | none | authorization/contract regression unverified | P1 |
| Queue/Kiosk | Compiles | authorization utility tests | business-flow and realtime behavior unverified | P1 |
| Promo/Certificates/Merchant | Compiles | none | permission and external contract unverified | P1 |
| Notifications | Compiles | none | PII broadcast and cross-network recipients | P1 |
| `/api-debug` | Compiles | none | arbitrary proxy surface for broad dashboard users | P0 |

“Compiles” means the production build included the module; it is not evidence that its complete business workflow passed.

## 6. Audit of the employee-quality ranking task

### Verdict at audit time (superseded by the post-audit implementation update above)

At the time of the original audit the feature was **NOT IMPLEMENTED / NOT ACCEPTED**: no `employee-quality-v1` aggregate, immutable quality snapshot, attribution event model, review workflow, or UI replacement existed. This historical finding is retained for traceability; the feature was subsequently implemented in code as described at the top of this report, while deployment and staging gates remain open.

### Specification improvements completed during this audit

The specification now explicitly defines:

- the ranked role cohort and immutable branch/employee attribution;
- the zero-denominator failure-rate rule;
- service-duration snapshot timing and immutable service-edit versions;
- authoritative/mixed/approximate source counts and eligibility;
- controlled server-derived reason codes;
- PII-free drill-down behavior;
- append-only review workflow, permission, no-self-review, concurrency, and idempotency;
- anti-gaming and stale-order controls;
- replacement of both employee and branch revenue leaderboards;
- canonical classification for History, Statistics, Notifications, and employee detail;
- expanded acceptance and adversarial tests.

### Remaining delivery gates

1. Run the baseline data audit: classification coverage, actor/reason coverage, service snapshot availability, and false-positive sampling.
2. Apply the prepared additive migration twice in isolated staging and validate backfill, rollback procedure, runtime-role privileges, query plans, and p95.
3. Explicitly provision read/review permissions and run the real authenticated self/branch/global authorization matrix.
4. Verify concurrent review/idempotency behavior against PostgreSQL and complete browser E2E/accessibility/responsive checks.
5. Introduce server-derived terminal actor/reason transactions before enabling employee-attributed failure penalties.
6. Complete a shadow/pilot rollout before the ranking influences operational decisions.

## 7. Recommended remediation sequence

1. Freeze production release and rotate the exposed session secret.
2. Close anonymous API/BFF mutation and read paths; remove branch escalation and restrict `/api-debug`.
3. Disable or immediately constrain the 5 GB in-memory upload.
4. Protect History/Statistics PII and realtime rooms with explicit scope checks.
5. Remove browser bearer-token persistence and harden session invalidation/rate limits.
6. Upgrade vulnerable dependencies and restore a passing audit gate.
7. Fix silent error states, branch/global scope defaults, and History pagination.
8. Add lint, contract/integration/E2E suites, and run them on Node 22 parity.
9. Apply and validate the implemented employee-quality ranking in staging only after baseline data and attribution readiness pass; promote it through a shadow/pilot rollout.

## 8. What remains unverified

- production configuration, database contents/migrations, backup/restore, monitoring, reverse proxy, and deployed secret state;
- real third-party Marketplace integration, because its suite was disabled;
- full browser E2E, mobile/responsive visual behavior, accessibility, load/concurrency, and destructive-operation recovery;
- real authorization behavior for every route against production-like users and data;
- exploit confirmation was intentionally non-destructive; findings are based on code paths and local tests.

These gaps are explicit release risks, not implicit passes.

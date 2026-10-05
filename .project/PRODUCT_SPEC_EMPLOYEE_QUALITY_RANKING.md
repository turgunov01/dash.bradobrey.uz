# Employee Quality Ranking — product and technical specification

Status: IMPLEMENTED IN CODE — DATABASE MIGRATION, PERMISSION PROVISIONING, STAGING VALIDATION AND PILOT PENDING  
Owner: Product / Operations  
Affected UI: `/statistics/employees`  
Affected systems: Bradobrey Dashboard and the external Bradobrey API  
Prepared: 2026-10-04

Implementation note (2026-10-04): the Dashboard quality leaderboard, PII-free evidence UI/BFF, review BFF, permission-aware scopes, and the external API aggregate/evidence/review contracts are implemented. The API migration has not been applied to staging/production. Generic terminal actions intentionally remain unattributed and neutral until their actor/reason transaction workflow is implemented. The ranking must therefore remain in controlled rollout until the deployment gates in section 11 pass.

## 1. Objective

Replace the revenue-first employee leaderboard with a quality-first ranking that identifies reliable employees instead of merely the employees who processed the most money.

The ranking must prioritize, in this order:

1. absence or low rate of suspicious completed orders;
2. a sufficiently large number of trusted completed orders;
3. a low rate of failures that are provably attributable to the employee;
4. deterministic handling of ties.

Revenue remains visible as business context but must never affect rank.

## 2. Confirmed product requirements

- An employee with high revenue must not rank above a more reliable employee solely because of revenue.
- Suspicious orders are the strongest negative signal.
- Completed orders are the primary positive productivity signal.
- Employee-caused cancellations and rejections must reduce reliability.
- Client `no_show` events do not reduce employee rank.
- Rankings use the selected period and the authorized global/branch/self scope.
- Managers must be able to understand why an employee received a given place.

## 3. Current-state findings

The current implementation does not satisfy the objective:

- `app/composables/useStatisticsAnalytics.ts` sorts the employee breakdown by `revenue DESC`, then by the number of all history rows.
- `app/pages/statistics/employees.vue` presents this list as `Лучшие барберы` and prominently displays revenue.
- `count` currently includes every history status, while revenue includes completed orders only.
- `cancelled`, `no_show`, and `not_in_time` are merged into one cancellation metric even though they do not have the same responsibility.
- Suspicious orders do not participate in the employee ranking.
- Suspicious detection is duplicated and inconsistent:
  - History and manager statistics normally use `started_at -> finished_at`;
  - the statistics composable currently derives actual duration from `created_at -> finished_at`;
  - notifications may fall back to `created_at` when `started_at` is missing.
- Historical service duration is read from the current service catalog. Editing a service can therefore retroactively change classification unless a snapshot is stored.
- The page downloads all history, including client data, and calculates aggregates in the browser. This is unnecessary for a leaderboard and increases privacy, authorization, and performance risk.
- Current cancellation/status history does not reliably store the actor and reason, so a generic `cancelled` record cannot safely be blamed on the employee.

## 4. Business definitions

### 4.0 Ranked cohort and branch attribution

Version `employee-quality-v1` ranks operational service providers with role `barber` or `super-barber` at the time of the terminal outcome. Administrators and managers are excluded unless a future explicit service-provider capability is introduced and snapshotted.

The employee and branch used for an order are immutable completion snapshots, not the employee's current profile. If an employee moves branches, each order remains in the branch where it was completed. Global scope aggregates all authorized completion snapshots; branch scope uses the snapshotted order branch.

### 4.1 Completed order

An order whose canonical terminal status is `completed`.

### 4.2 Classifiable completed order

A completed order with all data required by the active suspicious-order rule:

- immutable employee identifier;
- valid `started_at` and `finished_at`;
- `finished_at >= started_at`;
- positive expected service duration captured for that order.

Missing data must be reported as a data-quality issue. It must not silently make an order clean.

### 4.3 Suspicious order

For formula version `employee-quality-v1`, a completed order is automatically flagged when:

`actual_minutes < expected_minutes * 0.50`

where:

- `actual_minutes = finished_at - started_at`;
- `expected_minutes` is the snapshot of the total planned duration of all order services.

The comparison is strict: 29 minutes for a 60-minute service is flagged; exactly 30 minutes is not.

The flag means `requires review`, not proven fraud. Ranking counts flags with review state `unreviewed` or `confirmed`; `dismissed` flags do not count.

### 4.4 Trusted completed order

A classifiable completed order without an active suspicious flag:

`trusted_completed = classifiable_completed - suspicious_count`

### 4.5 Employee-attributable failure

A terminal `cancelled` or `rejected` outcome counts against the employee only when the audit event explicitly identifies an employee as the responsible actor and has an employee-responsibility reason code.

Customer, manager, system, timeout, and unattributed cancellations are neutral. They remain visible for operational analysis but do not reduce rank.

### 4.6 Neutral outcomes

- `no_show`: client did not arrive; display separately and exclude from rank.
- `not_in_time`: the current UI describes this as the client being late; display separately and exclude from rank.
- customer/system/manager cancellation: display separately and exclude from rank.
- active non-terminal states: exclude from the ranking calculation.

If the business meaning of `not_in_time` changes to an employee-caused failure, it may be included only in a new versioned formula after actor/reason attribution exists.

## 5. Eligibility and data confidence

An employee receives a numbered rank only when all conditions are satisfied:

- the employee is active and belongs to the selected comparison scope;
- at least 10 classifiable completed orders exist in the selected period;
- at least 90% of completed orders are classifiable by the suspicious-order rule;
- the evidence is authoritative live-snapshot data, or an explicitly approved versioned historical formula is being used.

The minimum of 10 classifiable completed orders is an MVP configuration value, not a hard-coded UI assumption. Employees below either threshold are displayed in a separate `Недостаточно данных` section with their available metrics and the exact reason, but no place.

Unknown or unassigned employees never enter the leaderboard. Their orders appear in a data-quality summary so totals remain reconcilable.

## 6. Ranking algorithm (`employee-quality-v1`)

The algorithm is deterministic and lexicographic. It intentionally does not use an opaque weighted score.

Eligible employees are ordered by:

1. `has_suspicious`: employees with `0` suspicious orders first, then employees with one or more;
2. `suspicious_count ASC`;
3. `suspicious_rate ASC`, where `suspicious_rate = suspicious_count / classifiable_completed`;
4. `trusted_completed DESC`;
5. `employee_failure_rate ASC`, where `employee_failure_rate = employee_failure_count / (trusted_completed + employee_failure_count)`; when the denominator is zero, the rate is defined as `0` because suspicious keys have already determined the order;
6. `employee_failure_count ASC`;
7. employee name and immutable employee ID for stable display only.

Rules 1–6 determine the ordinal place. Employees with the same values for all six ranking keys share a place using competition ranking (`1, 1, 3`). Name/ID must not break a statistical tie.

Consequences required by the business objective:

- changing revenue alone never changes place;
- an eligible employee with zero suspicious orders ranks above an eligible employee with suspicious orders;
- among flagged employees, fewer suspicious orders wins; for the same count, the lower suspicious rate wins before productivity is considered;
- a new employee with one clean order cannot become number one;
- high order volume cannot hide suspicious activity.

## 7. Backend requirements

### 7.1 Canonical quality classification

Create one server-side module for suspicious classification and use it from Statistics, History, and Notifications. Remove independent client-side business-rule implementations after the API contract is available.

The classifier must return:

- `rule_code` and `rule_version`;
- `classifiable` and, when false, `unclassified_reason`;
- `suspicious`;
- `actual_minutes` and `expected_minutes`;
- the timestamps and service-duration snapshot used.

### 7.2 Immutable audit data

Persist enough information to keep historical classification stable:

- employee and branch identifiers at completion;
- expected duration snapshot at completion;
- actual duration used by the rule;
- detected rule and version;
- review state: `unreviewed`, `confirmed`, or `dismissed`;
- reviewer, review time, and optional review comment.

Expected duration is snapshotted when the service composition is confirmed or work starts. A service edit after start creates a new immutable snapshot version with actor, reason, and timestamp; completion uses the latest valid version and never reads today's catalog to rewrite a live historical assessment.

A suitable model is a unique per-order `queue_quality_flags` record. The exact table name may follow backend conventions.

The cutover policy must distinguish genuinely captured snapshots from reconstructed history:

- assessments created from live completion data use `assessment_source=live_snapshot` and are authoritative;
- legacy backfill is idempotent and uses `assessment_source=backfill_current_catalog` plus `data_confidence=approximate`;
- pre-migration terminal outcomes receive `actor_type=unknown` and remain neutral; responsibility must never be inferred from `barber_id`;
- approximate legacy assessments may be displayed during shadow analysis but do not receive an official rank under `employee-quality-v1` unless a separately approved backfill formula version is activated.

Period-level confidence is aggregated, not represented by one arbitrary source value:

- return `assessment_source_counts` for `live_snapshot`, `backfill_current_catalog`, and `unclassified`;
- return `data_confidence=authoritative|mixed|approximate`;
- official v1 eligibility uses authoritative classifiable completions only;
- mixed/approximate data is visible but provisional unless an approved historical formula version defines otherwise.

### 7.3 Outcome attribution

Extend terminal status audit data so cancellation responsibility is explicit:

- `actor_id`;
- `actor_role`;
- `actor_type` (`employee`, `customer`, `manager`, `system`);
- `reason_code` from a controlled enum;
- `occurred_at`.

Do not infer responsibility merely from the order's final `barber_id`. Status-changing routes must write the audit event in the same transaction as the status transition.

Controlled `reason_code` values for v1:

- employee-attributable: `employee_refused`, `employee_unavailable`, `employee_schedule_conflict`, `employee_cancelled_after_start`;
- neutral: `client_requested_cancel`, `client_no_show`, `client_late`, `manager_override`, `system_timeout`, `duplicate_or_invalid_booking`, `unknown`.

The server derives `actor_type` and the allowed reason set from the authenticated endpoint/action. A client-supplied value cannot relabel an employee action as customer/system. Only `actor_type=employee` combined with an employee-attributable reason counts as a failure.

### 7.4 Aggregate endpoint

Add an authoritative endpoint such as:

`GET /api/statistics/employees`

Query:

- `start_date=YYYY-MM-DD` — required;
- `end_date=YYYY-MM-DD` — required;
- `scope=global|branch|self` — required;
- `branch_id` — required for branch scope;
- `employee_id` — optional narrowing filter for authorized branch/global readers; ignored and replaced with the authenticated employee for self scope;
- optional pagination for large employee sets.

The server must convert the requested calendar dates into the half-open interval `[start_date 00:00:00+05:00, end_date + 1 day 00:00:00+05:00)`. Quality assessments use their captured `completed_at`; attributed failures use the terminal status event's `occurred_at`. `created_at` must not decide inclusion of a terminal outcome.
Invalid dates, reversed ranges, unknown scope values, and ranges longer than 366 days must be rejected with `400`.
The response includes every active employee in the authorized scope, including employees with zero matching orders. An archived employee is included only when they have attributable activity in the selected period.
Pagination, if enabled, is applied only after ranking the complete authorized cohort. The response returns total/cursor metadata and preserves stable ordering inside shared-rank groups.

Minimum response contract:

```json
{
  "formula_version": "employee-quality-v1",
  "timezone": "Asia/Tashkent",
  "range": { "start_date": "YYYY-MM-DD", "end_date": "YYYY-MM-DD" },
  "scope": { "type": "branch", "branch_id": "uuid" },
  "rules": {
    "minimum_classifiable_completed": 10,
    "minimum_classification_coverage": 0.9,
    "suspicious_duration_ratio": 0.5
  },
  "employees": [
    {
      "employee": { "id": "uuid", "name": "Name", "branch_id": "uuid" },
      "rank": 1,
      "eligible": true,
      "provisional_reason": null,
      "rank_reason": "2 подозрительных из 44; 42 доверенных завершения",
      "metrics": {
        "completed": 44,
        "classifiable_completed": 44,
        "classification_coverage": 1,
        "assessment_source_counts": { "live_snapshot": 44, "backfill_current_catalog": 0, "unclassified": 0 },
        "data_confidence": "authoritative",
        "trusted_completed": 42,
        "suspicious_count": 2,
        "suspicious_rate": 0.0455,
        "employee_failure_count": 1,
        "employee_failure_rate": 0.0233,
        "no_show_count": 3,
        "not_in_time_count": 1,
        "neutral_cancelled_count": 2,
        "revenue": 1234567
      }
    }
  ],
  "data_quality": {
    "unassigned_orders": 0,
    "unclassifiable_completed": 0,
    "unattributed_terminal_outcomes": 0
  }
}
```

Rates are returned as decimals from `0` to `1`. The API returns raw counts and ranking keys so the UI can explain every place without recalculating the business rule.

### 7.5 Authorization and performance

- Apply the existing permission matrix: `statistics.read.self` permits only self scope; `statistics.read.branch` permits the authenticated branch and self; `statistics.read.global` permits global, branch, and employee filters within the authorized network.
- The Dashboard Nitro/BFF handler must validate the signed admin session and effective permission, proxy with `auth: 'required'`, and must not reuse the current `auth: 'none'` statistics proxy behavior.
- The external API must independently require a valid JWT, load effective user permissions, and enforce self/branch/global scope rather than trusting the Dashboard or client UI.
- Enforce branch/network scope from the authenticated session, never only from query parameters.
- Do not return client names, phone numbers, or other PII in the aggregate response.
- Drill-down endpoints must enforce the same scope.
- Add indexes supporting terminal timestamp, branch, employee, and status filtering after validating the query plan.
- Avoid N+1 queries; aggregate in SQL/service code on the server.
- Target p95 response time: no more than 1 second for a 31-day branch query under normal production load.

### 7.6 Scoped drill-down endpoint

Provide a scoped endpoint for evidence behind the aggregate, for example:

`GET /api/statistics/employees/:employee_id/orders`

It accepts the same date/scope rules plus `category=suspicious|employee_failure|unclassified` and optional suspicious review state. The default DTO is PII-free: order ID, employee/branch snapshots, status, classification/reason, expected/actual minutes, timestamps, review state, and rule version. Aggregate and drill-down totals must reconcile; dismissed suspicious flags must not appear in the active suspicious category.

Users with ranking permission but without the corresponding History permission see metrics but no drill-down link and receive `403` from the evidence endpoint. PII, when separately authorized for History, must come from the History contract rather than the ranking aggregate.

### 7.7 Quality review workflow

Add a review operation such as `PATCH /api/statistics/order-quality/:queue_entry_id/review` and a new explicit permission `statistics.quality.review`, assigned only to approved manager/network roles.

Requirements:

- append-only review events; the current state is a projection of the event log;
- permitted transition from `unreviewed` to `confirmed` or `dismissed`; reopening requires another authorized event and a reason;
- the assessed employee cannot review their own order;
- `reason` is mandatory;
- `expected_version` provides optimistic concurrency and stale writes return `409`;
- retrying the same decision/version is idempotent;
- reviewer, scope, previous/new state, reason, and timestamps are audited;
- every review write enforces branch/global permission at both BFF and external API layers.

### 7.8 Anti-gaming and stale-order controls

Server timestamps, not client timestamps, are authoritative. The quality pipeline must also flag delayed completion, service edits after start, and stale `in_progress` orders as data-quality/abuse signals. These signals are visible separately and do not silently become clean completions.

## 8. Frontend requirements

Replace `Лучшие барберы` with `Рейтинг качества сотрудников`.

The same replacement applies to the second revenue Top-list on `/statistics/branch`. History and employee-detail duration warnings must consume the canonical server classification; the current independent `<50%`/`>200%` employee-detail heuristic must not remain as a competing suspicious-order definition.

The primary presentation is a table rather than three revenue cards. Required columns:

- place;
- employee;
- quality status (`Чисто`, `Требует проверки`, `Недостаточно данных`);
- trusted completed / total completed;
- suspicious count and rate;
- employee-attributable failures count and rate;
- neutral `no_show` and `not_in_time` counts;
- classification coverage;
- revenue as the final informational column.

Required interactions:

- `Как считается рейтинг` popover with exact formula version, thresholds, and exclusions;
- `Почему это место` explanation per employee;
- suspicious and failure counts link to History with the same date, branch, employee, and reason filters;
- separate `Недостаточно данных` section;
- distinct empty states for no orders, no eligible employees, and insufficient data quality;
- preserve current date and global/branch filters;
- in individual employee scope show metrics but no misleading ordinal rank unless the API also returns the comparison cohort.

The existing revenue list may remain temporarily during shadow rollout only if it is renamed `По выручке` and clearly separated from the quality ranking.

## 9. Acceptance criteria

1. With equal scope and period, employee A with lower revenue and zero suspicious orders ranks above employee B with suspicious orders.
2. Fewer suspicious orders wins even when the other employee has higher volume; for the same suspicious count, `1/100` ranks above `1/20`.
3. Among employees with the same suspicious metrics, the employee with more trusted completed orders ranks higher.
4. Among employees tied on quality and trusted volume, the lower attributable failure rate ranks higher.
5. Changing only revenue does not change rank.
6. An employee with 9 classifiable completed orders is shown as `Недостаточно данных` and receives no place; `10 completed / 9 classifiable` is also insufficient.
7. An employee below 90% classification coverage receives no place.
8. `no_show`, `not_in_time`, and unattributed cancellations do not reduce rank.
9. A customer cancellation does not reduce rank; an employee-attributed cancellation with a qualifying reason does.
10. For a 60-minute expected duration, 29 minutes is suspicious and 30 minutes is not.
11. Missing/invalid timestamps create an unclassified data-quality record, not a clean order.
12. Revenue is displayed but is absent from all ranking keys.
13. Exact metric ties share the same place and remain stable across reloads.
14. A transferred order is attributed to the employee who completed/closed it; transfer activity is not silently charged to previous employees.
15. All date boundaries are evaluated consistently in `Asia/Tashkent`.
16. Global and branch responses enforce authenticated scope and contain no client PII.
17. Every suspicious/failure count can be reconciled to a scoped drill-down list.
18. Increasing only `unclassifiable_completed` cannot improve rank or failure rate.
19. Self, branch, and global scopes follow their exact permission matrix at both BFF and external API layers.
20. Pagination does not change shared ranks or split equal-rank ordering nondeterministically.
21. Legacy backfill is labeled approximate and never represented as an original live snapshot.
22. Only employees whose terminal snapshot role is `barber` or `super-barber` enter the v1 cohort; administrators and managers do not enter it implicitly.
23. When an employee changes branch, historical orders remain attributed to the snapshotted completion branch and do not move with the profile.
24. If `trusted_completed + employee_failure_count = 0`, `employee_failure_rate` is returned as `0`; the employee still cannot benefit because suspicious keys and eligibility are evaluated first.
25. The authenticated server action determines `actor_type` and the allowed `reason_code`; a client cannot relabel an employee action as customer, manager, or system.
26. A review requires `statistics.quality.review`, cannot be performed by the assessed employee, requires a reason, rejects stale versions with `409`, and is idempotent for an identical retry.
27. Mixed source periods expose complete `assessment_source_counts`; approximate/backfilled rows do not satisfy authoritative v1 eligibility.
28. Both `/statistics/employees` and `/statistics/branch` stop presenting the revenue Top-list as a quality ranking.
29. Employee detail, History, Notifications, and Statistics return the same classification for the same immutable order snapshot.
30. Delayed completion, post-start service edits, stale `in_progress` orders, and attempted branch hopping are covered by abuse/data-quality tests and cannot silently improve rank.

## 10. Test plan

### Backend unit tests

- suspicious duration threshold and exact 50% boundary;
- missing timestamps, reversed timestamps, and missing duration snapshot;
- review states (`unreviewed`, `confirmed`, `dismissed`);
- eligibility threshold and classification coverage threshold;
- all lexicographic ranking keys and shared-place behavior;
- regression test proving unclassifiable rows cannot improve rank or failure rate;
- revenue non-influence;
- neutral outcome handling;
- actor/reason cancellation attribution;
- transferred-order attribution;
- Asia/Tashkent date boundaries.
- zero-denominator failure-rate behavior;
- cohort inclusion by terminal role snapshot;
- branch attribution before and after an employee transfer;
- mixed assessment-source aggregation and authoritative-only eligibility;
- canonical classification parity across all consumers.

### Backend integration/security tests

- branch manager cannot read another branch;
- self permission cannot request another employee, branch, or global scope;
- network role can read permitted network scope;
- unauthenticated and unauthorized requests are denied;
- Dashboard BFF and external API authorization are tested independently;
- aggregate response contains no PII;
- drill-down totals reconcile with aggregates;
- pagination is applied after full-cohort ranking and preserves cross-page ties;
- query-count/performance regression check.
- client attempts to spoof actor/reason attribution are rejected or ignored;
- review permission, no-self-review, mandatory reason, optimistic concurrency, idempotency, and append-only audit history;
- service edits after start preserve immutable versions;
- stale/delayed completion and branch-hopping scenarios cannot improve the ranking;
- ranking-only users cannot access PII or a History drill-down without the corresponding History permission.

### Frontend tests

- table rendering for eligible, flagged, and provisional employees;
- correct shared ranks;
- explanation popover and rank reason;
- drill-down query preservation;
- revenue changes do not reorder rows;
- empty/loading/error states;
- responsive and keyboard-accessible table behavior.
- both employee and branch statistics remove or clearly relabel the revenue leaderboard;
- employee-detail warnings match the canonical API classification exactly.

## 11. Rollout plan

1. Data audit: measure classification coverage, cancellation attribution coverage, and disagreement between current History/Statistics/Notifications rules.
2. Add live immutable quality classification, idempotent approximate backfill, and terminal-event attribution.
3. Implement and test the aggregate endpoint behind `employee_quality_ranking_v1`.
4. Run shadow comparison against the existing revenue list without changing manager decisions.
5. Pilot with administrators and selected branches; review false-positive flags and attribution errors.
6. Enable the quality leaderboard when classification coverage is at least 95% and cancellation attribution is at least 90% for the pilot period.
7. Keep the rule version in API responses and audit logs so future formula changes do not silently rewrite prior decisions.

## 12. Product monitoring

Track:

- classification coverage;
- unclassified completed orders;
- unattributed terminal outcomes;
- suspicious rate by branch and employee;
- confirmed versus dismissed suspicious flags;
- percentage of employees below the sample threshold;
- rank changes versus the old revenue list;
- drill-down usage and manager review activity;
- response latency and authorization failures.

The ranking must support operational review, not automatic disciplinary or compensation decisions, until false-positive rates and attribution quality are validated.

## 13. Out of scope for v1

- customer ratings and review sentiment;
- revenue or average check as ranking inputs;
- service-mix complexity adjustment;
- productivity per worked hour;
- transfer-abuse scoring;
- automatic salary, bonus, or disciplinary actions;
- machine-learning fraud scoring.

These may be evaluated after v1 produces reliable, reviewable data.

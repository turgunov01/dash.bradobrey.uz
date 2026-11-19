# Project Context

Last verified: 2026-10-05

Bradobrey Dashboard is a Nuxt 4 SSR administration application. Vue/Nuxt UI pages live in `app/`; Nitro BFF routes in `server/api/` proxy the external backend configured by `NUXT_PUBLIC_API_BASE`. PostgreSQL and uploaded files are owned by that backend, not this repository.

The active product areas include employees, queues, history, statistics, finance, warehouse, penalties, marketplace administration, loyalty ranks, cashback, kiosk configuration and a separate merchant area.

The current architectural initiative is the migration from scattered role checks to a shared `role -> permissions -> scope` model. The shared role and permission registry is in `shared/auth/employees.ts`; route access policy is in `app/utils/access.ts`. Technical `/barbers` and `/api/barbers` paths remain for backward compatibility while user-facing terminology moves toward employees.

The canonical development branch in this checkout is `master`. `deploy/master` trails it, while `origin/main` points to the upstream Nuxt template history and must not be merged casually.

## Multi-company (branch `feat/multi-company`, 2026-11-19, not deployed)

The backend is multi-tenant (api `.project/MULTI_TENANCY.md`): one company = one brand with many branches. Staff log in with a **company code** (`company_code`, prefilled from localStorage `brado_last_company_code`); the browser login path (direct to the API in production, BFF `server/api/barbers/login.post.ts` locally) forwards it. The company id comes from the backend user (`company_id`); code and name (from `POST /api/companies/resolve`) are shown in the sidebar/user menu via the `brado_company` cookie (`useCompanyContext`) only while its id matches the session.

The **platform owner** (`platform_owner`) has a separate area `/platform/*` (layout `platform`, store `platformSession`, BFF `server/api/platform/**`, cookies `brado_platform_token`/`brado_platform_session`, never mixed with company cookies). `auth.global` keeps platform owners inside `/platform` and sends everyone else on `/platform/*` to `/platform/login`. Shared tenancy rules and Russian error texts: `shared/auth/tenancy.ts`.

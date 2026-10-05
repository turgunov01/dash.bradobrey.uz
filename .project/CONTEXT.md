# Project Context

Last verified: 2026-10-05

Bradobrey Dashboard is a Nuxt 4 SSR administration application. Vue/Nuxt UI pages live in `app/`; Nitro BFF routes in `server/api/` proxy the external backend configured by `NUXT_PUBLIC_API_BASE`. PostgreSQL and uploaded files are owned by that backend, not this repository.

The active product areas include employees, queues, history, statistics, finance, warehouse, penalties, marketplace administration, loyalty ranks, cashback, kiosk configuration and a separate merchant area.

The current architectural initiative is the migration from scattered role checks to a shared `role -> permissions -> scope` model. The shared role and permission registry is in `shared/auth/employees.ts`; route access policy is in `app/utils/access.ts`. Technical `/barbers` and `/api/barbers` paths remain for backward compatibility while user-facing terminology moves toward employees.

The canonical development branch in this checkout is `master`. `deploy/master` trails it, while `origin/main` points to the upstream Nuxt template history and must not be merged casually.

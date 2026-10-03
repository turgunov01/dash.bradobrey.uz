# Bradobrey Dashboard

Server-rendered administration dashboard for Bradobrey. The application is built with Nuxt 4, Vue 3, Nuxt UI and Pinia. Nitro routes under `server/api` act as a BFF for the Bradobrey backend API.

## Requirements

- Node.js 22+
- npm

## Setup

```powershell
npm ci
Copy-Item .env.example .env
npm run dev
```

The local environment must provide at least:

```bash
NUXT_PUBLIC_API_BASE=https://api.bradobrey.uz
NUXT_ADMIN_SESSION_SECRET=replace-with-a-long-random-secret
NUXT_COOKIE_SECURE=true
```

Never commit `.env` or real credentials. Database access and file storage belong to the backend API, not this repository.

## Verification

```bash
npm run typecheck
npm run test
npm run build
```

## Production

The dashboard must run as a Nuxt/Nitro server because authentication and backend proxying depend on `server/api` routes. See [docs/ssr-deploy.md](docs/ssr-deploy.md).

```bash
npm run build
npm start
```

## Project knowledge

Durable engineering context, active work and security risks are recorded in `.project/`. Architectural migration notes remain in `theory/`.

# SSR Deploy

This dashboard must run as a Nuxt/Nitro server, not as static SPA files, because
`server/api/*` contains the BFF routes used by login, auth cookies, and backend
proxying.

## Build

```bash
npm ci
NITRO_PRESET=node-server npm run build
```

## Run

```bash
HOST=0.0.0.0 PORT=3000 npm start
```

Or with PM2:

```bash
# Provision NUXT_ADMIN_SESSION_SECRET in the server's environment first.
# PM2 does not load the project's .env file for a production Nitro server.
pm2 start ecosystem.config.cjs --env production
pm2 save
pm2 startup
```

Required production environment:

```bash
NUXT_PUBLIC_API_BASE=https://api.bradobrey.uz
NUXT_ADMIN_SESSION_SECRET=<long-random-secret>
NUXT_COOKIE_SECURE=true
```

Set `NUXT_ADMIN_SESSION_SECRET` in the deployment environment before starting
or restarting PM2. It must be a long, random server-only value (at least 32
characters); never use the placeholder from `.env.example`, expose it to the
browser, or commit it. When updating the environment of an existing PM2
process, restart with `--update-env` and save the updated process list:

```bash
pm2 restart ecosystem.config.cjs --env production --update-env
pm2 save
```

Changing this secret invalidates existing admin-session cookies and requires
admins to sign in again.

`NUXT_PUBLIC_API_BASE` must point to the backend API that owns PostgreSQL,
auth, file uploads, and all admin data operations.

## Nginx

`dash.bradobrey.uz` must proxy every path, including `/api/*`, to the Nuxt SSR
server. Do not proxy `/api/*` directly to the backend API domain.

```nginx
server {
    server_name dash.bradobrey.uz;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}
```

After changing nginx:

```bash
sudo nginx -t
sudo systemctl reload nginx
```

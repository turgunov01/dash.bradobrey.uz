module.exports = {
  apps: [
    {
      name: 'bradobrey-dashboard',
      cwd: __dirname,
      script: '.output/server/index.mjs',
      exec_mode: 'fork',
      instances: 1,
      autorestart: true,
      max_memory_restart: '512M',
      env: {
        NODE_ENV: 'production',
        HOST: '0.0.0.0',
        PORT: '3000',
        NITRO_HOST: '0.0.0.0',
        NITRO_PORT: '3000',
        NITRO_PRESET: 'node-server',
        NUXT_ADMIN_SESSION_SECRET: process.env.NUXT_ADMIN_SESSION_SECRET,
        NUXT_COOKIE_SECURE: 'true',
        NUXT_PUBLIC_API_BASE: process.env.NUXT_PUBLIC_API_BASE || 'https://api.bradobrey.uz'
      }
    }
  ]
}

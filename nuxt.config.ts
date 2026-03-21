/// <reference types="node" />

import { readFile, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'

const routeBlockPlugin = 'vue-router/volar/sfc-route-blocks'
const env = process.env
const apiBase = String(env.NUXT_PUBLIC_API_BASE || env.API_BASE || 'https://api.turgunovsardor.uz').trim().replace(/\/+$/, '')
const nitroPreset = env.SERVER_PRESET || env.NITRO_PRESET || (env.NETLIFY ? 'netlify' : '')

async function stripRouteBlockPlugin(directory: string, fileName: string) {
  const filePath = resolve(directory, fileName)
  const contents = await readFile(filePath, 'utf8').catch(() => null)

  if (!contents) {
    return
  }

  const parsed = JSON.parse(contents) as {
    vueCompilerOptions?: {
      plugins?: unknown[]
    }
  }
  const plugins = parsed.vueCompilerOptions?.plugins

  if (!Array.isArray(plugins)) {
    return
  }

  const filteredPlugins = plugins.filter(plugin => plugin !== routeBlockPlugin)

  if (filteredPlugins.length === plugins.length) {
    return
  }

  parsed.vueCompilerOptions = {
    ...parsed.vueCompilerOptions,
    plugins: filteredPlugins
  }

  await writeFile(filePath, `${JSON.stringify(parsed, null, 2)}\n`, 'utf8')
}

async function ensureNodeTypes(directory: string, fileName: string) {
  const filePath = resolve(directory, fileName)
  const contents = await readFile(filePath, 'utf8').catch(() => null)

  if (!contents) {
    return
  }

  const parsed = JSON.parse(contents) as {
    compilerOptions?: {
      types?: string[]
    }
  }
  const currentTypes = Array.isArray(parsed.compilerOptions?.types)
    ? parsed.compilerOptions?.types || []
    : []

  if (currentTypes.includes('node')) {
    return
  }

  parsed.compilerOptions = {
    ...parsed.compilerOptions,
    types: [...currentTypes, 'node']
  }

  await writeFile(filePath, `${JSON.stringify(parsed, null, 2)}\n`, 'utf8')
}

export default defineNuxtConfig({
  modules: [
    '@nuxt/ui',
    '@pinia/nuxt',
    '@vueuse/nuxt'
  ],

  devtools: {
    enabled: false
  },

  app: {
    head: {
      htmlAttrs: {
        lang: 'en'
      }
    }
  },

  css: ['~/assets/css/main.css'],

  runtimeConfig: {
    adminSessionCookieName: 'brado_admin_session',
    adminSessionSecret: env.NUXT_ADMIN_SESSION_SECRET || env.NUXT_SESSION_SECRET || env.ADMIN_SESSION_SECRET || '',
    barberTokenCookieName: 'brado_barber_token',
    cookieSecure: env.NUXT_COOKIE_SECURE || env.COOKIE_SECURE || '',
    supabaseServiceRoleKey: env.NUXT_SUPABASE_SERVICE_ROLE_KEY || env.SUPABASE_SERVICE_ROLE_KEY || '',
    supabaseUrl: env.NUXT_SUPABASE_URL || env.SUPABASE_URL || '',
    public: {
      apiBase
    }
  },

  future: {
    compatibilityVersion: 4
  },

  compatibilityDate: '2024-07-11',

  nitro: {
    preset: nitroPreset || undefined,
    externals: {
      trace: false,
      inline: [
        // Inline deps to avoid absolute file://node_modules paths in Netlify functions
        'zod',
        '@iconify/utils',
        'consola'
      ]
    }
  },

  typescript: {
    strict: true,
    typeCheck: true
  },

  hooks: {
    'app:templatesGenerated': async () => {
      await Promise.all([
        stripRouteBlockPlugin('.nuxt', 'tsconfig.json'),
        stripRouteBlockPlugin('.nuxt', 'tsconfig.app.json'),
        ensureNodeTypes('.nuxt', 'tsconfig.node.json'),
        stripRouteBlockPlugin('node_modules/.cache/nuxt/.nuxt', 'tsconfig.json'),
        stripRouteBlockPlugin('node_modules/.cache/nuxt/.nuxt', 'tsconfig.app.json'),
        ensureNodeTypes('node_modules/.cache/nuxt/.nuxt', 'tsconfig.node.json')
      ])
    }
  }
})

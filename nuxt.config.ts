/// <reference types="node" />

import { readFile, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'

const routeBlockPlugin = 'vue-router/volar/sfc-route-blocks'
const env = process.env
const apiBase = String(env.NUXT_PUBLIC_API_BASE || env.API_BASE || 'https://api.bradobrey.uz').trim().replace(/\/+$/, '')
const nitroPreset = env.SERVER_PRESET || env.NITRO_PRESET || 'node-server'
const inlineAllServerDeps = env.NITRO_INLINE_SERVER_DEPS === 'true'
const minimalServerDepsToInline = ['@vue/shared']
const fullServerDepsToInline = [
  'zod',
  '@iconify/utils',
  'consola',
  'vue',
  'vue/server-renderer',
  'vue-bundle-renderer',
  'pinia',
  'vue-router',
  'unhead',
  'devalue',
  '@nuxt/ui',
  'reka-ui',
  'tailwindcss',
  'tailwind-variants',
  '@iconify/vue',
  '@tanstack/vue-table',
  '@tanstack/vue-virtual',
  '@tanstack/table-core',
  '@tanstack/virtual-core',
  'vaul-vue',
  '@vue/shared',
  '@vue/runtime-dom',
  '@vue/compiler-dom',
  '@vue/server-renderer',
  'perfect-debounce',
  '@vueuse/integrations',
  'bcryptjs',
  'tailwind-merge',
  'aria-hidden',
  '@floating-ui/vue',
  '@floating-ui/dom',
  '@floating-ui/utils',
  '@floating-ui/core',
  'fuse.js',
  'entities',
  'estree-walker',
  'source-map-js',
  '@vue/runtime-core',
  '@vue/compiler-ssr',
  '@vue/reactivity'
]
const serverDepsToInline = inlineAllServerDeps ? fullServerDepsToInline : minimalServerDepsToInline

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
  ssr: true,

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

  // The dashboard theme is light-only (see app/assets/css/main.css — no dark
  // variants). Force light mode so Nuxt UI does not follow the OS/browser dark
  // preference and flip text tokens to white on the light surfaces.
  colorMode: {
    preference: 'light',
    fallback: 'light'
  },

  runtimeConfig: {
    adminBackendTokenCookieName: 'brado_admin_backend_token',
    adminSessionCookieName: 'brado_admin_session',
    adminSessionSecret: env.NUXT_ADMIN_SESSION_SECRET || env.NUXT_SESSION_SECRET || env.ADMIN_SESSION_SECRET || '',
    barberTokenCookieName: 'brado_barber_token',
    cookieSecure: env.NUXT_COOKIE_SECURE || env.COOKIE_SECURE || '',
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
    sourceMap: false,
    externals: {
      trace: true,
      inline: serverDepsToInline
    }
  },

  typescript: {
    strict: true,
    typeCheck: true
  },

  hooks: {
    'nitro:config': (nitroConfig) => {
      if (nitroConfig.dev) {
        nitroConfig.externals = {
          ...nitroConfig.externals,
          // Dev tracing can prune Vue SSR files while rewriting conditional exports to production paths.
          trace: false
        }
      }
    },

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

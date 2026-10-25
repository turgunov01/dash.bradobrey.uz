const defaultApiBase = 'https://api.bradobrey.uz'

export function normalizeMediaText(value: unknown) {
  if (value === undefined || value === null) return null
  const text = String(value).trim()
  return text || null
}

const UPLOADS_PREFIX = '/uploads/'

/**
 * Resolves a media path/URL from the API. Files under the API's `/uploads/`
 * are returned as same-origin `/uploads/...` paths, which the dashboard proxies
 * (see routeRules in nuxt.config.ts) — the API's CORP header would otherwise
 * block them on non-bradobrey.uz hosts.
 */
export function resolveApiMediaUrl(value: unknown, apiBase?: unknown) {
  const url = normalizeMediaText(value)
  if (!url) return null

  if (/^(data|blob):/i.test(url)) {
    return url
  }

  const base = (normalizeMediaText(apiBase) || defaultApiBase).replace(/\/+$/, '')

  if (/^(https?:)?\/\//i.test(url)) {
    const apiOrigin = new URL(base).origin
    const parsed = new URL(url, base)
    return parsed.origin === apiOrigin && parsed.pathname.startsWith(UPLOADS_PREFIX)
      ? `${parsed.pathname}${parsed.search}`
      : url
  }

  const path = `/${url.replace(/^\/+/, '')}`
  return path.startsWith(UPLOADS_PREFIX) ? path : `${base}${path}`
}

const defaultApiBase = 'https://api.bradobrey.uz'

export function normalizeMediaText(value: unknown) {
  if (value === undefined || value === null) return null
  const text = String(value).trim()
  return text || null
}

export function resolveApiMediaUrl(value: unknown, apiBase?: unknown) {
  const url = normalizeMediaText(value)
  if (!url) return null

  if (/^(https?:)?\/\//i.test(url) || /^(data|blob):/i.test(url)) {
    return url
  }

  const base = normalizeMediaText(apiBase) || defaultApiBase

  return `${base.replace(/\/+$/, '')}/${url.replace(/^\/+/, '')}`
}

type ParsedYouTubeLink = {
  canonicalUrl: string
  videoId: string
}

const videoIdPattern = /^[a-zA-Z0-9_-]{11}$/

function hasScheme(input: string) {
  return /^[a-zA-Z][a-zA-Z\d+.-]*:/.test(input)
}

function toUrl(input: string): URL | null {
  const trimmed = input.trim()
  if (!trimmed) return null

  const normalized = hasScheme(trimmed) ? trimmed : `https://${trimmed.replace(/^\/+/, '')}`

  try {
    return new URL(normalized)
  }
  catch {
    return null
  }
}

function extractVideoId(url: URL): string | null {
  const host = url.hostname.toLowerCase()
  const path = url.pathname

  if (host === 'youtu.be') {
    const candidate = path.split('/').filter(Boolean)[0] || ''
    return videoIdPattern.test(candidate) ? candidate : null
  }

  if (host === 'youtube.com' || host.endsWith('.youtube.com')) {
    if (path === '/watch') {
      const candidate = url.searchParams.get('v') || ''
      return videoIdPattern.test(candidate) ? candidate : null
    }

    const match = path.match(/^\/(?:shorts|embed|live|v)\/([a-zA-Z0-9_-]{11})(?:\/|$)/)
    if (match?.[1] && videoIdPattern.test(match[1])) {
      return match[1]
    }
  }

  return null
}

export function parseYouTubeLink(input: string): ParsedYouTubeLink | null {
  const url = toUrl(input)
  if (!url) return null

  const videoId = extractVideoId(url)
  if (!videoId) return null

  return {
    canonicalUrl: `https://youtu.be/${videoId}`,
    videoId
  }
}


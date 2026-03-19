import { getRequestProtocol, type H3Event } from 'h3'

function parseBoolean(value: unknown) {
  if (value === true || value === 'true' || value === '1') {
    return true
  }

  if (value === false || value === 'false' || value === '0') {
    return false
  }

  return null
}

export function shouldUseSecureCookie(event: H3Event) {
  const override = parseBoolean(useRuntimeConfig(event).cookieSecure)

  if (override !== null) {
    return override
  }

  return getRequestProtocol(event, { xForwardedProto: true }) === 'https'
}

export function parseWebNodeHeaders(value?: string): Record<string, string> {
  if (!value?.trim()) return {}
  try {
    const parsed = JSON.parse(value)
    if (!parsed || Array.isArray(parsed) || typeof parsed !== 'object') return {}
    return Object.fromEntries(
      Object.entries(parsed)
        .filter(([key, item]) => key.trim() && typeof item === 'string')
        .map(([key, item]) => [key.trim(), item as string]),
    )
  } catch {
    return {}
  }
}

const SENSITIVE_HEADER_NAMES = new Set([
  'authorization',
  'cookie',
  'proxy-authorization',
  'x-api-key',
  'x-auth-token',
])

export function safeWebNodeHeaders(value: string | undefined, url: string) {
  const headers = parseWebNodeHeaders(value)
  let removedSensitive = false
  try {
    if (new URL(url, globalThis.location?.origin || 'http://localhost').protocol === 'https:') {
      return { headers, removedSensitive }
    }
  } catch {
    return { headers, removedSensitive }
  }
  for (const name of Object.keys(headers)) {
    if (SENSITIVE_HEADER_NAMES.has(name.toLowerCase())) {
      delete headers[name]
      removedSensitive = true
    }
  }
  return { headers, removedSensitive }
}

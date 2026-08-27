export function safeReturnPath(value, fallback = '/') {
  if (typeof value !== 'string' || !value.startsWith('/') || value.startsWith('//')) return fallback
  try {
    const url = new URL(value, 'https://votiy.local')
    return url.origin === 'https://votiy.local' ? `${url.pathname}${url.search}${url.hash}` : fallback
  } catch { return fallback }
}

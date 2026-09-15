/**
 * In-memory rate limiter for login endpoint.
 * Max 5 attempts per IP per 60-second window.
 * No external dependencies required.
 */

interface RateLimitEntry {
  count: number
  windowStart: number
}

const store = new Map<string, RateLimitEntry>()
const MAX_ATTEMPTS = 5
const WINDOW_MS = 60 * 1000 // 1 minute

export function checkRateLimit(ip: string): { allowed: boolean; remaining: number; resetInMs: number } {
  const now = Date.now()
  const entry = store.get(ip)

  if (!entry || now - entry.windowStart > WINDOW_MS) {
    // New window
    store.set(ip, { count: 1, windowStart: now })
    return { allowed: true, remaining: MAX_ATTEMPTS - 1, resetInMs: WINDOW_MS }
  }

  if (entry.count >= MAX_ATTEMPTS) {
    const resetInMs = WINDOW_MS - (now - entry.windowStart)
    return { allowed: false, remaining: 0, resetInMs }
  }

  entry.count++
  return { allowed: true, remaining: MAX_ATTEMPTS - entry.count, resetInMs: WINDOW_MS - (now - entry.windowStart) }
}

export function resetRateLimit(ip: string): void {
  store.delete(ip)
}

// Cleanup old entries every 5 minutes to prevent memory bloat
setInterval(() => {
  const now = Date.now()
  for (const [key, value] of store.entries()) {
    if (now - value.windowStart > WINDOW_MS * 2) {
      store.delete(key)
    }
  }
}, 5 * 60 * 1000)

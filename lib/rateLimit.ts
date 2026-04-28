// In-process rate limiter — burst protection per serverless instance.
// Upgrade to Upstash Redis or Vercel KV for cross-instance enforcement.

interface Bucket { count: number; resetAt: number }
const store = new Map<string, Bucket>()

export function rateLimit(
  userId: string,
  route: string,
  { max, windowSec }: { max: number; windowSec: number },
): { ok: boolean; retryAfterSec?: number } {
  const key = `${userId}:${route}`
  const now = Date.now()
  const windowMs = windowSec * 1000

  const bucket = store.get(key)
  if (!bucket || now > bucket.resetAt) {
    store.set(key, { count: 1, resetAt: now + windowMs })
    return { ok: true }
  }

  if (bucket.count >= max) {
    return { ok: false, retryAfterSec: Math.ceil((bucket.resetAt - now) / 1000) }
  }

  bucket.count++
  return { ok: true }
}

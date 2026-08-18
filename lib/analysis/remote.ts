import 'server-only'

/** Soft concurrency for POST /analyze — Cloud Run often has concurrency=1. */
export const ANALYZE_CONCURRENCY = 2

/** Soft concurrency for POST /voice — MiniLM is heavier; keep serial. */
export const VOICE_CONCURRENCY = 1

/** Soft concurrency for POST /sensory — MiniLM on leftover sentences; keep serial. */
export const SENSORY_CONCURRENCY = 1

const RETRYABLE_STATUS = new Set([408, 429, 500, 502, 503, 504])
const MAX_ATTEMPTS = 4
const BASE_DELAY_MS = 400
const MAX_DELAY_MS = 8_000

export function analysisAuthHeaders(): HeadersInit {
  return {
    'content-type': 'application/json',
    ...(process.env.ANALYSIS_API_KEY
      ? { authorization: `Bearer ${process.env.ANALYSIS_API_KEY}` }
      : {}),
  }
}

function sleep(ms: number) {
  return new Promise<void>((resolve) => setTimeout(resolve, ms))
}

function backoffDelay(attempt: number): number {
  // attempt is 0-based after a failure; exponential + full jitter
  const exp = Math.min(MAX_DELAY_MS, BASE_DELAY_MS * 2 ** attempt)
  return Math.floor(Math.random() * (exp + 1))
}

export function isRetryableHttpStatus(status: number): boolean {
  return RETRYABLE_STATUS.has(status)
}

export function isRetryableError(err: unknown): boolean {
  if (!(err instanceof Error)) return false
  const msg = err.message.toLowerCase()
  // Our fetch helpers embed the status: "… responded 500 …"
  const statusMatch = msg.match(/responded (\d{3})/)
  if (statusMatch && isRetryableHttpStatus(Number(statusMatch[1]))) return true
  // Network / abort / cold-start races
  return (
    msg.includes('fetch failed') ||
    msg.includes('aborted') ||
    msg.includes('econnreset') ||
    msg.includes('etimedout') ||
    msg.includes('socket')
  )
}

/**
 * Retry an async operation on transient failures (5xx, 429, network).
 * Uses exponential backoff with full jitter.
 */
export async function withRetry<T>(
  label: string,
  fn: () => Promise<T>,
  opts: { attempts?: number } = {},
): Promise<T> {
  const attempts = opts.attempts ?? MAX_ATTEMPTS
  let lastErr: unknown
  for (let i = 0; i < attempts; i++) {
    try {
      return await fn()
    } catch (err) {
      lastErr = err
      if (i === attempts - 1 || !isRetryableError(err)) throw err
      const delay = backoffDelay(i)
      console.warn(
        `[analysis] ${label} failed (attempt ${i + 1}/${attempts}), retrying in ${delay}ms:`,
        err instanceof Error ? err.message : err,
      )
      await sleep(delay)
    }
  }
  throw lastErr
}

/**
 * Run async work over items with a fixed concurrency pool.
 * Starts up to `concurrency` tasks; as each finishes, starts the next.
 */
export async function mapPool<T, R>(
  items: T[],
  concurrency: number,
  worker: (item: T, index: number) => Promise<R>,
): Promise<R[]> {
  if (items.length === 0) return []
  const limit = Math.max(1, Math.min(concurrency, items.length))
  const results = new Array<R>(items.length)
  let next = 0

  async function run() {
    while (true) {
      const i = next++
      if (i >= items.length) return
      results[i] = await worker(items[i], i)
    }
  }

  await Promise.all(Array.from({ length: limit }, () => run()))
  return results
}

/**
 * Best-effort warm of a scaled-to-zero Cloud Run instance via GET /health.
 * Failures are ignored — the real requests still retry.
 */
export async function warmAnalysisBackend(baseUrl: string): Promise<void> {
  const url = `${baseUrl.replace(/\/$/, '')}/health`
  try {
    await withRetry(
      'GET /health',
      async () => {
        const res = await fetch(url, {
          method: 'GET',
          cache: 'no-store',
          // Health is open (no auth) per the handoff.
        })
        if (!res.ok && isRetryableHttpStatus(res.status)) {
          throw new Error(`Health check responded ${res.status}`)
        }
        // Non-retryable non-OK: still don't block analysis
        return
      },
      { attempts: 3 },
    )
  } catch (err) {
    console.warn(
      '[analysis] warm /health failed (continuing):',
      err instanceof Error ? err.message : err,
    )
  }
}

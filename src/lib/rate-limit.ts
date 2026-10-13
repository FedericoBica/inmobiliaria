// Rate limiter en memoria — un solo proceso, sin dependencia de Redis.
// Si más adelante se escala a múltiples instancias, reemplazar por Redis
// (el proyecto ya prevé REDIS_URL para BullMQ).

type Bucket = { count: number; resetAt: number };

const buckets = new Map<string, Bucket>();

// Limpieza periódica para no acumular buckets vencidos indefinidamente
const CLEANUP_INTERVAL_MS = 10 * 60 * 1000;
let lastCleanup = Date.now();

function cleanup(now: number) {
  if (now - lastCleanup < CLEANUP_INTERVAL_MS) return;
  lastCleanup = now;
  for (const [key, bucket] of buckets) {
    if (bucket.resetAt <= now) buckets.delete(key);
  }
}

export type RateLimitOptions = {
  limit: number;
  windowMs: number;
};

// Devuelve true si la request está permitida, false si superó el límite.
export function checkRateLimit(key: string, opts: RateLimitOptions): boolean {
  const now = Date.now();
  cleanup(now);

  const existing = buckets.get(key);
  if (!existing || existing.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + opts.windowMs });
    return true;
  }

  if (existing.count >= opts.limit) return false;

  existing.count += 1;
  return true;
}

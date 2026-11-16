/**
 * In-Memory Sliding-Window Rate Limiter.
 * Protects auth and high-frequency endpoints against brute-force & spamming
 * without introducing heavy Redis or external infra dependencies.
 */

interface RateLimitRecord {
  count: number;
  resetAt: number;
}

const store = new Map<string, RateLimitRecord>();

// Clean up stale entries every 5 minutes to prevent memory leaks
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now();
    for (const [key, record] of store.entries()) {
      if (record.resetAt <= now) {
        store.delete(key);
      }
    }
  }, 5 * 60 * 1000).unref?.();
}

export interface RateLimitOptions {
  limit?: number;     // Max requests allowed in window (default: 15)
  windowMs?: number;  // Window duration in ms (default: 60,000 = 1 minute)
}

export function rateLimit(key: string, options: RateLimitOptions = {}): {
  success: boolean;
  limit: number;
  remaining: number;
  resetAt: number;
} {
  const limit = options.limit || 15;
  const windowMs = options.windowMs || 60 * 1000;
  const now = Date.now();

  const record = store.get(key);

  if (!record || record.resetAt <= now) {
    const newRecord: RateLimitRecord = { count: 1, resetAt: now + windowMs };
    store.set(key, newRecord);
    return {
      success: true,
      limit,
      remaining: limit - 1,
      resetAt: newRecord.resetAt,
    };
  }

  if (record.count >= limit) {
    return {
      success: false,
      limit,
      remaining: 0,
      resetAt: record.resetAt,
    };
  }

  record.count += 1;
  return {
    success: true,
    limit,
    remaining: limit - record.count,
    resetAt: record.resetAt,
  };
}

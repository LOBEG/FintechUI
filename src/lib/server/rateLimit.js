// Lightweight in-memory rate limiter for Next.js API routes.
//
// Buckets are keyed by `${routeKey}:${clientIp}` and store a sliding window
// of request timestamps. Because Next.js route handlers run inside a single
// Node process per replica, this is effective for single-replica deployments
// (which Oakmont Digital Markets Group uses). For multi-replica scale-out, replace this with a
// Redis-backed limiter without touching callers.

const buckets = new Map();

function clientIp(req) {
  const h = req?.headers;
  if (!h) return 'unknown';
  const xf = h.get?.('x-forwarded-for') || '';
  if (xf) return xf.split(',')[0].trim();
  return h.get?.('x-real-ip') || 'unknown';
}

/**
 * @param {Request} req
 * @param {{ key: string, max: number, windowMs: number }} opts
 * @returns {{ ok: boolean, retryAfterMs: number, remaining: number }}
 */
export function rateLimit(req, { key, max, windowMs }) {
  const ip = clientIp(req);
  const bucketKey = `${key}:${ip}`;
  const now = Date.now();
  const cutoff = now - windowMs;
  const arr = buckets.get(bucketKey) || [];
  // Drop expired hits.
  const fresh = arr.filter((t) => t > cutoff);
  if (fresh.length >= max) {
    const oldest = fresh[0];
    const retryAfterMs = Math.max(0, oldest + windowMs - now);
    buckets.set(bucketKey, fresh);
    return { ok: false, retryAfterMs, remaining: 0 };
  }
  fresh.push(now);
  buckets.set(bucketKey, fresh);
  // Opportunistic cleanup so the Map doesn't grow forever.
  if (buckets.size > 5000) {
    let n = 0;
    for (const [k, v] of buckets) {
      if (!v.length || v[v.length - 1] < cutoff) {
        buckets.delete(k);
        if (++n > 1000) break;
      }
    }
  }
  return { ok: true, retryAfterMs: 0, remaining: max - fresh.length };
}

import { NextResponse } from 'next/server';

/**
 * Convenience helper that returns a 429 NextResponse when over the limit,
 * or `null` when the request is allowed.
 */
export function rateLimitOrJson(req, opts) {
  const r = rateLimit(req, opts);
  if (r.ok) return null;
  const seconds = Math.ceil(r.retryAfterMs / 1000);
  return NextResponse.json(
    { error: `Too many requests — try again in ${seconds}s.` },
    {
      status: 429,
      headers: { 'Retry-After': String(seconds) },
    },
  );
}

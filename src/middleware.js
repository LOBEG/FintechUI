// Tag every request with an X-Request-ID so production logs are
// traceable from edge to server to admin queries. Generates a short
// random ID if the upstream load balancer didn't already attach one
// (Cloudflare sends cf-ray; some proxies send x-request-id directly).
//
// Kept dependency-free - Next.js middleware runs on the edge runtime
// where node:crypto isn't available, so we use Web Crypto via
// crypto.randomUUID().
import { NextResponse } from 'next/server';

export const config = {
  // Skip Next internals + static assets - they don't need request IDs.
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};

export function middleware(req) {
  const incoming = req.headers.get('x-request-id') || req.headers.get('cf-ray');
  const rid = incoming || (typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID().replace(/-/g, '').slice(0, 16)
    : Math.random().toString(36).slice(2, 18));
  // Propagate to the route handler so server logs can include it.
  const headers = new Headers(req.headers);
  headers.set('x-request-id', rid);
  const res = NextResponse.next({ request: { headers } });
  res.headers.set('x-request-id', rid);
  res.headers.set('X-Content-Type-Options', 'nosniff');
  res.headers.set('X-Frame-Options', 'DENY');
  res.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=(), payment=()');
  res.headers.set('Content-Security-Policy', "base-uri 'self'; object-src 'none'; frame-ancestors 'none'; form-action 'self'");
  if (process.env.NODE_ENV === 'production') {
    res.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
  }
  return res;
}

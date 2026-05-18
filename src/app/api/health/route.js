// Liveness / readiness probe for load-balancers (Railway, etc.).
// Reports the build SHA, that the data volume is writable, and that
// Binance's API is reachable from this server. Returns HTTP 200 even on
// partial degradation so the LB does not flap; callers should look at
// the JSON body to decide alerting.
import { NextResponse } from 'next/server';
import fs from 'node:fs';
import path from 'node:path';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const DATA_DIR = process.env.DATA_DIR || path.join(process.cwd(), 'data');

async function pingBinance() {
  try {
    const res = await fetch('https://api.binance.com/api/v3/ping', {
      cache: 'no-store',
      signal: AbortSignal.timeout(2500),
    });
    return res.ok;
  } catch (_) {
    return false;
  }
}

function dbWritable() {
  try {
    if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
    const probe = path.join(DATA_DIR, '.health-probe');
    fs.writeFileSync(probe, String(Date.now()));
    fs.unlinkSync(probe);
    return true;
  } catch (_) {
    return false;
  }
}

export async function GET() {
  const startedAt = Date.now();
  const [binance] = await Promise.all([pingBinance()]);
  const db = dbWritable();
  const body = {
    status: db ? 'ok' : 'degraded',
    version: process.env.RAILWAY_GIT_COMMIT_SHA
      || process.env.VERCEL_GIT_COMMIT_SHA
      || process.env.GIT_SHA
      || 'dev',
    checks: {
      db,
      binance,
    },
    latencyMs: Date.now() - startedAt,
    ts: Date.now(),
  };
  return NextResponse.json(body, {
    status: db ? 200 : 503,
    headers: { 'Cache-Control': 'no-store' },
  });
}

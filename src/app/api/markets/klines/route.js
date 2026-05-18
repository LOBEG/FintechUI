// Proxy for Binance kline (candle) data, used by the dashboard chart.
// See ../ticker/route.js for the rationale (Binance blocks some browser
// IPs, this proxy works around that and centralises rate-limit handling).
import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const REST = process.env.BINANCE_API_BASE || 'https://api.binance.com';
const VALID_INTERVALS = new Set([
  '1m','3m','5m','15m','30m',
  '1h','2h','4h','6h','8h','12h',
  '1d','3d','1w','1M',
]);

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const symbol = String(searchParams.get('symbol') || '').toUpperCase().trim();
  const interval = String(searchParams.get('interval') || '5m').trim();
  const limit = Math.min(1000, Math.max(1, parseInt(searchParams.get('limit') || '60', 10) || 60));
  if (!/^[A-Z0-9]{4,16}$/.test(symbol)) {
    return NextResponse.json({ error: 'symbol invalid' }, { status: 400 });
  }
  if (!VALID_INTERVALS.has(interval)) {
    return NextResponse.json({ error: 'interval invalid' }, { status: 400 });
  }
  try {
    const url = `${REST}/api/v3/klines?symbol=${symbol}&interval=${interval}&limit=${limit}`;
    const res = await fetch(url, { cache: 'no-store' });
    if (!res.ok) throw new Error(`binance ${res.status}`);
    const data = await res.json();
    return NextResponse.json(data, { headers: { 'Cache-Control': 'no-store' } });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 502 });
  }
}

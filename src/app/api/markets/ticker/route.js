// Proxy for Binance's 24h ticker, so the browser never talks to
// api.binance.com directly (Binance refuses some IPs — notably US — and
// blocking issues should not break the dashboard for any user).
import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const REST = 'https://api.binance.com';

// Symbols can be passed as a comma-separated string ("BTCUSDT,ETHUSDT")
// or as a JSON array. Returns the raw Binance 24h ticker payload.
export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const raw = searchParams.get('symbols');
  if (!raw) {
    return NextResponse.json({ error: 'symbols query param required' }, { status: 400 });
  }
  let symbols;
  try {
    symbols = raw.trim().startsWith('[') ? JSON.parse(raw) : raw.split(',');
  } catch (_) {
    return NextResponse.json({ error: 'symbols must be a comma list or JSON array' }, { status: 400 });
  }
  symbols = symbols
    .map((s) => String(s || '').toUpperCase().trim())
    .filter(Boolean)
    .slice(0, 100);
  if (!symbols.length) {
    return NextResponse.json({ error: 'no valid symbols supplied' }, { status: 400 });
  }
  const qs = encodeURIComponent(JSON.stringify(symbols));
  try {
    const res = await fetch(`${REST}/api/v3/ticker/24hr?symbols=${qs}`, { cache: 'no-store' });
    if (!res.ok) throw new Error(`binance ${res.status}`);
    const data = await res.json();
    return NextResponse.json(data, { headers: { 'Cache-Control': 'no-store' } });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 502 });
  }
}

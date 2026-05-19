// Proxy for Binance kline (candle) data, used by the dashboard chart.
// See ../ticker/route.js for the rationale (Binance blocks some browser
// IPs, this proxy works around that and centralises rate-limit handling).
import { NextResponse } from 'next/server';
import { fetchBinanceJson } from '@/lib/server/binance.js';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

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
  const qs = `symbol=${encodeURIComponent(symbol)}&interval=${encodeURIComponent(interval)}&limit=${limit}`;
  try {
    const { data, upstream } = await fetchBinanceJson(`/api/v3/klines?${qs}`);
    return NextResponse.json(data, { headers: { 'Cache-Control': 'no-store', 'X-Binance-Upstream': upstream } });
  } catch (err) {
    try {
      const { data, upstream } = await fetchBinanceJson(`/api/v3/uiKlines?${qs}`);
      return NextResponse.json(data, {
        headers: {
          'Cache-Control': 'no-store',
          'X-Binance-Upstream': upstream,
          'X-Binance-Kline-Endpoint': 'uiKlines',
        },
      });
    } catch (_) {
      return NextResponse.json({ error: err.message }, { status: 502 });
    }
  }
}

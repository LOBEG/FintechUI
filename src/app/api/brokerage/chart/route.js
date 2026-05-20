import { NextResponse } from 'next/server';
import { brokerageChart } from '@/lib/server/brokerage.js';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const VALID_RANGE = new Set(['1d','5d','1mo','3mo','6mo','1y','2y','5y','10y','ytd','max']);
const VALID_INTERVAL = new Set(['1m','2m','5m','15m','30m','60m','90m','1h','1d','5d','1wk','1mo','3mo']);

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const symbol = String(searchParams.get('symbol') || '').trim();
  const range = String(searchParams.get('range') || '1mo').trim();
  const interval = String(searchParams.get('interval') || '1d').trim();
  if (!symbol) {
    return NextResponse.json({ error: 'symbol required' }, { status: 400 });
  }
  if (!VALID_RANGE.has(range)) {
    return NextResponse.json({ error: 'range invalid' }, { status: 400 });
  }
  if (!VALID_INTERVAL.has(interval)) {
    return NextResponse.json({ error: 'interval invalid' }, { status: 400 });
  }
  const data = await brokerageChart(symbol, { range, interval });
  if (!data) {
    return NextResponse.json({ error: 'no data' }, { status: 502 });
  }
  return NextResponse.json(data, { headers: { 'Cache-Control': 'no-store' } });
}

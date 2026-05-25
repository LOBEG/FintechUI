import { NextResponse } from 'next/server';
import { optionsChain } from '@/lib/server/brokerage.js';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const symbol = String(searchParams.get('symbol') || '').trim();
  const expiration = searchParams.get('expiration');
  if (!symbol) {
    return NextResponse.json({ error: 'symbol required' }, { status: 400 });
  }
  const data = await optionsChain(symbol, expiration ? Number(expiration) : null);
  if (!data) {
    return NextResponse.json({ error: 'no data' }, { status: 502 });
  }
  return NextResponse.json(data, { headers: { 'Cache-Control': 'no-store' } });
}

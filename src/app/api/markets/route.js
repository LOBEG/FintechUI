import { NextResponse } from 'next/server';
import { marketStats, KNOWN_SYMBOLS, SYMBOL_INFO } from '@/lib/server/prices.js';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  const stats = await marketStats();
  const rows = stats
    .filter((s) => Number.isFinite(Number(s.price)) && Number(s.price) > 0)
    .map((s) => {
      const meta = SYMBOL_INFO[s.symbol] || {};
      return {
        ...s,
        name: meta.name || s.name || s.symbol,
        color: meta.color || s.color || '#06d6c4',
        signal: Number(s.pct) >= 1 ? 'Accumulate' : Number(s.pct) <= -1 ? 'Reduce' : 'Hold / observe',
        live: true,
      };
    });
  const supported = KNOWN_SYMBOLS.filter((s) => s !== 'USDT').map((sym) => {
    const meta = SYMBOL_INFO[sym] || {};
    return { symbol: sym, name: meta.name || sym, color: meta.color || '#06d6c4' };
  });
  return NextResponse.json({ markets: rows, supported });
}

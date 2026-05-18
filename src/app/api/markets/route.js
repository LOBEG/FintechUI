import { NextResponse } from 'next/server';
import { marketStats, KNOWN_SYMBOLS, SYMBOL_INFO } from '@/lib/server/prices.js';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  const stats = await marketStats();
  // Always include a row for every known symbol, even if Binance is rate-limited.
  const bySym = Object.fromEntries(stats.map((s) => [s.symbol, s]));
  const rows = KNOWN_SYMBOLS.filter((s) => s !== 'USDT').map((sym) => {
    const meta = SYMBOL_INFO[sym] || {};
    return bySym[sym] || {
      symbol: sym,
      name: meta.name || sym,
      color: meta.color || '#888',
      price: 0,
      pct: 0,
      high: 0,
      low: 0,
      volume: 0,
    };
  });
  return NextResponse.json({ markets: rows, supported: KNOWN_SYMBOLS });
}

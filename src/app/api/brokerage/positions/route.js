import { NextResponse } from 'next/server';
import { requireUser } from '@/lib/server/auth.js';
import { getUserPositions } from '@/lib/server/store.js';
import { brokerageQuotes } from '@/lib/server/brokerage.js';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const user = await requireUser();
    const positions = getUserPositions(user.id);
    const rows = Object.entries(positions)
      .map(([key, p]) => ({ key, ...p }))
      .filter((p) => Number(p.qty) > 0);
    const symbols = Array.from(new Set(rows.map((r) => r.symbol)));
    const quotes = symbols.length ? await brokerageQuotes(symbols) : [];
    const priceBySym = new Map(quotes.map((q) => [q.symbol, q.price]));
    const enriched = rows.map((p) => {
      const livePrice = Number(priceBySym.get(p.symbol)) || 0;
      const marketUsd = Math.round(Number(p.qty) * livePrice * 100) / 100;
      const invested = Number(p.usdInvested) || 0;
      const pnlUsd = Math.round((marketUsd - invested) * 100) / 100;
      const pnlPct = invested > 0 ? ((marketUsd - invested) / invested) * 100 : 0;
      return { ...p, livePrice, marketUsd, pnlUsd, pnlPct };
    });
    return NextResponse.json({ positions: enriched, count: enriched.length });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: err.status || 500 });
  }
}

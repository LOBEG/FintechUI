// GET /api/portfolio - cost-basis P&L per position.
//
// Returns the user's current positions enriched with weighted-average
// cost basis (computed from `transactions.json`), live mark, market
// value, unrealised P&L, and lifetime realised P&L per symbol. Used by
// the dashboard's PortfolioPanel and the Investor page.
import { NextResponse } from 'next/server';
import { requireUser } from '@/lib/server/auth.js';
import { pricesFor } from '@/lib/server/prices.js';
import { buildPortfolio } from '@/lib/server/pnl.js';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const user = await requireUser();
    const balances = user.balances || {};
    const symbols = Object.keys(balances).filter((s) => s !== 'USDT');
    let marks = {};
    try {
      marks = symbols.length ? await pricesFor(symbols) : {};
    } catch (_) {
      // Pricing is best-effort - if Binance is unreachable we still
      // return the position list so the user can see qty + cost basis.
      marks = {};
    }
    const snapshot = buildPortfolio({ userId: user.id, balances, marks });
    return NextResponse.json({ ok: true, ...snapshot });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: err.status || 500 });
  }
}

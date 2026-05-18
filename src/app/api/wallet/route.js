import { NextResponse } from 'next/server';
import { requireUser } from '@/lib/server/auth.js';
import { transactionsForUser } from '@/lib/server/store.js';
import { pricesFor } from '@/lib/server/prices.js';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const user = await requireUser();
    const balances = user.balances || {};
    const symbols = Object.keys(balances);
    const prices = symbols.length ? await pricesFor(symbols) : {};
    const breakdown = symbols.map((sym) => {
      const amount = balances[sym] || 0;
      const price = prices[sym] || (sym === 'USDT' ? 1 : 0);
      return { symbol: sym, amount, price, usdValue: amount * price };
    });
    const totalUsd = breakdown.reduce((s, b) => s + b.usdValue, 0);
    const tx = transactionsForUser(user.id).slice(0, 50);
    return NextResponse.json({
      balances,
      breakdown,
      totalUsd,
      transactions: tx,
    });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: err.status || 500 });
  }
}

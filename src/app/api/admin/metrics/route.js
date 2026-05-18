// Admin metrics dashboard — AUM, per-asset float, 24h dep/wd, MAU.
import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/server/auth.js';
import {
  listUsers,
  listTransactions,
  listTokens,
  listSessions,
} from '@/lib/server/store.js';
import { pricesFor } from '@/lib/server/prices.js';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const DAY_MS = 24 * 60 * 60 * 1000;
const MONTH_MS = 30 * DAY_MS;

export async function GET() {
  try {
    await requireAdmin();
    const users = listUsers();
    const txs = listTransactions();
    const tokens = listTokens();
    const sessions = listSessions();

    // Aggregate balances across all users to compute per-asset float.
    const float = {};
    for (const u of users) {
      const b = u.balances || {};
      for (const sym of Object.keys(b)) {
        float[sym] = (float[sym] || 0) + (parseFloat(b[sym]) || 0);
      }
    }
    const symbols = Object.keys(float);
    const prices = symbols.length ? await pricesFor(symbols) : {};
    const perAsset = symbols
      .map((sym) => {
        const amount = float[sym];
        const price = prices[sym] || (sym === 'USDT' ? 1 : 0);
        return { symbol: sym, amount, price, usdValue: amount * price };
      })
      .sort((a, b) => b.usdValue - a.usdValue);
    const aum = perAsset.reduce((s, x) => s + x.usdValue, 0);

    // 24h flow.
    const now = Date.now();
    const last24h = txs.filter((t) => now - t.createdAt < DAY_MS);
    const deposits24h = last24h.filter((t) => t.type === 'credit' || t.type === 'deposit');
    const withdrawals24h = last24h.filter((t) => t.type === 'withdraw');
    const invest24h = last24h.filter((t) => t.type === 'invest' || t.type === 'buy');

    const sum = (arr) => arr.reduce((s, t) => s + (parseFloat(t.usdValue) || 0), 0);

    // Monthly active users — anyone with a session touched in the
    // window. Sessions are 30-day cookies so this is a reasonable
    // approximation. We also count anyone with a tx in the window.
    const mauIds = new Set();
    for (const s of sessions) {
      if (s.lastSeenAt && now - s.lastSeenAt < MONTH_MS) mauIds.add(s.userId);
      else if (s.createdAt && now - s.createdAt < MONTH_MS) mauIds.add(s.userId);
    }
    for (const t of txs) {
      if (t.userId && now - t.createdAt < MONTH_MS) mauIds.add(t.userId);
    }

    return NextResponse.json({
      generatedAt: now,
      aum,
      users: {
        total: users.length,
        disabled: users.filter((u) => u.accountStatus === 'disabled').length,
        mau: mauIds.size,
        newLast7d: users.filter((u) => now - (u.createdAt || 0) < 7 * DAY_MS).length,
      },
      float: perAsset,
      flow24h: {
        deposits: { count: deposits24h.length, usd: sum(deposits24h) },
        withdrawals: { count: withdrawals24h.length, usd: sum(withdrawals24h) },
        invests: { count: invest24h.length, usd: sum(invest24h) },
      },
      tokens: {
        active: tokens.filter((t) => t.status === 'active').length,
        used: tokens.filter((t) => t.status === 'used').length,
        expired: tokens.filter((t) => t.status === 'expired' || (t.expiresAt && now > t.expiresAt && t.status === 'active')).length,
      },
      transactions: { total: txs.length, last24h: last24h.length },
    });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: err.status || 500 });
  }
}

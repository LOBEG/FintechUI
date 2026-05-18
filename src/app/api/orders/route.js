// Orders API — place, list, cancel limit / stop orders.
//
// POST   /api/orders      place an order
// GET    /api/orders      list the current user's orders (open first)
// DELETE /api/orders?id=X cancel an open order
//
// Settlement is driven by a background ticker (see src/lib/server/orders.js).
// We boot the ticker lazily on the first request to avoid keeping a Node
// timer alive in build-time / SSG contexts.
import { NextResponse } from 'next/server';
import { requireUser, newId } from '@/lib/server/auth.js';
import {
  addOrder,
  updateOrder,
  ordersForUser,
  listOrders,
} from '@/lib/server/store.js';
import { isSupportedSymbol, priceFor } from '@/lib/server/prices.js';
import { rateLimitOrJson } from '@/lib/server/rateLimit.js';
import { ensureSettlerStarted, shouldFill } from '@/lib/server/orders.js';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const user = await requireUser();
    ensureSettlerStarted();
    const orders = ordersForUser(user.id)
      .sort((a, b) => {
        // Open first, then by recency.
        if (a.status === 'open' && b.status !== 'open') return -1;
        if (a.status !== 'open' && b.status === 'open') return 1;
        return (b.createdAt || 0) - (a.createdAt || 0);
      })
      .slice(0, 200);
    return NextResponse.json({ ok: true, orders });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: err.status || 500 });
  }
}

export async function POST(req) {
  try {
    const limited = rateLimitOrJson(req, { key: 'orders.place', max: 30, windowMs: 60_000 });
    if (limited) return limited;
    const user = await requireUser();
    if (user.status === 'frozen' || user.status === 'disabled') {
      return NextResponse.json({ error: 'Account is not active' }, { status: 403 });
    }
    const body = await req.json().catch(() => ({}));
    const side = body.side === 'sell' ? 'sell' : 'buy';
    const kind = body.kind === 'stop' ? 'stop' : 'limit';
    const symbol = String(body.symbol || '').toUpperCase();
    const trigger = parseFloat(body.price);
    const qty = parseFloat(body.qty);
    const usd = parseFloat(body.usd);
    if (!isSupportedSymbol(symbol) || symbol === 'USDT') {
      return NextResponse.json({ error: 'Unsupported asset' }, { status: 400 });
    }
    if (!isFinite(trigger) || trigger <= 0) {
      return NextResponse.json({ error: 'Trigger price must be greater than zero' }, { status: 400 });
    }
    // Quick sanity check vs. live price so users don't accidentally place
    // an immediately-fillable "limit" that's really a market order.
    let live = 0;
    try { live = await priceFor(symbol); } catch { /* tolerate */ }
    if (live && isFinite(live)) {
      const probe = { side, kind, price: trigger };
      if (shouldFill(probe, live)) {
        return NextResponse.json({
          error: `Trigger ${trigger} is already crossed by the live price (${live}). Use a market order if you want to execute now.`,
        }, { status: 400 });
      }
    }
    const order = {
      id: newId('ord'),
      userId: user.id,
      side,
      kind,
      symbol,
      status: 'open',
      price: trigger,
      createdAt: Date.now(),
    };
    if (side === 'buy') {
      const roundedUsd = Math.round(usd * 100) / 100;
      if (!isFinite(roundedUsd) || roundedUsd <= 0) {
        return NextResponse.json({ error: 'USD amount must be greater than zero' }, { status: 400 });
      }
      if (roundedUsd > 5_000_000) {
        return NextResponse.json({ error: 'Amount exceeds per-order limit ($5,000,000)' }, { status: 400 });
      }
      const usdt = user.balances?.USDT || 0;
      // Reserve check across all open buy orders for this user so a single
      // USDT balance can't back two orders that, taken together, would
      // overdraw at fill time.
      const reserved = listOrders()
        .filter((o) => o.userId === user.id && o.status === 'open' && o.side === 'buy')
        .reduce((s, o) => s + (Number(o.usd) || 0), 0);
      if (usdt + 1e-9 < reserved + roundedUsd) {
        return NextResponse.json({
          error: `Insufficient USDT to back this order. Available after open orders: ${(usdt - reserved).toFixed(2)}`,
        }, { status: 400 });
      }
      order.usd = roundedUsd;
    } else {
      if (!isFinite(qty) || qty <= 0) {
        return NextResponse.json({ error: 'Quantity must be greater than zero' }, { status: 400 });
      }
      const have = user.balances?.[symbol] || 0;
      const reserved = listOrders()
        .filter((o) => o.userId === user.id && o.status === 'open' && o.side === 'sell' && o.symbol === symbol)
        .reduce((s, o) => s + (Number(o.qty) || 0), 0);
      if (have + 1e-12 < reserved + qty) {
        return NextResponse.json({
          error: `Insufficient ${symbol} to back this order. Available after open orders: ${(have - reserved).toFixed(8)}`,
        }, { status: 400 });
      }
      order.qty = qty;
    }
    addOrder(order);
    ensureSettlerStarted();
    return NextResponse.json({ ok: true, order });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: err.status || 500 });
  }
}

export async function DELETE(req) {
  try {
    const user = await requireUser();
    const url = new URL(req.url);
    const id = url.searchParams.get('id');
    if (!id) {
      return NextResponse.json({ error: 'Order id is required' }, { status: 400 });
    }
    const mine = ordersForUser(user.id).find((o) => o.id === id);
    if (!mine) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }
    if (mine.status !== 'open') {
      return NextResponse.json({ error: `Cannot cancel order in status ${mine.status}` }, { status: 400 });
    }
    const updated = updateOrder(id, { status: 'cancelled', cancelledAt: Date.now() });
    return NextResponse.json({ ok: true, order: updated });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: err.status || 500 });
  }
}

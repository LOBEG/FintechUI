// Price alerts API (B2).
//
// POST   /api/alerts        create an active alert
// GET    /api/alerts        list the current user's alerts (active first)
// DELETE /api/alerts?id=X   cancel an alert
//
// Triggering is done by the same background ticker that fills orders
// (src/lib/server/orders.js → tick()) so we don't open a second Binance
// stream — one priceFor() per symbol covers both subsystems.
import { NextResponse } from 'next/server';
import { requireUser, newId } from '@/lib/server/auth.js';
import {
  addPriceAlert,
  updatePriceAlert,
  priceAlertsForUser,
} from '@/lib/server/store.js';
import { isSupportedSymbol, priceFor } from '@/lib/server/prices.js';
import { rateLimitOrJson } from '@/lib/server/rateLimit.js';
import { ensureSettlerStarted } from '@/lib/server/orders.js';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const user = await requireUser();
    ensureSettlerStarted();
    const alerts = priceAlertsForUser(user.id)
      .sort((a, b) => {
        if (a.status === 'active' && b.status !== 'active') return -1;
        if (a.status !== 'active' && b.status === 'active') return 1;
        return (b.createdAt || 0) - (a.createdAt || 0);
      })
      .slice(0, 200);
    return NextResponse.json({ ok: true, alerts });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: err.status || 500 });
  }
}

export async function POST(req) {
  try {
    const limited = rateLimitOrJson(req, { key: 'alerts.create', max: 30, windowMs: 60_000 });
    if (limited) return limited;
    const user = await requireUser();
    if (user.status === 'frozen' || user.status === 'disabled') {
      return NextResponse.json({ error: 'Account is not active' }, { status: 403 });
    }
    const body = await req.json().catch(() => ({}));
    const symbol = String(body.symbol || '').toUpperCase();
    const op = body.op === 'lt' ? 'lt' : body.op === 'gt' ? 'gt' : null;
    const threshold = parseFloat(body.threshold);
    if (!isSupportedSymbol(symbol) || symbol === 'USDT') {
      return NextResponse.json({ error: 'Unsupported asset' }, { status: 400 });
    }
    if (!op) {
      return NextResponse.json({ error: "op must be 'gt' or 'lt'" }, { status: 400 });
    }
    if (!isFinite(threshold) || threshold <= 0) {
      return NextResponse.json({ error: 'threshold must be greater than zero' }, { status: 400 });
    }
    // Reject an alert that's already past the threshold so the user
    // doesn't get an instant notification for what they thought was a
    // forward-looking watch.
    let live = 0;
    try { live = await priceFor(symbol); } catch { /* tolerate */ }
    if (live && isFinite(live)) {
      if ((op === 'gt' && live >= threshold) || (op === 'lt' && live <= threshold)) {
        return NextResponse.json({
          error: `Threshold ${threshold} is already crossed by the live price (${live}). Pick a level on the other side of the current price.`,
        }, { status: 400 });
      }
    }
    // Cap to keep noise + JSON store size sane.
    const activeCount = priceAlertsForUser(user.id).filter((a) => a.status === 'active').length;
    if (activeCount >= 50) {
      return NextResponse.json({ error: 'Maximum 50 active alerts per account' }, { status: 400 });
    }
    const alert = {
      id: newId('alr'),
      userId: user.id,
      symbol,
      op,
      threshold,
      status: 'active',
      createdAt: Date.now(),
    };
    addPriceAlert(alert);
    ensureSettlerStarted();
    return NextResponse.json({ ok: true, alert });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: err.status || 500 });
  }
}

export async function DELETE(req) {
  try {
    const user = await requireUser();
    const url = new URL(req.url);
    const id = url.searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'Alert id is required' }, { status: 400 });
    const mine = priceAlertsForUser(user.id).find((a) => a.id === id);
    if (!mine) return NextResponse.json({ error: 'Alert not found' }, { status: 404 });
    if (mine.status !== 'active') {
      return NextResponse.json({ error: `Cannot cancel alert in status ${mine.status}` }, { status: 400 });
    }
    const updated = updatePriceAlert(id, { status: 'cancelled', cancelledAt: Date.now() });
    return NextResponse.json({ ok: true, alert: updated });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: err.status || 500 });
  }
}

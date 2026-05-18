// DCA (recurring buys).
//
//   GET    /api/dca           — list current user's schedules
//   POST   /api/dca           — create a new schedule
//   PATCH  /api/dca           — { id, action: 'pause' | 'resume' }
//   DELETE /api/dca?id=...    — cancel a schedule
//
// Schedules are executed by the order settler (lib/server/orders.js)
// every 5s — see runDca() there for the per-tranche logic.
import { NextResponse } from 'next/server';
import { requireUser, newId } from '@/lib/server/auth.js';
import {
  dcasForUser,
  addDca,
  updateDca,
  listDcas,
} from '@/lib/server/store.js';
import { isSupportedSymbol } from '@/lib/server/prices.js';
import { rateLimitOrJson } from '@/lib/server/rateLimit.js';
import { ensureSettlerStarted } from '@/lib/server/orders.js';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Allowed cadences. Keys map to a human-readable label and a
// millisecond interval. We intentionally cap the floor at "daily" —
// running tighter than that wastes ticks and looks like a bot.
const INTERVALS = {
  daily:    { ms: 24 * 60 * 60 * 1000,         label: 'Every day' },
  weekly:   { ms: 7 * 24 * 60 * 60 * 1000,     label: 'Every week' },
  biweekly: { ms: 14 * 24 * 60 * 60 * 1000,    label: 'Every 2 weeks' },
  monthly:  { ms: 30 * 24 * 60 * 60 * 1000,    label: 'Every month' },
};

const MAX_PER_USER = 10;
const MIN_USD = 1;
const MAX_USD = 25_000;

export async function GET() {
  try {
    const user = await requireUser();
    const items = dcasForUser(user.id)
      .filter((d) => d.status !== 'cancelled')
      .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
    return NextResponse.json({ items, intervals: INTERVALS });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: err.status || 500 });
  }
}

export async function POST(req) {
  try {
    const user = await requireUser();
    const limited = rateLimitOrJson(req, { key: 'dca-create', max: 20, windowMs: 60_000 });
    if (limited) return limited;
    const body = await req.json().catch(() => ({}));
    const symbol = String(body.symbol || '').toUpperCase();
    const usdAmount = parseFloat(body.usdAmount);
    const interval = String(body.interval || '').toLowerCase();
    if (!isSupportedSymbol(symbol) || symbol === 'USDT') {
      return NextResponse.json({ error: 'Unsupported asset' }, { status: 400 });
    }
    if (!INTERVALS[interval]) {
      return NextResponse.json({ error: 'Unsupported interval' }, { status: 400 });
    }
    if (!isFinite(usdAmount) || usdAmount < MIN_USD || usdAmount > MAX_USD) {
      return NextResponse.json(
        { error: `Amount must be between $${MIN_USD} and $${MAX_USD}` },
        { status: 400 },
      );
    }
    // Round to cents so we don't write float dust to the schedule.
    const usd = Math.round(usdAmount * 100) / 100;
    const active = dcasForUser(user.id).filter((d) => d.status === 'active' || d.status === 'paused');
    if (active.length >= MAX_PER_USER) {
      return NextResponse.json(
        { error: `You can have at most ${MAX_PER_USER} active schedules. Cancel one first.` },
        { status: 400 },
      );
    }
    const now = Date.now();
    const dca = {
      id: newId('dca'),
      userId: user.id,
      symbol,
      usdAmount: usd,
      interval,
      intervalMs: INTERVALS[interval].ms,
      status: 'active',
      runs: 0,
      // First tranche fires on the next tick — settlement is best-effort
      // so we don't try to anchor to a specific weekday.
      nextRunAt: now,
      createdAt: now,
    };
    addDca(dca);
    ensureSettlerStarted();
    return NextResponse.json({ ok: true, dca });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: err.status || 500 });
  }
}

function ownedById(id, userId) {
  return listDcas().find((d) => d.id === id && d.userId === userId) || null;
}

export async function PATCH(req) {
  try {
    const user = await requireUser();
    const body = await req.json().catch(() => ({}));
    const dca = ownedById(String(body.id || ''), user.id);
    if (!dca) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    if (dca.status === 'cancelled') {
      return NextResponse.json({ error: 'Schedule is cancelled' }, { status: 400 });
    }
    if (body.action === 'pause') {
      const out = updateDca(dca.id, { status: 'paused', pausedAt: Date.now(), pauseReason: 'user' });
      return NextResponse.json({ ok: true, dca: out });
    }
    if (body.action === 'resume') {
      // Re-anchor nextRunAt to "now" so the user doesn't get a backlog
      // of catch-up tranches the next tick.
      const out = updateDca(dca.id, {
        status: 'active',
        pausedAt: null,
        pauseReason: null,
        nextRunAt: Date.now(),
      });
      return NextResponse.json({ ok: true, dca: out });
    }
    return NextResponse.json({ error: 'Unsupported action' }, { status: 400 });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: err.status || 500 });
  }
}

export async function DELETE(req) {
  try {
    const user = await requireUser();
    const url = new URL(req.url);
    const id = String(url.searchParams.get('id') || '');
    const dca = ownedById(id, user.id);
    if (!dca) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    if (dca.status === 'cancelled') {
      return NextResponse.json({ ok: true, dca });
    }
    const out = updateDca(dca.id, { status: 'cancelled', cancelledAt: Date.now() });
    return NextResponse.json({ ok: true, dca: out });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: err.status || 500 });
  }
}

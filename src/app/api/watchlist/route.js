// Watchlists / favourites (B2).
//
// GET  /api/watchlist          → { ok, symbols }
// PUT  /api/watchlist          → replace full list (body: { symbols: [] })
// POST /api/watchlist          → toggle one symbol (body: { symbol })
//
// Symbols are stored in their *base* form ('BTC', 'ETH', …); the client
// converts to a BINANCE pair when rendering live prices/charts. We cap
// at 50 entries per user so the JSON store row stays small.
import { NextResponse } from 'next/server';
import { requireUser } from '@/lib/server/auth.js';
import { getWatchlist, setWatchlist } from '@/lib/server/store.js';
import { isSupportedSymbol } from '@/lib/server/prices.js';
import { rateLimitOrJson } from '@/lib/server/rateLimit.js';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const MAX_SYMBOLS = 50;

function normaliseSymbol(raw) {
  let s = String(raw || '').toUpperCase().trim();
  // Accept both 'BTC' and 'BTCUSDT' shapes from the client and store the base.
  if (s.endsWith('USDT') && s !== 'USDT') s = s.slice(0, -4);
  return s;
}

export async function GET() {
  try {
    const user = await requireUser();
    return NextResponse.json({ ok: true, symbols: getWatchlist(user.id) });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: err.status || 500 });
  }
}

export async function PUT(req) {
  try {
    const limited = rateLimitOrJson(req, { key: 'watchlist.put', max: 60, windowMs: 60_000 });
    if (limited) return limited;
    const user = await requireUser();
    const body = await req.json().catch(() => ({}));
    if (!Array.isArray(body.symbols)) {
      return NextResponse.json({ error: 'symbols must be an array' }, { status: 400 });
    }
    const out = [];
    for (const raw of body.symbols) {
      const s = normaliseSymbol(raw);
      if (!s || s === 'USDT' || !isSupportedSymbol(s)) continue;
      if (!out.includes(s)) out.push(s);
      if (out.length >= MAX_SYMBOLS) break;
    }
    const saved = setWatchlist(user.id, out);
    return NextResponse.json({ ok: true, symbols: saved });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: err.status || 500 });
  }
}

export async function POST(req) {
  try {
    const limited = rateLimitOrJson(req, { key: 'watchlist.toggle', max: 60, windowMs: 60_000 });
    if (limited) return limited;
    const user = await requireUser();
    const body = await req.json().catch(() => ({}));
    const s = normaliseSymbol(body.symbol);
    if (!s || s === 'USDT' || !isSupportedSymbol(s)) {
      return NextResponse.json({ error: 'Unsupported asset' }, { status: 400 });
    }
    const current = getWatchlist(user.id);
    const i = current.indexOf(s);
    let next;
    if (i === -1) {
      if (current.length >= MAX_SYMBOLS) {
        return NextResponse.json({ error: `Watchlist is full (${MAX_SYMBOLS} max)` }, { status: 400 });
      }
      next = [...current, s];
    } else {
      next = current.slice();
      next.splice(i, 1);
    }
    const saved = setWatchlist(user.id, next);
    return NextResponse.json({ ok: true, symbols: saved, added: i === -1 });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: err.status || 500 });
  }
}

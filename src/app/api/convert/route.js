// One-tap convert between two supported assets at the live Binance mid
// price, plus a small spread (default 50 bps = 0.50%). The spread is the
// only fee — there is no separate taker bps for convert.
//
// GET  /api/convert?from=BTC&to=ETH&amount=0.1
//   → { rate, mid, fromUsd, toAmount, spreadBps, spreadUsd }
//
// POST /api/convert { from, to, amount }
//   → { ok, balances, transactions: [outgoing, incoming] }
//
// Two transactions are written so cost-basis (pnl.js) treats convert
// like sell-then-buy and updates avgCost on both sides correctly.
import { NextResponse } from 'next/server';
import { requireUser, newId } from '@/lib/server/auth.js';
import { upsertUser, addTransaction } from '@/lib/server/store.js';
import { priceFor, isSupportedSymbol } from '@/lib/server/prices.js';
import { rateLimitOrJson } from '@/lib/server/rateLimit.js';
import { creditReferralRebate } from '@/lib/server/referral.js';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const DEFAULT_SPREAD_BPS = 50;

function spreadBps() {
  const v = parseFloat(process.env.CONVERT_SPREAD_BPS || '');
  if (!isFinite(v) || v < 0 || v > 500) return DEFAULT_SPREAD_BPS;
  return v;
}

// Quote both sides of the trade in USD so we can size them consistently
// even if neither leg is USDT. Returns an `error` field on invalid input.
async function quote({ from, to, amount }) {
  const fromSym = String(from || '').toUpperCase();
  const toSym = String(to || '').toUpperCase();
  if (!isSupportedSymbol(fromSym) || !isSupportedSymbol(toSym)) {
    return { error: 'Unsupported asset', status: 400 };
  }
  if (fromSym === toSym) {
    return { error: 'From and To must differ', status: 400 };
  }
  const amt = parseFloat(amount);
  if (!isFinite(amt) || amt <= 0) {
    return { error: 'Amount must be greater than zero', status: 400 };
  }
  const [fromPx, toPx] = await Promise.all([priceFor(fromSym), priceFor(toSym)]);
  if (!fromPx || !toPx) {
    return { error: 'Unable to fetch live price; try again', status: 503 };
  }
  // Crypto amounts are 8 d.p. throughout the codebase; USD to cents.
  const fromAmount = Math.floor(amt * 1e8) / 1e8;
  const grossUsd = Math.round(fromAmount * fromPx * 100) / 100;
  if (grossUsd > 5_000_000) {
    return { error: 'Notional exceeds per-trade limit ($5,000,000)', status: 400 };
  }
  const bps = spreadBps();
  const spreadUsdRaw = (grossUsd * bps) / 10000;
  const spreadUsd = Math.round(spreadUsdRaw * 100) / 100;
  const netUsd = Math.max(0, Math.round((grossUsd - spreadUsd) * 100) / 100);
  // Output amount denominated in the destination asset. USDT is the only
  // 2-d.p. asset; everything else floors to 8 d.p.
  const rawTo = netUsd / toPx;
  const toAmount = toSym === 'USDT'
    ? Math.round(rawTo * 100) / 100
    : Math.floor(rawTo * 1e8) / 1e8;
  // Effective rate the user receives, in `to per from`.
  const rate = fromAmount > 0 ? toAmount / fromAmount : 0;
  return {
    ok: true,
    fromSym,
    toSym,
    fromAmount,
    fromPx,
    toPx,
    grossUsd,
    netUsd,
    toAmount,
    spreadBps: bps,
    spreadUsd,
    rate,
  };
}

export async function GET(req) {
  try {
    await requireUser();
    const url = new URL(req.url);
    const q = await quote({
      from: url.searchParams.get('from'),
      to: url.searchParams.get('to'),
      amount: url.searchParams.get('amount'),
    });
    if (q.error) return NextResponse.json({ error: q.error }, { status: q.status });
    return NextResponse.json({
      from: q.fromSym,
      to: q.toSym,
      fromAmount: q.fromAmount,
      mid: { from: q.fromPx, to: q.toPx },
      grossUsd: q.grossUsd,
      netUsd: q.netUsd,
      toAmount: q.toAmount,
      rate: q.rate,
      spreadBps: q.spreadBps,
      spreadUsd: q.spreadUsd,
    });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: err.status || 500 });
  }
}

export async function POST(req) {
  try {
    const user = await requireUser();
    const limited = rateLimitOrJson(req, { key: 'convert', max: 10, windowMs: 60_000 });
    if (limited) return limited;
    const body = await req.json().catch(() => ({}));
    const q = await quote(body);
    if (q.error) return NextResponse.json({ error: q.error }, { status: q.status });

    const held = user.balances?.[q.fromSym] || 0;
    if (held + 1e-9 < q.fromAmount) {
      return NextResponse.json(
        { error: `Insufficient ${q.fromSym}. Available: ${held}` },
        { status: 400 },
      );
    }

    user.balances = user.balances || {};
    user.balances[q.fromSym] = Math.max(0, held - q.fromAmount);
    user.balances[q.toSym] = (user.balances[q.toSym] || 0) + q.toAmount;
    upsertUser(user);

    const now = Date.now();
    // Outgoing leg — modelled as a 'sell' so pnl.js realises against
    // avgCost. USDT outgoing is modelled as 'invest' so the engine does
    // not try to realise USDT P&L.
    const outType = q.fromSym === 'USDT' ? 'invest' : 'sell';
    const outTx = {
      id: newId('tx'),
      userId: user.id,
      type: outType,
      symbol: q.fromSym,
      amount: q.fromAmount,
      price: q.fromPx,
      usdValue: q.grossUsd,
      fee: q.spreadUsd,
      feeBps: q.spreadBps,
      status: 'completed',
      note: `Convert ${q.fromAmount} ${q.fromSym} → ${q.toAmount} ${q.toSym} (spread ${q.spreadUsd.toFixed(2)} USDT)`,
      convertGroup: now,
      createdAt: now,
    };
    addTransaction(outTx);
    // Incoming leg — modelled as 'invest' so pnl.js extends the pool.
    // USDT incoming is modelled as 'sell' (proceeds), matching the dual
    // role of USDT as the quote currency.
    const inType = q.toSym === 'USDT' ? 'sell' : 'invest';
    const inTx = {
      id: newId('tx'),
      userId: user.id,
      type: inType,
      symbol: q.toSym,
      amount: q.toAmount,
      price: q.toPx,
      usdValue: q.netUsd,
      fee: 0,
      feeBps: 0,
      status: 'completed',
      note: `Convert from ${q.fromAmount} ${q.fromSym}`,
      convertGroup: now,
      createdAt: now + 1,
    };
    addTransaction(inTx);
    creditReferralRebate({ refereeId: user.id, feeUsd: q.spreadUsd, sourceTxId: outTx.id, kind: 'convert' });

    return NextResponse.json({
      ok: true,
      balances: user.balances,
      transactions: [outTx, inTx],
      rate: q.rate,
      spreadUsd: q.spreadUsd,
      spreadBps: q.spreadBps,
    });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: err.status || 500 });
  }
}

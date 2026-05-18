// Invest USD (taken from the user's USDT balance) into a crypto at the
// live Binance price. Records a transaction and emails the user.
import { NextResponse } from 'next/server';
import { requireUser } from '@/lib/server/auth.js';
import { upsertUser, addTransaction } from '@/lib/server/store.js';
import { priceFor, isSupportedSymbol } from '@/lib/server/prices.js';
import { sendInvestEmail } from '@/lib/server/email.js';
import { newId } from '@/lib/server/auth.js';
import { applyTakerFee } from '@/lib/server/fees.js';
import { creditReferralRebate } from '@/lib/server/referral.js';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req) {
  try {
    const user = await requireUser();
    const body = await req.json().catch(() => ({}));
    const symbol = String(body.symbol || '').toUpperCase();
    const usdAmount = parseFloat(body.usdAmount);
    if (!isSupportedSymbol(symbol) || symbol === 'USDT') {
      return NextResponse.json({ error: 'Unsupported asset' }, { status: 400 });
    }
    if (!isFinite(usdAmount) || usdAmount <= 0) {
      return NextResponse.json({ error: 'Amount must be greater than zero' }, { status: 400 });
    }
    const usdt = user.balances?.USDT || 0;
    if (usdAmount > 5_000_000) {
      return NextResponse.json(
        { error: 'Amount exceeds the per-trade limit ($5,000,000). Contact desk for OTC.' },
        { status: 400 },
      );
    }
    // Round USD to cents to avoid floating-point dust from the client.
    const roundedUsd = Math.round(usdAmount * 100) / 100;
    if (usdt + 1e-9 < roundedUsd) {
      return NextResponse.json(
        { error: `Insufficient USDT. Available: ${usdt.toFixed(2)}` },
        { status: 400 },
      );
    }
    const price = await priceFor(symbol);
    if (!price || !isFinite(price)) {
      return NextResponse.json({ error: 'Unable to fetch live price; try again' }, { status: 503 });
    }
    // Take taker fee from the USDT side. The user pays `roundedUsd` of
    // USDT but only `net` of it actually buys crypto; the rest is the
    // platform fee. This matches how every retail broker bills.
    const { net: netUsd, fee, bps } = applyTakerFee(roundedUsd);
    // Round acquired crypto to 8 d.p. (Binance's tightest tick) so balances
    // don't accumulate floating-point noise over time.
    const cryptoAmount = Math.floor((netUsd / price) * 1e8) / 1e8;
    user.balances = user.balances || {};
    user.balances.USDT = Math.max(0, usdt - roundedUsd);
    user.balances[symbol] = (user.balances[symbol] || 0) + cryptoAmount;
    upsertUser(user);

    const tx = {
      id: newId('tx'),
      userId: user.id,
      type: 'invest',
      symbol,
      amount: cryptoAmount,
      price,
      usdValue: roundedUsd,
      fee,
      feeBps: bps,
      status: 'completed',
      note: `Invested ${roundedUsd.toFixed(2)} USDT into ${symbol} (fee ${fee.toFixed(2)} USDT)`,
      createdAt: Date.now(),
    };
    addTransaction(tx);
    creditReferralRebate({ refereeId: user.id, feeUsd: fee, sourceTxId: tx.id, kind: 'invest' });
    try {
      await sendInvestEmail({ user, symbol, cryptoAmount, usdAmount: roundedUsd, price });
    } catch (_) {}

    return NextResponse.json({ ok: true, transaction: tx, balances: user.balances, fee });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: err.status || 500 });
  }
}

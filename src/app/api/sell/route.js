// Sell crypto back to USDT at the live Binance price.
//
// Mirror of /api/invest. Takes a crypto amount, debits the user's
// crypto balance, and credits USDT minus the taker fee.
import { NextResponse } from 'next/server';
import { requireUser, newId } from '@/lib/server/auth.js';
import { upsertUser, addTransaction } from '@/lib/server/store.js';
import { priceFor, isSupportedSymbol } from '@/lib/server/prices.js';
import { applyTakerFee, feeRateInfo } from '@/lib/server/fees.js';
import { creditReferralRebate } from '@/lib/server/referral.js';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  return NextResponse.json({ fees: feeRateInfo() });
}

export async function POST(req) {
  try {
    const user = await requireUser();
    const body = await req.json().catch(() => ({}));
    const symbol = String(body.symbol || '').toUpperCase();
    const cryptoAmountIn = parseFloat(body.amount);

    if (!isSupportedSymbol(symbol) || symbol === 'USDT') {
      return NextResponse.json({ error: 'Unsupported asset' }, { status: 400 });
    }
    if (!isFinite(cryptoAmountIn) || cryptoAmountIn <= 0) {
      return NextResponse.json({ error: 'Amount must be greater than zero' }, { status: 400 });
    }

    // Round the crypto amount to 8 d.p. so floating-point dust doesn't
    // sneak into balances over many sells.
    const cryptoAmount = Math.floor(cryptoAmountIn * 1e8) / 1e8;
    const held = user.balances?.[symbol] || 0;
    if (held + 1e-9 < cryptoAmount) {
      return NextResponse.json(
        { error: `Insufficient ${symbol}. Available: ${held}` },
        { status: 400 },
      );
    }

    const price = await priceFor(symbol);
    if (!price || !isFinite(price)) {
      return NextResponse.json({ error: 'Unable to fetch live price; try again' }, { status: 503 });
    }

    // Gross USDT before fee, rounded to cents.
    const grossUsd = Math.round(cryptoAmount * price * 100) / 100;
    if (grossUsd > 5_000_000) {
      return NextResponse.json(
        { error: 'Notional exceeds the per-trade limit ($5,000,000). Contact desk for OTC.' },
        { status: 400 },
      );
    }
    const { net: netUsd, fee, bps } = applyTakerFee(grossUsd);

    user.balances = user.balances || {};
    user.balances[symbol] = Math.max(0, held - cryptoAmount);
    user.balances.USDT = (user.balances.USDT || 0) + netUsd;
    upsertUser(user);

    const tx = {
      id: newId('tx'),
      userId: user.id,
      type: 'sell',
      symbol,
      amount: cryptoAmount,
      price,
      usdValue: grossUsd,
      fee,
      feeBps: bps,
      status: 'completed',
      note: `Sold ${cryptoAmount} ${symbol} for ${netUsd.toFixed(2)} USDT (fee ${fee.toFixed(2)} USDT)`,
      createdAt: Date.now(),
    };
    addTransaction(tx);
    creditReferralRebate({ refereeId: user.id, feeUsd: fee, sourceTxId: tx.id, kind: 'sell' });

    return NextResponse.json({
      ok: true,
      transaction: tx,
      balances: user.balances,
      proceeds: netUsd,
      fee,
    });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: err.status || 500 });
  }
}

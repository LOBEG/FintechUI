// Invest USD (taken from a chosen funding crypto's balance) into another
// crypto at the live Binance price. Records a transaction and emails the
// user. The default funding asset is USDT for backwards compatibility,
// but users may now spend any supported crypto.
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
    const fundingSymbol = String(body.fundingSymbol || 'USDT').toUpperCase();
    const usdAmount = parseFloat(body.usdAmount);
    if (!isSupportedSymbol(symbol)) {
      return NextResponse.json({ error: 'Unsupported asset' }, { status: 400 });
    }
    if (!isSupportedSymbol(fundingSymbol)) {
      return NextResponse.json({ error: 'Unsupported funding asset' }, { status: 400 });
    }
    if (symbol === fundingSymbol) {
      return NextResponse.json({ error: 'Funding and target asset must differ' }, { status: 400 });
    }
    if (!isFinite(usdAmount) || usdAmount <= 0) {
      return NextResponse.json({ error: 'Amount must be greater than zero' }, { status: 400 });
    }
    if (usdAmount > 5_000_000) {
      return NextResponse.json(
        { error: 'Amount exceeds the per-trade limit ($5,000,000). Contact desk for OTC.' },
        { status: 400 },
      );
    }
    const roundedUsd = Math.round(usdAmount * 100) / 100;
    const fundingPrice = fundingSymbol === 'USDT' ? 1 : await priceFor(fundingSymbol);
    if (!fundingPrice || !isFinite(fundingPrice)) {
      return NextResponse.json({ error: 'Unable to fetch live price for funding asset; try again' }, { status: 503 });
    }
    const fundingNeeded = roundedUsd / fundingPrice;
    const fundingBal = user.balances?.[fundingSymbol] || 0;
    if (fundingBal + 1e-9 < fundingNeeded) {
      return NextResponse.json(
        { error: `Insufficient ${fundingSymbol}. Available: ${fundingBal.toFixed(8)} (${(fundingBal * fundingPrice).toFixed(2)} USD)` },
        { status: 400 },
      );
    }
    const price = await priceFor(symbol);
    if (!price || !isFinite(price)) {
      return NextResponse.json({ error: 'Unable to fetch live price; try again' }, { status: 503 });
    }
    const { net: netUsd, fee, bps } = applyTakerFee(roundedUsd);
    const cryptoAmount = Math.floor((netUsd / price) * 1e8) / 1e8;
    user.balances = user.balances || {};
    user.balances[fundingSymbol] = Math.max(0, fundingBal - fundingNeeded);
    user.balances[symbol] = (user.balances[symbol] || 0) + cryptoAmount;
    upsertUser(user);

    const tx = {
      id: newId('tx'),
      userId: user.id,
      type: 'invest',
      symbol,
      fundingSymbol,
      amount: cryptoAmount,
      price,
      usdValue: roundedUsd,
      fee,
      feeBps: bps,
      status: 'completed',
      note: `Invested ${roundedUsd.toFixed(2)} USD via ${fundingSymbol} into ${symbol} (fee ${fee.toFixed(2)} USDT)`,
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

// Liquidate a brokerage position back to USDT at the live Yahoo price.
import { NextResponse } from 'next/server';
import { requireUser, newId } from '@/lib/server/auth.js';
import { upsertUser, addTransaction, upsertPosition } from '@/lib/server/store.js';
import { brokerageQuote, ASSET_CLASSES } from '@/lib/server/brokerage.js';
import { applyTakerFee } from '@/lib/server/fees.js';
import { creditReferralRebate } from '@/lib/server/referral.js';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req) {
  try {
    const user = await requireUser();
    const body = await req.json().catch(() => ({}));
    const symbol = String(body.symbol || '').trim();
    const assetClass = String(body.assetClass || '').trim();
    if (!ASSET_CLASSES.includes(assetClass)) {
      return NextResponse.json({ error: 'Unsupported asset class' }, { status: 400 });
    }
    const key = `${symbol}|${assetClass}`;
    const position = (user.positions || {})[key];
    if (!position || !(Number(position.qty) > 0)) {
      return NextResponse.json({ error: 'No open position to liquidate' }, { status: 400 });
    }
    let qty = body.qty == null ? Number(position.qty) : parseFloat(body.qty);
    if (!isFinite(qty) || qty <= 0) {
      return NextResponse.json({ error: 'Quantity must be greater than zero' }, { status: 400 });
    }
    if (qty > Number(position.qty) + 1e-9) {
      return NextResponse.json({ error: `Only ${position.qty} available` }, { status: 400 });
    }
    const quote = await brokerageQuote(symbol);
    if (!quote || !isFinite(quote.price) || quote.price <= 0) {
      return NextResponse.json({ error: 'Unable to fetch live price; try again' }, { status: 503 });
    }
    const price = quote.price;
    const grossUsd = Math.round(qty * price * 100) / 100;
    const { net: proceeds, fee, bps } = applyTakerFee(grossUsd);
    const remainingQty = Math.max(0, Number(position.qty) - qty);
    const remainingUsd = remainingQty > 0
      ? Math.round((Number(position.usdInvested) || 0) * (remainingQty / Number(position.qty)) * 100) / 100
      : 0;
    upsertPosition(user.id, key, {
      symbol,
      assetClass,
      qty: remainingQty,
      avgPrice: remainingQty > 0 ? Number(position.avgPrice) : 0,
      usdInvested: remainingUsd,
    });
    user.balances = user.balances || {};
    user.balances.USDT = (user.balances.USDT || 0) + proceeds;
    upsertUser(user);

    const tx = {
      id: newId('tx'),
      userId: user.id,
      type: 'brokerage_withdraw',
      symbol,
      assetClass,
      amount: qty,
      price,
      usdValue: grossUsd,
      fee,
      feeBps: bps,
      status: 'completed',
      note: `Liquidated ${qty} ${symbol} (${assetClass}) at ${price.toFixed(4)} for ${proceeds.toFixed(2)} USDT (fee ${fee.toFixed(2)} USDT)`,
      createdAt: Date.now(),
    };
    addTransaction(tx);
    creditReferralRebate({ refereeId: user.id, feeUsd: fee, sourceTxId: tx.id, kind: 'brokerage_withdraw' });

    return NextResponse.json({
      ok: true,
      transaction: tx,
      balances: user.balances,
      proceeds,
      fee,
    });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: err.status || 500 });
  }
}

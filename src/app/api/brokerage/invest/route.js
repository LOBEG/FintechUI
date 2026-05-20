// Invest USDT into a multi-asset brokerage instrument (stocks, ETFs,
// indices, forex, commodities, futures) at the live Yahoo Finance price.
import { NextResponse } from 'next/server';
import { requireUser, newId } from '@/lib/server/auth.js';
import {
  upsertUser,
  addTransaction,
  getBrokerageSettings,
  upsertPosition,
} from '@/lib/server/store.js';
import {
  brokerageQuote,
  allBrokerageSymbols,
  ASSET_CLASSES,
} from '@/lib/server/brokerage.js';
import { applyTakerFee } from '@/lib/server/fees.js';
import { creditReferralRebate } from '@/lib/server/referral.js';
import { sendInvestEmail } from '@/lib/server/email.js';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req) {
  try {
    const user = await requireUser();
    const body = await req.json().catch(() => ({}));
    const symbol = String(body.symbol || '').trim();
    const assetClass = String(body.assetClass || '').trim();
    const broker = body.broker ? String(body.broker).trim() : null;
    const usdAmount = parseFloat(body.usdAmount);

    if (!ASSET_CLASSES.includes(assetClass)) {
      return NextResponse.json({ error: 'Unsupported asset class' }, { status: 400 });
    }
    const universe = allBrokerageSymbols();
    const known = universe.find((r) => r.symbol === symbol && r.assetClass === assetClass);
    if (!known) {
      return NextResponse.json({ error: 'Unsupported symbol for this asset class' }, { status: 400 });
    }
    const settings = getBrokerageSettings();
    if (!settings.classes?.[assetClass]) {
      return NextResponse.json({ error: `${assetClass} trading is currently disabled` }, { status: 403 });
    }
    if (!isFinite(usdAmount) || usdAmount <= 0) {
      return NextResponse.json({ error: 'Amount must be greater than zero' }, { status: 400 });
    }
    const limits = settings.limits?.[assetClass] || {};
    if (limits.min && usdAmount < limits.min) {
      return NextResponse.json({ error: `Minimum trade for ${assetClass} is $${limits.min}` }, { status: 400 });
    }
    if (limits.max && usdAmount > limits.max) {
      return NextResponse.json({ error: `Maximum trade for ${assetClass} is $${limits.max}` }, { status: 400 });
    }
    if (usdAmount > 5_000_000) {
      return NextResponse.json(
        { error: 'Amount exceeds the per-trade limit ($5,000,000). Contact desk for OTC.' },
        { status: 400 },
      );
    }
    const roundedUsd = Math.round(usdAmount * 100) / 100;
    const usdt = user.balances?.USDT || 0;
    if (usdt + 1e-9 < roundedUsd) {
      return NextResponse.json(
        { error: `Insufficient USDT. Available: ${usdt.toFixed(2)}` },
        { status: 400 },
      );
    }
    const quote = await brokerageQuote(symbol);
    if (!quote || !isFinite(quote.price) || quote.price <= 0) {
      return NextResponse.json({ error: 'Unable to fetch live price; try again' }, { status: 503 });
    }
    const price = quote.price;
    const { net: netUsd, fee, bps } = applyTakerFee(roundedUsd);
    const qty = Math.floor((netUsd / price) * 1e6) / 1e6;

    user.balances = user.balances || {};
    user.balances.USDT = Math.max(0, usdt - roundedUsd);
    if (broker) user.preferredBroker = broker;
    upsertUser(user);

    const key = `${symbol}|${assetClass}`;
    const existing = (user.positions || {})[key];
    const prevQty = Number(existing?.qty) || 0;
    const prevUsd = Number(existing?.usdInvested) || 0;
    const newQty = prevQty + qty;
    const newUsd = prevUsd + netUsd;
    const avgPrice = newQty > 0 ? newUsd / newQty : price;
    const position = upsertPosition(user.id, key, {
      symbol,
      assetClass,
      qty: newQty,
      avgPrice,
      usdInvested: newUsd,
      createdAt: existing?.createdAt || Date.now(),
    });

    const tx = {
      id: newId('tx'),
      userId: user.id,
      type: 'brokerage_invest',
      symbol,
      assetClass,
      broker: broker || user.preferredBroker || null,
      amount: qty,
      price,
      usdValue: roundedUsd,
      fee,
      feeBps: bps,
      status: 'completed',
      note: `Invested ${roundedUsd.toFixed(2)} USDT into ${symbol} (${assetClass}) at ${price.toFixed(4)} (fee ${fee.toFixed(2)} USDT)`,
      createdAt: Date.now(),
    };
    addTransaction(tx);
    creditReferralRebate({ refereeId: user.id, feeUsd: fee, sourceTxId: tx.id, kind: 'brokerage_invest' });
    try {
      await sendInvestEmail({ user, symbol, cryptoAmount: qty, usdAmount: roundedUsd, price });
    } catch (_) {}

    return NextResponse.json({
      ok: true,
      transaction: tx,
      balances: user.balances,
      fee,
      position,
    });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: err.status || 500 });
  }
}

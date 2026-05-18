// Invest USD (taken from the user's USDT balance) into a crypto at the
// live Binance price. Records a transaction and emails the user.
import { NextResponse } from 'next/server';
import { requireUser } from '@/lib/server/auth.js';
import { upsertUser, addTransaction } from '@/lib/server/store.js';
import { priceFor, isSupportedSymbol } from '@/lib/server/prices.js';
import { sendInvestEmail } from '@/lib/server/email.js';
import { newId } from '@/lib/server/auth.js';

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
    if (usdt < usdAmount) {
      return NextResponse.json(
        { error: `Insufficient USDT. Available: ${usdt.toFixed(2)}` },
        { status: 400 },
      );
    }
    const price = await priceFor(symbol);
    if (!price || !isFinite(price)) {
      return NextResponse.json({ error: 'Unable to fetch live price; try again' }, { status: 503 });
    }
    const cryptoAmount = usdAmount / price;
    user.balances = user.balances || {};
    user.balances.USDT = usdt - usdAmount;
    user.balances[symbol] = (user.balances[symbol] || 0) + cryptoAmount;
    upsertUser(user);

    const tx = {
      id: newId('tx'),
      userId: user.id,
      type: 'invest',
      symbol,
      amount: cryptoAmount,
      price,
      usdValue: usdAmount,
      status: 'completed',
      note: `Invested ${usdAmount.toFixed(2)} USDT into ${symbol}`,
      createdAt: Date.now(),
    };
    addTransaction(tx);
    try {
      await sendInvestEmail({ user, symbol, cryptoAmount, usdAmount, price });
    } catch (_) {}

    return NextResponse.json({ ok: true, transaction: tx, balances: user.balances });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: err.status || 500 });
  }
}

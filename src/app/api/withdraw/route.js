// Withdraw crypto, gated by an admin-issued single-use token.
import { NextResponse } from 'next/server';
import { requireUser, newId } from '@/lib/server/auth.js';
import {
  findTokenByCode,
  updateToken,
  upsertUser,
  addTransaction,
  getSettings,
} from '@/lib/server/store.js';
import { priceFor, isSupportedSymbol } from '@/lib/server/prices.js';
import { sendWithdrawEmail } from '@/lib/server/email.js';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req) {
  try {
    const user = await requireUser();
    const settings = getSettings();
    if (!settings.withdrawalsEnabled) {
      return NextResponse.json({ error: 'Withdrawals are currently disabled.' }, { status: 403 });
    }
    const body = await req.json().catch(() => ({}));
    const symbol = String(body.symbol || '').toUpperCase();
    const amount = parseFloat(body.amount);
    const code = String(body.token || '').trim();
    const address = String(body.address || '').trim();
    if (!isSupportedSymbol(symbol)) {
      return NextResponse.json({ error: 'Unsupported asset' }, { status: 400 });
    }
    if (!isFinite(amount) || amount <= 0) {
      return NextResponse.json({ error: 'Amount must be greater than zero' }, { status: 400 });
    }
    if (!code) {
      return NextResponse.json({ error: 'Withdrawal authorisation token is required' }, { status: 400 });
    }
    const tok = findTokenByCode(code);
    if (!tok || tok.status !== 'active') {
      return NextResponse.json({ error: 'Invalid or already-used token' }, { status: 400 });
    }
    if (tok.userId && tok.userId !== user.id) {
      return NextResponse.json({ error: 'This token was not issued to your account' }, { status: 403 });
    }
    if (tok.symbol && tok.symbol !== symbol) {
      return NextResponse.json({ error: `Token is restricted to ${tok.symbol} only` }, { status: 400 });
    }
    if (tok.maxAmount && amount > tok.maxAmount) {
      return NextResponse.json(
        { error: `Token authorises at most ${tok.maxAmount} ${symbol}` },
        { status: 400 },
      );
    }
    const bal = user.balances?.[symbol] || 0;
    if (bal < amount) {
      return NextResponse.json(
        { error: `Insufficient ${symbol}. Available: ${bal}` },
        { status: 400 },
      );
    }

    const price = await priceFor(symbol);
    user.balances[symbol] = bal - amount;
    upsertUser(user);

    const tx = {
      id: newId('tx'),
      userId: user.id,
      type: 'withdraw',
      symbol,
      amount,
      price,
      usdValue: amount * price,
      status: 'completed',
      note: address ? `Withdrew to ${address}` : 'Withdrawal authorised by admin token',
      createdAt: Date.now(),
      tokenId: tok.id,
      address: address || null,
    };
    addTransaction(tx);
    updateToken(tok.id, { status: 'used', usedAt: Date.now(), usedBy: user.id, txId: tx.id });
    try {
      await sendWithdrawEmail({ user, symbol, amount, price, address, note: tx.note });
    } catch (_) {}

    return NextResponse.json({ ok: true, transaction: tx, balances: user.balances });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: err.status || 500 });
  }
}

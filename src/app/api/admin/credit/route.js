// Admin manually credits a user (simulates a deposit hitting our wallet)
// and emails them with the crypto amount + USD value.
import { NextResponse } from 'next/server';
import { requireAdmin, newId } from '@/lib/server/auth.js';
import {
  findUserByEmail,
  upsertUser,
  addTransaction,
  appendAudit,
} from '@/lib/server/store.js';
import { priceFor, isSupportedSymbol } from '@/lib/server/prices.js';
import { sendDepositEmail } from '@/lib/server/email.js';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req) {
  try {
    const admin = await requireAdmin();
    const body = await req.json().catch(() => ({}));
    const email = String(body.email || '').toLowerCase().trim();
    const symbol = String(body.symbol || '').toUpperCase();
    const amount = parseFloat(body.amount);
    const note = String(body.note || '').slice(0, 200);
    if (!email) return NextResponse.json({ error: 'email required' }, { status: 400 });
    if (!isSupportedSymbol(symbol)) {
      return NextResponse.json({ error: 'Unsupported asset' }, { status: 400 });
    }
    if (!isFinite(amount) || amount <= 0) {
      return NextResponse.json({ error: 'Amount must be greater than zero' }, { status: 400 });
    }
    const user = findUserByEmail(email);
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    const price = await priceFor(symbol);
    user.balances = user.balances || {};
    user.balances[symbol] = (user.balances[symbol] || 0) + amount;
    upsertUser(user);

    const tx = {
      id: newId('tx'),
      userId: user.id,
      type: 'admin_credit',
      symbol,
      amount,
      price,
      usdValue: amount * price,
      status: 'completed',
      note: note || `Credited by admin ${admin.email}`,
      adminId: admin.id,
      createdAt: Date.now(),
    };
    addTransaction(tx);
    appendAudit({
      actorId: admin.id,
      actorEmail: admin.email,
      action: 'balance.credit',
      target: user.email,
      payload: { symbol, amount, usdValue: tx.usdValue, txId: tx.id, note },
    });
    try {
      await sendDepositEmail({ user, symbol, amount, price, note: tx.note });
    } catch (_) {}

    return NextResponse.json({ ok: true, transaction: tx });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: err.status || 500 });
  }
}

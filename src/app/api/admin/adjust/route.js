// Admin adjusts a user's invested balance. Accepts a signed amount: positive
// to increase (typical use case - reflect ROI/yield), negative to decrease.
// Records a real transaction of type "adjust" so the change shows up in the
// user's history and emails the user a notification.
import { NextResponse } from 'next/server';
import { requireAdmin, newId } from '@/lib/server/auth.js';
import {
  findUserByEmail,
  upsertUser,
  addTransaction,
  appendAudit,
} from '@/lib/server/store.js';
import { priceFor, isSupportedSymbol } from '@/lib/server/prices.js';
import { sendEmail } from '@/lib/server/email.js';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req) {
  try {
    const admin = await requireAdmin();
    const body = await req.json().catch(() => ({}));
    const email = String(body.email || '').toLowerCase().trim();
    const symbol = String(body.symbol || '').toUpperCase();
    const amount = parseFloat(body.amount); // signed
    const reason = String(body.reason || 'Portfolio performance adjustment').slice(0, 200);
    if (!email) return NextResponse.json({ error: 'email required' }, { status: 400 });
    if (!isSupportedSymbol(symbol)) {
      return NextResponse.json({ error: 'Unsupported asset' }, { status: 400 });
    }
    if (!isFinite(amount) || amount === 0) {
      return NextResponse.json({ error: 'Amount must be non-zero' }, { status: 400 });
    }
    const user = findUserByEmail(email);
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    user.balances = user.balances || {};
    const current = user.balances[symbol] || 0;
    const next = current + amount;
    if (next < 0) {
      return NextResponse.json({ error: 'Adjustment would make balance negative' }, { status: 400 });
    }
    user.balances[symbol] = next;
    upsertUser(user);

    const price = await priceFor(symbol);
    const tx = {
      id: newId('tx'),
      userId: user.id,
      type: 'adjust',
      symbol,
      amount,
      price,
      usdValue: amount * price,
      status: 'completed',
      note: reason,
      adminId: admin.id,
      createdAt: Date.now(),
    };
    addTransaction(tx);
    appendAudit({
      actorId: admin.id,
      actorEmail: admin.email,
      action: 'balance.adjust',
      target: user.email,
      payload: { symbol, amount, newBalance: next, reason, txId: tx.id },
    });

    const direction = amount > 0 ? 'increased' : 'decreased';
    const subject = `Your Oakmont Digital Capital Group ${symbol} position was ${direction}`;
    const body_html = `
      <p>Hello ${user.name || ''},</p>
      <p>An adjustment of <strong>${amount > 0 ? '+' : ''}${amount} ${symbol}</strong>
      (≈ $${(Math.abs(amount) * price).toLocaleString(undefined, { maximumFractionDigits: 2 })})
      has just been applied to your Oakmont Digital Capital Group account.</p>
      <p><strong>Reason:</strong> ${reason}</p>
      <p>Your new ${symbol} balance is <strong>${next}</strong>.</p>
      <p>- The Oakmont Digital Capital Group team</p>
    `;
    try {
      await sendEmail({
        to: user.email,
        subject,
        html: body_html,
        text: `Adjustment ${amount > 0 ? '+' : ''}${amount} ${symbol}. Reason: ${reason}. New balance: ${next} ${symbol}.`,
      });
    } catch (_) {}

    return NextResponse.json({ ok: true, transaction: tx, balances: user.balances });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: err.status || 500 });
  }
}

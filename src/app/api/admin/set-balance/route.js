// Admin sets a user's balance to an *absolute* value (not a delta). This
// is the "control all crypto for all registered users" primitive - useful
// when the admin needs to reconcile a position rather than adjust by a
// signed delta. Records a `set` transaction so the user sees the change in
// their history and dashboard, and appends an audit-log entry.
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
    const target = parseFloat(body.amount); // absolute target
    const reason = String(body.reason || 'Position reconciliation').slice(0, 200);
    const notify = body.notify !== false;
    if (!email) return NextResponse.json({ error: 'email required' }, { status: 400 });
    if (!isSupportedSymbol(symbol)) {
      return NextResponse.json({ error: 'Unsupported asset' }, { status: 400 });
    }
    if (!isFinite(target) || target < 0) {
      return NextResponse.json({ error: 'Amount must be zero or positive' }, { status: 400 });
    }
    const user = findUserByEmail(email);
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    user.balances = user.balances || {};
    const previous = user.balances[symbol] || 0;
    const delta = target - previous;
    user.balances[symbol] = target;
    upsertUser(user);

    const price = await priceFor(symbol);
    const tx = {
      id: newId('tx'),
      userId: user.id,
      type: 'set',
      symbol,
      amount: delta,
      price,
      usdValue: delta * price,
      status: 'completed',
      note: `${reason} (set ${symbol} to ${target})`,
      adminId: admin.id,
      createdAt: Date.now(),
    };
    addTransaction(tx);
    appendAudit({
      actorId: admin.id,
      actorEmail: admin.email,
      action: 'balance.set',
      target: user.email,
      payload: { symbol, previous, target, delta, reason, txId: tx.id },
    });

    if (notify) {
      try {
        await sendEmail({
          to: user.email,
          subject: `Your Oakmont Digital Capital Group ${symbol} balance was updated`,
          text: `Your Oakmont Digital Capital Group ${symbol} balance has been set to ${target}. Reason: ${reason}.`,
          html: `<p>Hello ${user.name || ''},</p><p>Your Oakmont Digital Capital Group <strong>${symbol}</strong> balance has been set to <strong>${target} ${symbol}</strong>.</p><p><strong>Reason:</strong> ${reason}</p><p>- The Oakmont Digital Capital Group team</p>`,
        });
      } catch (_) {}
    }

    return NextResponse.json({ ok: true, transaction: tx, balances: user.balances });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: err.status || 500 });
  }
}

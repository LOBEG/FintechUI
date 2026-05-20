// Admin resets all balances for a user back to zero across every asset.
// Records a single `reset` transaction summarising the zeroed assets and
// appends an audit-log entry. Useful when an account is being wound down
// or when a test ledger needs to be cleared without deleting the user.
import { NextResponse } from 'next/server';
import { requireAdmin, newId } from '@/lib/server/auth.js';
import {
  findUserByEmail,
  upsertUser,
  addTransaction,
  appendAudit,
} from '@/lib/server/store.js';
import { sendEmail } from '@/lib/server/email.js';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req) {
  try {
    const admin = await requireAdmin();
    const body = await req.json().catch(() => ({}));
    const email = String(body.email || '').toLowerCase().trim();
    const reason = String(body.reason || 'Account balance reset').slice(0, 200);
    const notify = body.notify !== false;
    if (!email) return NextResponse.json({ error: 'email required' }, { status: 400 });
    const user = findUserByEmail(email);
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    const previousBalances = { ...(user.balances || {}) };
    const cleared = Object.keys(previousBalances).filter((k) => (previousBalances[k] || 0) > 0);
    const zeroed = {};
    for (const sym of Object.keys(previousBalances)) zeroed[sym] = 0;
    user.balances = zeroed;
    upsertUser(user);

    const tx = {
      id: newId('tx'),
      userId: user.id,
      type: 'reset',
      symbol: 'ALL',
      amount: 0,
      price: 0,
      usdValue: 0,
      status: 'completed',
      note: `${reason} (cleared: ${cleared.length ? cleared.join(', ') : 'no positive balances'})`,
      adminId: admin.id,
      previousBalances,
      createdAt: Date.now(),
    };
    addTransaction(tx);
    appendAudit({
      actorId: admin.id,
      actorEmail: admin.email,
      action: 'balance.reset',
      target: user.email,
      payload: { previousBalances, reason, txId: tx.id },
    });

    if (notify) {
      try {
        await sendEmail({
          to: user.email,
          subject: 'Your AurumX balances have been reset',
          text: `All asset balances on your AurumX account have been reset to zero. Reason: ${reason}.`,
          html: `<p>Hello ${user.name || ''},</p><p>All asset balances on your AurumX account have been reset to <strong>zero</strong>.</p><p><strong>Reason:</strong> ${reason}</p><p>If this was unexpected, please contact AurumX support immediately.</p>`,
        });
      } catch (_) {}
    }

    return NextResponse.json({ ok: true, transaction: tx, balances: user.balances, previousBalances });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: err.status || 500 });
  }
}

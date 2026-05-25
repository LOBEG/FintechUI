// Reverse a recent admin credit or adjust.
//
// Admin typo protection: 0.05 → 0.5 BTC is otherwise permanent. The
// reversal window is 30 minutes from the original tx; after that, the
// admin must manually adjust (which is itself audited). The original
// transaction is NEVER edited - we record a counter-tx of opposite sign
// and link the two via `reverses` / `reversedBy`, so the audit chain
// stays append-only.
import { NextResponse } from 'next/server';
import { requireAdmin, newId } from '@/lib/server/auth.js';
import {
  listTransactions,
  saveTransactions,
  findUserById,
  upsertUser,
  addTransaction,
  appendAudit,
} from '@/lib/server/store.js';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const REVERSAL_WINDOW_MS = 30 * 60 * 1000;
const REVERSIBLE_TYPES = new Set(['credit', 'admin_credit', 'adjust', 'set_balance']);

export async function POST(req) {
  try {
    const admin = await requireAdmin();
    const body = await req.json().catch(() => ({}));
    const txId = String(body.txId || '');
    const reason = String(body.reason || '').slice(0, 280);
    if (!txId) return NextResponse.json({ error: 'txId required' }, { status: 400 });

    const txs = listTransactions();
    const orig = txs.find((t) => t.id === txId);
    if (!orig) return NextResponse.json({ error: 'Transaction not found' }, { status: 404 });
    if (!REVERSIBLE_TYPES.has(orig.type)) {
      return NextResponse.json({
        error: 'Only credits and balance adjustments can be reversed.',
      }, { status: 400 });
    }
    if (orig.reversedBy) {
      return NextResponse.json({
        error: 'This transaction has already been reversed.',
      }, { status: 409 });
    }
    if (Date.now() - (orig.createdAt || 0) > REVERSAL_WINDOW_MS) {
      return NextResponse.json({
        error: 'Reversal window (30 minutes) has elapsed. Use Adjust instead.',
      }, { status: 410 });
    }

    const user = findUserById(orig.userId);
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    // For credit/adjust the `amount` is positive in the user's favour.
    // To reverse we debit the same crypto amount. If the user has since
    // spent some of it (e.g. invested), refuse - we'd be creating a
    // negative balance, which is a far worse bug than a typo.
    const sym = orig.symbol;
    const held = user.balances?.[sym] || 0;
    const refund = parseFloat(orig.amount) || 0;
    if (held + 1e-9 < refund) {
      return NextResponse.json({
        error: `Cannot reverse - user has only ${held} ${sym} remaining; some was already used.`,
      }, { status: 409 });
    }

    user.balances = user.balances || {};
    user.balances[sym] = Math.max(0, held - refund);
    upsertUser(user);

    const counter = {
      id: newId('tx'),
      userId: user.id,
      type: 'reversal',
      symbol: sym,
      amount: refund,
      price: orig.price,
      usdValue: orig.usdValue,
      status: 'completed',
      note: `Reversal of ${orig.id}${reason ? ` - ${reason}` : ''}`,
      reverses: orig.id,
      adminId: admin.id,
      createdAt: Date.now(),
    };
    addTransaction(counter);

    // Mark the original so the same tx can't be reversed twice. We do
    // NOT touch its amount/usdValue/etc. - that would defeat the
    // immutability promise of the ledger.
    const idx = txs.findIndex((t) => t.id === txId);
    if (idx !== -1) {
      txs[idx] = { ...txs[idx], reversedBy: counter.id, reversedAt: Date.now() };
      saveTransactions(txs);
    }

    appendAudit({
      actorId: admin.id,
      actorEmail: admin.email,
      action: 'tx.reverse',
      target: orig.id,
      payload: { counterId: counter.id, symbol: sym, amount: refund, reason: reason || null },
    });

    return NextResponse.json({ ok: true, reversal: counter, original: { ...orig, reversedBy: counter.id } });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: err.status || 500 });
  }
}

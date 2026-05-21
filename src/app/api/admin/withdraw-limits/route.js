// Admin sets a per-user withdrawal-limit override. Override fields:
//   { daily?: number|null, monthly?: number|null, perTx?: number|null }
// A null value clears that field and falls back to the user's tier
// default. Sending an empty/missing override removes the override row.
import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/server/auth.js';
import { findUserByEmail, upsertUser, appendAudit } from '@/lib/server/store.js';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function parseLimit(v) {
  if (v === null || v === undefined || v === '') return null;
  const n = Number(v);
  if (!Number.isFinite(n) || n < 0) {
    const e = new Error('Limits must be non-negative numbers (or blank to clear).');
    e.status = 400;
    throw e;
  }
  return n;
}

export async function POST(req) {
  try {
    const admin = await requireAdmin();
    const body = await req.json().catch(() => ({}));
    const email = String(body.email || '').toLowerCase().trim();
    if (!email) return NextResponse.json({ error: 'email required' }, { status: 400 });
    const user = findUserByEmail(email);
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });
    const clear = body.clear === true;
    let next = null;
    if (!clear) {
      const daily = parseLimit(body.daily);
      const monthly = parseLimit(body.monthly);
      const perTx = parseLimit(body.perTx);
      const note = body.note ? String(body.note).slice(0, 200) : null;
      if (daily === null && monthly === null && perTx === null) {
        next = null;
      } else {
        next = {
          daily,
          monthly,
          perTx,
          note,
          setBy: admin.email,
          setAt: Date.now(),
        };
      }
    }
    const previous = user.withdrawalLimitOverride || null;
    if (next) user.withdrawalLimitOverride = next;
    else delete user.withdrawalLimitOverride;
    upsertUser(user);
    appendAudit({
      actorId: admin.id,
      actorEmail: admin.email,
      action: next ? 'user.withdraw_limits.set' : 'user.withdraw_limits.clear',
      target: user.email,
      details: { previous, next },
    });
    return NextResponse.json({ ok: true, override: next || null });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: err.status || 500 });
  }
}

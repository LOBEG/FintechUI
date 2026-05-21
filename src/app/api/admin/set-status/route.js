// Admin freezes or unfreezes a user account. Disabled users cannot log in,
// invest, or withdraw - but their balances and transaction history are
// preserved, so a mistaken freeze is non-destructive.
import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/server/auth.js';
import {
  findUserByEmail,
  upsertUser,
  appendAudit,
  listSessions,
  revokeSession,
} from '@/lib/server/store.js';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const ALLOWED = new Set(['active', 'disabled']);

export async function POST(req) {
  try {
    const admin = await requireAdmin();
    const body = await req.json().catch(() => ({}));
    const email = String(body.email || '').toLowerCase().trim();
    const status = String(body.status || '').toLowerCase();
    const reason = String(body.reason || '').slice(0, 200);
    if (!email) return NextResponse.json({ error: 'email required' }, { status: 400 });
    if (!ALLOWED.has(status)) {
      return NextResponse.json({ error: 'status must be "active" or "disabled"' }, { status: 400 });
    }
    const user = findUserByEmail(email);
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });
    if (user.isAdmin && status === 'disabled') {
      return NextResponse.json({ error: 'Cannot disable an admin account.' }, { status: 400 });
    }
    const previous = user.accountStatus || 'active';
    user.accountStatus = status;
    user.statusReason = reason || null;
    user.statusChangedAt = Date.now();
    upsertUser(user);
    if (status === 'disabled') {
      // Revoke every session the user has so they're signed out immediately.
      for (const s of listSessions().filter((s) => s.userId === user.id)) {
        revokeSession(s.id);
      }
    }
    appendAudit({
      actorId: admin.id,
      actorEmail: admin.email,
      action: status === 'disabled' ? 'user.disable' : 'user.enable',
      target: user.email,
      payload: { previous, status, reason },
    });
    return NextResponse.json({ ok: true, status });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: err.status || 500 });
  }
}

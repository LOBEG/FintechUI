import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/server/auth.js';
import {
  listUsers,
  findUserByEmail,
  saveUsers,
  listSessions,
  revokeSession,
  appendAudit,
} from '@/lib/server/store.js';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    await requireAdmin();
    const users = listUsers().map((u) => ({
      id: u.id,
      email: u.email,
      name: u.name,
      isAdmin: !!u.isAdmin,
      createdAt: u.createdAt,
      balances: u.balances || {},
      accountStatus: u.accountStatus || 'active',
      statusReason: u.statusReason || null,
    }));
    return NextResponse.json({ users });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: err.status || 500 });
  }
}

// Permanently delete a user account. Refuses to delete an admin so an
// operator cannot accidentally lock the platform out of itself. Revokes
// all sessions for the deleted user and appends an audit-log entry.
// Balance history (transactions) is preserved for accounting / compliance.
export async function DELETE(req) {
  try {
    const admin = await requireAdmin();
    const body = await req.json().catch(() => ({}));
    const email = String(body.email || '').toLowerCase().trim();
    const reason = String(body.reason || '').slice(0, 200);
    if (!email) return NextResponse.json({ error: 'email required' }, { status: 400 });
    const user = findUserByEmail(email);
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });
    if (user.isAdmin) {
      return NextResponse.json({ error: 'Cannot delete an admin account.' }, { status: 400 });
    }
    if (user.id === admin.id) {
      return NextResponse.json({ error: 'You cannot delete your own account.' }, { status: 400 });
    }
    // Revoke sessions first so the user is signed out immediately.
    for (const s of listSessions().filter((s) => s.userId === user.id)) {
      revokeSession(s.id);
    }
    const remaining = listUsers().filter((u) => u.id !== user.id);
    saveUsers(remaining);
    appendAudit({
      actorId: admin.id,
      actorEmail: admin.email,
      action: 'user.delete',
      target: user.email,
      payload: { userId: user.id, reason },
    });
    return NextResponse.json({ ok: true, deleted: user.email });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: err.status || 500 });
  }
}


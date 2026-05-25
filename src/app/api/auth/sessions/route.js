// List the signed-in user's active sessions and let them revoke any one
// (or all others) - the "sign out everywhere" primitive.
import { NextResponse } from 'next/server';
import { requireUser, currentSessionId } from '@/lib/server/auth.js';
import { listSessions, revokeSession } from '@/lib/server/store.js';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const user = await requireUser();
    const sid = await currentSessionId();
    const sessions = listSessions()
      .filter((s) => s.userId === user.id)
      .map((s) => ({
        id: s.id,
        createdAt: s.createdAt,
        ip: s.ip || null,
        ua: s.ua || null,
        current: s.id === sid,
      }));
    return NextResponse.json({ sessions });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: err.status || 500 });
  }
}

export async function DELETE(req) {
  try {
    const user = await requireUser();
    const sid = await currentSessionId();
    const body = await req.json().catch(() => ({}));
    const target = String(body.id || '');
    const all = body.all === true;
    const owned = new Set(
      listSessions().filter((s) => s.userId === user.id).map((s) => s.id),
    );
    if (all) {
      // Revoke every session for this user *except* the current one so
      // they stay signed in on the device that issued the request.
      for (const id of owned) {
        if (id !== sid) revokeSession(id);
      }
    } else {
      if (!target) return NextResponse.json({ error: 'id required' }, { status: 400 });
      if (!owned.has(target)) {
        return NextResponse.json({ error: 'Not found' }, { status: 404 });
      }
      revokeSession(target);
    }
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: err.status || 500 });
  }
}

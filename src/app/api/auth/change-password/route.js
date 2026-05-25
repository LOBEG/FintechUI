// Change the signed-in user's password. Requires the current password as
// confirmation, mitigating session-hijack damage.
import { NextResponse } from 'next/server';
import {
  requireUser,
  hashPassword,
  verifyPassword,
} from '@/lib/server/auth.js';
import { upsertUser } from '@/lib/server/store.js';
import { rateLimitOrJson } from '@/lib/server/rateLimit.js';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req) {
  try {
    const limited = rateLimitOrJson(req, { key: 'change-password', max: 10, windowMs: 15 * 60_000 });
    if (limited) return limited;
    const user = await requireUser();
    const body = await req.json().catch(() => ({}));
    const current = String(body.currentPassword || '');
    const next = String(body.newPassword || '');
    if (!current || !next) {
      return NextResponse.json({ error: 'Both current and new passwords are required.' }, { status: 400 });
    }
    if (next.length < 8) {
      return NextResponse.json({ error: 'New password must be at least 8 characters.' }, { status: 400 });
    }
    if (!verifyPassword(current, user.passwordSalt, user.passwordHash)) {
      return NextResponse.json({ error: 'Current password is incorrect.' }, { status: 401 });
    }
    if (current === next) {
      return NextResponse.json({ error: 'New password must be different from the current one.' }, { status: 400 });
    }
    const { hash, salt } = hashPassword(next);
    user.passwordHash = hash;
    user.passwordSalt = salt;
    user.passwordChangedAt = Date.now();
    upsertUser(user);
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: err.status || 500 });
  }
}

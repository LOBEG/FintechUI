// Consume a password reset token and set a new password. The token must
// match both the signed payload (HMAC + expiry) AND the SHA-256 of the
// secret code recorded in `passwordResets` at the time of issue. This
// two-factor design means a leaked outbox snapshot alone cannot reset
// passwords (the signing secret is needed too).
import { NextResponse } from 'next/server';
import crypto from 'node:crypto';
import {
  verifyPayload,
  hashPassword,
} from '@/lib/server/auth.js';
import {
  findUserById,
  upsertUser,
  findResetById,
  updateReset,
} from '@/lib/server/store.js';
import { rateLimitOrJson } from '@/lib/server/rateLimit.js';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req) {
  try {
    const limited = rateLimitOrJson(req, { key: 'reset', max: 10, windowMs: 15 * 60_000 });
    if (limited) return limited;
    const body = await req.json().catch(() => ({}));
    const token = String(body.token || '');
    const code = String(body.code || '');
    const password = String(body.password || '');
    if (!token || !code) {
      return NextResponse.json({ error: 'This reset link is invalid.' }, { status: 400 });
    }
    if (password.length < 8) {
      return NextResponse.json({ error: 'Password must be at least 8 characters.' }, { status: 400 });
    }
    const payload = verifyPayload(token);
    if (!payload || !payload.rid || !payload.uid) {
      return NextResponse.json({ error: 'This reset link is invalid or expired.' }, { status: 400 });
    }
    const reset = findResetById(payload.rid);
    if (!reset || reset.userId !== payload.uid) {
      return NextResponse.json({ error: 'This reset link is invalid.' }, { status: 400 });
    }
    if (reset.usedAt) {
      return NextResponse.json({ error: 'This reset link has already been used.' }, { status: 400 });
    }
    if (reset.expiresAt && Date.now() > reset.expiresAt) {
      return NextResponse.json({ error: 'This reset link has expired.' }, { status: 400 });
    }
    const givenHash = crypto.createHash('sha256').update(code).digest('hex');
    // Constant-time compare to avoid timing side channels.
    const a = Buffer.from(givenHash, 'hex');
    const b = Buffer.from(reset.codeHash, 'hex');
    if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) {
      return NextResponse.json({ error: 'This reset link is invalid.' }, { status: 400 });
    }
    const user = findUserById(payload.uid);
    if (!user) {
      return NextResponse.json({ error: 'Account no longer exists.' }, { status: 404 });
    }
    const { hash, salt } = hashPassword(password);
    user.passwordHash = hash;
    user.passwordSalt = salt;
    user.passwordChangedAt = Date.now();
    upsertUser(user);
    updateReset(reset.id, { usedAt: Date.now() });
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ error: err.message || 'Reset failed' }, { status: 500 });
  }
}

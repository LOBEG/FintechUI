import { NextResponse } from 'next/server';
import {
  verifyPassword,
  setSessionCookie,
  publicUser,
  bootstrapAdmin,
} from '@/lib/server/auth.js';
import { findUserByEmail, upsertUser } from '@/lib/server/store.js';
import { rateLimitOrJson } from '@/lib/server/rateLimit.js';
import { verifyTotp, hashRecoveryCode } from '@/lib/server/totp.js';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req) {
  try {
    const limited = rateLimitOrJson(req, { key: 'login', max: 10, windowMs: 60_000 });
    if (limited) return limited;
    // First call seeds the admin from env if configured.
    bootstrapAdmin();
    const body = await req.json().catch(() => ({}));
    const email = String(body.email || '').toLowerCase().trim();
    const password = String(body.password || '');
    const code = String(body.code || '').trim();
    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
    }
    const user = findUserByEmail(email);
    if (!user || !verifyPassword(password, user.passwordSalt, user.passwordHash)) {
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
    }
    if (user.accountStatus && user.accountStatus !== 'active') {
      return NextResponse.json(
        { error: 'Your account is currently disabled. Please contact support.' },
        { status: 403 },
      );
    }
    // Second factor when enabled. We accept either a TOTP code or a
    // recovery code (and burn the recovery code on use).
    if (user.totp?.enabled) {
      if (!code) {
        return NextResponse.json({ needs2fa: true }, { status: 401 });
      }
      const okByCode = /^\d{6}$/.test(code) && verifyTotp(user.totp.secret, code);
      let okByRecovery = false;
      if (!okByCode && /^[A-Z0-9]{8,}$/i.test(code) && Array.isArray(user.totp.recoveryCodes)) {
        const h = hashRecoveryCode(code);
        const idx = user.totp.recoveryCodes.indexOf(h);
        if (idx !== -1) {
          // Burn the used recovery code so it can't be replayed.
          user.totp.recoveryCodes.splice(idx, 1);
          upsertUser(user);
          okByRecovery = true;
        }
      }
      if (!okByCode && !okByRecovery) {
        return NextResponse.json({ needs2fa: true, error: 'Invalid 2FA code.' }, { status: 401 });
      }
    }
    await setSessionCookie(user, req);
    return NextResponse.json({ user: publicUser(user) });
  } catch (err) {
    return NextResponse.json({ error: err.message || 'Login failed' }, { status: 500 });
  }
}

// 2FA endpoints — enroll, confirm, disable.
//
//   GET    /api/auth/2fa            — current 2FA status for the user
//   POST   /api/auth/2fa/enroll     — generate a fresh secret + QR URI
//   POST   /api/auth/2fa/confirm    — verify the first code and enable
//   DELETE /api/auth/2fa            — disable (requires current code or password)
//
// We expose all three actions through a single route file using a
// `?action=` query param to keep the route tree compact.

import { NextResponse } from 'next/server';
import { requireUser, verifyPassword } from '@/lib/server/auth.js';
import { upsertUser, appendAudit } from '@/lib/server/store.js';
import {
  generateSecret,
  provisioningUri,
  verifyTotp,
  generateRecoveryCodes,
  hashRecoveryCode,
} from '@/lib/server/totp.js';
import { rateLimitOrJson } from '@/lib/server/rateLimit.js';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const ISSUER = 'AurumX';

export async function GET() {
  try {
    const user = await requireUser();
    return NextResponse.json({
      enabled: !!user.totp?.enabled,
      enrolledAt: user.totp?.enrolledAt || null,
      recoveryCodesRemaining: (user.totp?.recoveryCodes || []).length,
    });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: err.status || 500 });
  }
}

// POST handles both enroll and confirm to keep the route tree flat.
export async function POST(req) {
  try {
    const limited = rateLimitOrJson(req, { key: '2fa', max: 10, windowMs: 60_000 });
    if (limited) return limited;
    const user = await requireUser();
    const { searchParams } = new URL(req.url);
    const action = String(searchParams.get('action') || 'enroll');
    const body = await req.json().catch(() => ({}));

    if (action === 'enroll') {
      // Always start from a fresh secret; reusing the previous one would
      // make a leaked stale URI re-usable.
      const { base32 } = generateSecret();
      user.totp = {
        ...(user.totp || {}),
        pendingSecret: base32,
        pendingAt: Date.now(),
        enabled: !!user.totp?.enabled,
      };
      upsertUser(user);
      return NextResponse.json({
        secret: base32,
        uri: provisioningUri({ account: user.email, issuer: ISSUER, secretBase32: base32 }),
      });
    }

    if (action === 'confirm') {
      const code = String(body.code || '').trim();
      const pending = user.totp?.pendingSecret;
      if (!pending) {
        return NextResponse.json({ error: 'No pending enrollment. Start enroll first.' }, { status: 400 });
      }
      if (!verifyTotp(pending, code)) {
        return NextResponse.json({ error: 'Incorrect code. Try again with a fresh one from your authenticator.' }, { status: 400 });
      }
      const recovery = generateRecoveryCodes();
      user.totp = {
        secret: pending,
        enabled: true,
        enrolledAt: Date.now(),
        recoveryCodes: recovery.map(hashRecoveryCode),
      };
      delete user.totp.pendingSecret;
      delete user.totp.pendingAt;
      upsertUser(user);
      appendAudit({
        actorId: user.id,
        actorEmail: user.email,
        action: 'totp.enable',
        target: user.email,
      });
      // Recovery codes are shown ONCE — never persisted in plain text.
      return NextResponse.json({ ok: true, recoveryCodes: recovery });
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: err.status || 500 });
  }
}

export async function DELETE(req) {
  try {
    const user = await requireUser();
    const body = await req.json().catch(() => ({}));
    if (!user.totp?.enabled) {
      return NextResponse.json({ ok: true, alreadyDisabled: true });
    }
    // Require the user to prove they still control the account: either
    // a fresh TOTP code OR their current password.
    const code = String(body.code || '').trim();
    const password = String(body.password || '');
    const okByCode = code && verifyTotp(user.totp.secret, code);
    const okByPass = password && verifyPassword(password, user.passwordSalt, user.passwordHash);
    if (!okByCode && !okByPass) {
      return NextResponse.json({
        error: 'Provide a current 6-digit code or your account password to disable 2FA.',
      }, { status: 403 });
    }
    user.totp = { enabled: false, disabledAt: Date.now() };
    upsertUser(user);
    appendAudit({
      actorId: user.id,
      actorEmail: user.email,
      action: 'totp.disable',
      target: user.email,
    });
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: err.status || 500 });
  }
}

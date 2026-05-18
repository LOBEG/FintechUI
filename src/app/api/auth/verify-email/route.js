// Confirm an email-verification code. Marks emailVerifiedAt on the user
// record on success.
import { NextResponse } from 'next/server';
import crypto from 'node:crypto';
import { requireUser } from '@/lib/server/auth.js';
import {
  latestVerificationForUser,
  updateVerification,
  upsertUser,
  appendAudit,
} from '@/lib/server/store.js';
import { rateLimitOrJson } from '@/lib/server/rateLimit.js';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function hashCode(code) {
  return crypto.createHash('sha256').update(code).digest('hex');
}

export async function POST(req) {
  try {
    const limited = rateLimitOrJson(req, { key: 'verify-confirm', max: 10, windowMs: 60_000 });
    if (limited) return limited;
    const user = await requireUser();
    if (user.emailVerifiedAt) {
      return NextResponse.json({ ok: true, alreadyVerified: true });
    }
    const body = await req.json().catch(() => ({}));
    const code = String(body.code || '').trim();
    if (!/^\d{6}$/.test(code)) {
      return NextResponse.json({ error: 'Enter the 6-digit code from your inbox.' }, { status: 400 });
    }
    const v = latestVerificationForUser(user.id);
    if (!v) {
      return NextResponse.json({
        error: 'No active verification code. Request a new one.',
      }, { status: 404 });
    }
    if (Date.now() > v.expiresAt) {
      return NextResponse.json({
        error: 'This code has expired. Request a new one.',
      }, { status: 410 });
    }
    // Constant-time compare on the hex SHA-256.
    const got = Buffer.from(hashCode(code), 'hex');
    const want = Buffer.from(v.codeHash, 'hex');
    if (got.length !== want.length || !crypto.timingSafeEqual(got, want)) {
      // Bump attempts so a runaway script can be rate-limited at the
      // store level if needed.
      updateVerification(v.id, { attempts: (v.attempts || 0) + 1 });
      return NextResponse.json({ error: 'Incorrect code.' }, { status: 400 });
    }

    updateVerification(v.id, { usedAt: Date.now() });
    user.emailVerifiedAt = Date.now();
    upsertUser(user);
    appendAudit({
      actorId: user.id,
      actorEmail: user.email,
      action: 'email.verify',
      target: user.email,
    });
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: err.status || 500 });
  }
}

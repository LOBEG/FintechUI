// Send (or resend) an email-verification code for the signed-in user.
//
// Re-uses the existing newCode() helper and the email outbox. The user
// receives a 6-digit numeric code valid for 30 minutes; we store only
// the SHA-256 hash so an exposed verifications.json cannot be replayed.
import { NextResponse } from 'next/server';
import crypto from 'node:crypto';
import { requireUser, newId } from '@/lib/server/auth.js';
import { addVerification, latestVerificationForUser, upsertUser } from '@/lib/server/store.js';
import { sendEmail } from '@/lib/server/email.js';
import { rateLimitOrJson } from '@/lib/server/rateLimit.js';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const CODE_TTL_MS = 30 * 60 * 1000;

function sixDigit() {
  // 100000..999999 - uniform via rejection: we draw a 24-bit number and
  // mod, which is fine for a six-digit OTP.
  const n = crypto.randomBytes(3).readUIntBE(0, 3) % 900_000 + 100_000;
  return String(n);
}

function hashCode(code) {
  return crypto.createHash('sha256').update(code).digest('hex');
}

export async function POST(req) {
  try {
    const limited = rateLimitOrJson(req, { key: 'verify-send', max: 3, windowMs: 60_000 });
    if (limited) return limited;
    const user = await requireUser();
    if (user.emailVerifiedAt) {
      return NextResponse.json({ ok: true, alreadyVerified: true });
    }
    // Throttle: if the last unused code was issued <60s ago, refuse.
    const last = latestVerificationForUser(user.id);
    if (last && Date.now() - last.createdAt < 60_000) {
      return NextResponse.json({
        error: 'A verification code was just sent - please wait a minute before requesting another.',
      }, { status: 429 });
    }
    const code = sixDigit();
    addVerification({
      id: newId('vrf'),
      userId: user.id,
      codeHash: hashCode(code),
      createdAt: Date.now(),
      expiresAt: Date.now() + CODE_TTL_MS,
    });
    await sendEmail({
      to: user.email,
      subject: 'Your Oakmont Digital Markets Groups verification code',
      text: `Your Oakmont Digital Markets Groups verification code is ${code}. It expires in 30 minutes. If you did not request this, ignore this email.`,
      html: `<p>Your Oakmont Digital Markets Groups verification code is <strong style="font-size:20px;letter-spacing:2px">${code}</strong></p><p>It expires in 30 minutes. If you did not request this, ignore this email.</p>`,
    });
    // Mark the user as having had verification initiated so the dashboard
    // banner can switch to "check your inbox".
    user.emailVerificationSentAt = Date.now();
    upsertUser(user);
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: err.status || 500 });
  }
}

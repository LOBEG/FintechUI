// Initiate a password reset. Always returns ok (even when the email is
// unknown) so attackers cannot use this endpoint to enumerate accounts.
// When an account exists, a signed time-bound token is generated, its
// SHA-256 stored in the `passwordResets` collection, and a link emailed
// to the user.
import { NextResponse } from 'next/server';
import crypto from 'node:crypto';
import { newId, signPayload } from '@/lib/server/auth.js';
import {
  findUserByEmail,
  addReset,
} from '@/lib/server/store.js';
import { rateLimitOrJson } from '@/lib/server/rateLimit.js';
import { sendEmail } from '@/lib/server/email.js';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const TTL_MS = 60 * 60 * 1000; // 1 hour

export async function POST(req) {
  try {
    const limited = rateLimitOrJson(req, { key: 'forgot', max: 5, windowMs: 15 * 60_000 });
    if (limited) return limited;
    const body = await req.json().catch(() => ({}));
    const email = String(body.email || '').toLowerCase().trim();
    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }
    const user = findUserByEmail(email);
    // Account-enumeration safe: respond identically regardless of existence.
    if (user) {
      const id = newId('rst');
      const codeRaw = crypto.randomBytes(24).toString('base64url');
      const codeHash = crypto.createHash('sha256').update(codeRaw).digest('hex');
      const expiresAt = Date.now() + TTL_MS;
      addReset({
        id,
        userId: user.id,
        codeHash,
        createdAt: Date.now(),
        expiresAt,
        usedAt: null,
      });
      const token = signPayload({ rid: id, uid: user.id, exp: expiresAt });
      const link = `${process.env.APP_URL || ''}/reset-password?token=${encodeURIComponent(token)}&code=${encodeURIComponent(codeRaw)}`;
      try {
        await sendEmail({
          to: user.email,
          subject: 'Reset your Oakmont Digital Markets Group password',
          text: `Use this link within one hour to reset your Oakmont Digital Markets Group password: ${link}\n\nIf you did not request this, ignore this email — your password will not change.`,
          html: `<!doctype html><html><body style="margin:0;background:#05070d;font-family:Inter,Helvetica,Arial,sans-serif;color:#fff;padding:32px"><div style="max-width:560px;margin:0 auto;background:#0b1020;border:1px solid rgba(255,255,255,0.06);border-radius:16px;padding:28px"><h1 style="margin:0 0 12px;font-size:20px;font-weight:600">Reset your Oakmont Digital Markets Group password</h1><p style="color:#c8ccd4;line-height:1.55">Click the button below within one hour to choose a new password. If you didn't request this, ignore this email — your password will not change.</p><p style="margin:18px 0"><a href="${link}" style="display:inline-block;padding:11px 18px;border-radius:10px;background:linear-gradient(135deg,#00ffa3,#00d68a);color:#05070d;text-decoration:none;font-weight:600">Reset password</a></p><p style="color:#7a8290;font-size:12px;word-break:break-all">Or paste this URL into your browser: ${link}</p></div></body></html>`,
        });
      } catch (_) {}
    }
    return NextResponse.json({
      ok: true,
      message: 'If an account exists for that email, a reset link has been sent.',
    });
  } catch (err) {
    return NextResponse.json({ error: err.message || 'Request failed' }, { status: 500 });
  }
}

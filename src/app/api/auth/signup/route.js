import { NextResponse } from 'next/server';
import { hashPassword, newId, setSessionCookie, publicUser } from '@/lib/server/auth.js';
import { findUserByEmail, upsertUser, getSettings, addTransaction } from '@/lib/server/store.js';
import { rateLimitOrJson } from '@/lib/server/rateLimit.js';
import { ensureReferralCode, resolveReferralCode } from '@/lib/server/referral.js';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function isEmail(s) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s);
}

export async function POST(req) {
  try {
    const limited = rateLimitOrJson(req, { key: 'signup', max: 5, windowMs: 60_000 });
    if (limited) return limited;
    const settings = getSettings();
    if (!settings.signupsEnabled) {
      return NextResponse.json({ error: 'Signups are temporarily disabled.' }, { status: 403 });
    }
    const body = await req.json().catch(() => ({}));
    const email = String(body.email || '').toLowerCase().trim();
    const name = String(body.name || '').trim() || email.split('@')[0];
    const password = String(body.password || '');
    if (!isEmail(email)) return NextResponse.json({ error: 'Invalid email' }, { status: 400 });
    if (password.length < 8) return NextResponse.json({ error: 'Password must be at least 8 characters' }, { status: 400 });
    const adminEmail = String(process.env.ADMIN_EMAIL || '').toLowerCase().trim();
    if (adminEmail && email === adminEmail) {
      return NextResponse.json({ error: 'An account with this email already exists' }, { status: 409 });
    }
    if (findUserByEmail(email)) return NextResponse.json({ error: 'An account with this email already exists' }, { status: 409 });

    // Optional referral: resolve before we create the new user so we
    // never reference a code that points at the user-being-created.
    const referrerId = resolveReferralCode(body.referralCode);

    const { hash, salt } = hashPassword(password);
    const now = Date.now();
    const user = {
      id: newId('user'),
      email,
      name,
      passwordHash: hash,
      passwordSalt: salt,
      isAdmin: false,
      createdAt: now,
      balances: { USDT: 100 },
      accountStatus: 'active',
      termsAcceptedAt: now,
    };
    if (referrerId && referrerId !== user.id) {
      user.referredBy = referrerId;
      user.referredAt = Date.now();
    }
    upsertUser(user);
    addTransaction({
      id: newId('tx'),
      userId: user.id,
      type: 'deposit',
      symbol: 'USDT',
      amount: 100,
      usdValue: 100,
      price: 1,
      status: 'completed',
      note: 'Automatic signup deposit',
      createdAt: now,
    });
    // Give the new account its own referral code so it can refer friends
    // straight away.
    ensureReferralCode(user);
    await setSessionCookie(user, req);
    return NextResponse.json({ user: publicUser(user) });
  } catch (err) {
    return NextResponse.json({ error: err.message || 'Signup failed' }, { status: 500 });
  }
}

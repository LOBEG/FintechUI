import { NextResponse } from 'next/server';
import { hashPassword, newId, setSessionCookie, publicUser } from '@/lib/server/auth.js';
import { findUserByEmail, upsertUser, getSettings } from '@/lib/server/store.js';
import { rateLimitOrJson } from '@/lib/server/rateLimit.js';

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
    if (findUserByEmail(email)) return NextResponse.json({ error: 'An account with this email already exists' }, { status: 409 });

    const { hash, salt } = hashPassword(password);
    const user = {
      id: newId('user'),
      email,
      name,
      passwordHash: hash,
      passwordSalt: salt,
      isAdmin: false,
      createdAt: Date.now(),
      balances: {},
      accountStatus: 'active',
      termsAcceptedAt: Date.now(),
    };
    upsertUser(user);
    await setSessionCookie(user, req);
    return NextResponse.json({ user: publicUser(user) });
  } catch (err) {
    return NextResponse.json({ error: err.message || 'Signup failed' }, { status: 500 });
  }
}

import { NextResponse } from 'next/server';
import {
  verifyPassword,
  setSessionCookie,
  publicUser,
  bootstrapAdmin,
} from '@/lib/server/auth.js';
import { findUserByEmail } from '@/lib/server/store.js';
import { rateLimitOrJson } from '@/lib/server/rateLimit.js';

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
    await setSessionCookie(user, req);
    return NextResponse.json({ user: publicUser(user) });
  } catch (err) {
    return NextResponse.json({ error: err.message || 'Login failed' }, { status: 500 });
  }
}

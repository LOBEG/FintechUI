import { NextResponse } from 'next/server';
import {
  verifyPassword,
  setSessionCookie,
  publicUser,
  bootstrapAdmin,
} from '@/lib/server/auth.js';
import { findUserByEmail } from '@/lib/server/store.js';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req) {
  try {
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
    await setSessionCookie(user, req);
    return NextResponse.json({ user: publicUser(user) });
  } catch (err) {
    return NextResponse.json({ error: err.message || 'Login failed' }, { status: 500 });
  }
}

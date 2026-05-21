// Authentication: scrypt password hashing + HMAC-signed session cookies.
// No external dependencies - uses node:crypto only.

import crypto from 'node:crypto';
import { cookies } from 'next/headers';
import {
  findUserById,
  findUserByEmail,
  upsertUser,
  addSession,
  revokeSession,
} from './store.js';

const COOKIE_NAME = 'oakmontdc_session';
const COOKIE_TTL_DAYS = 30;

function secret() {
  const s = process.env.SESSION_SECRET;
  if (s && s.length >= 16) return s;
  // In production a missing/short secret is a hard error - silently
  // falling back to a known string would let anyone forge cookies.
  if (process.env.NODE_ENV === 'production') {
    throw new Error(
      'SESSION_SECRET is required in production and must be at least 16 characters.',
    );
  }
  return 'oakmontdc-dev-secret-do-not-use-in-prod-oakmontdc-dev-secret';
}

export function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(password, salt, 64).toString('hex');
  return { hash, salt };
}

export function verifyPassword(password, salt, expectedHash) {
  try {
    const hash = crypto.scryptSync(password, salt, 64);
    const expected = Buffer.from(expectedHash, 'hex');
    if (hash.length !== expected.length) return false;
    return crypto.timingSafeEqual(hash, expected);
  } catch {
    return false;
  }
}

export function newId(prefix = 'id') {
  return `${prefix}_${crypto.randomBytes(10).toString('hex')}`;
}

export function newCode(len = 24) {
  // URL-safe random string; used for withdrawal tokens.
  return crypto
    .randomBytes(len)
    .toString('base64')
    .replace(/[+/=]/g, '')
    .slice(0, len)
    .toUpperCase();
}

function sign(payload) {
  const body = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const mac = crypto
    .createHmac('sha256', secret())
    .update(body)
    .digest('base64url');
  return `${body}.${mac}`;
}

function verify(token) {
  if (!token || typeof token !== 'string') return null;
  const [body, mac] = token.split('.');
  if (!body || !mac) return null;
  const expected = crypto
    .createHmac('sha256', secret())
    .update(body)
    .digest('base64url');
  // Constant-time compare
  const a = Buffer.from(mac);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return null;
  if (!crypto.timingSafeEqual(a, b)) return null;
  try {
    const payload = JSON.parse(Buffer.from(body, 'base64url').toString('utf8'));
    if (payload.exp && Date.now() > payload.exp) return null;
    return payload;
  } catch {
    return null;
  }
}

// Exported variants for non-cookie signed tokens (e.g. password reset links).
export function signPayload(payload) {
  return sign(payload);
}
export function verifyPayload(token) {
  return verify(token);
}

export async function setSessionCookie(user, req) {
  const exp = Date.now() + COOKIE_TTL_DAYS * 24 * 60 * 60 * 1000;
  const sid = newId('sess');
  const token = sign({ sid, uid: user.id, exp });
  const jar = await cookies();
  jar.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: COOKIE_TTL_DAYS * 24 * 60 * 60,
  });
  addSession({
    id: sid,
    userId: user.id,
    createdAt: Date.now(),
    ip: req?.headers?.get?.('x-forwarded-for') || null,
    ua: req?.headers?.get?.('user-agent') || null,
  });
  return token;
}

export async function clearSessionCookie() {
  const jar = await cookies();
  // Revoke the session record so /api/auth/sessions stays accurate and
  // sessions.json doesn't leak rows forever.
  try {
    const existing = jar.get(COOKIE_NAME)?.value;
    const payload = verify(existing);
    if (payload?.sid) revokeSession(payload.sid);
  } catch (_) {}
  jar.set(COOKIE_NAME, '', { path: '/', maxAge: 0 });
}

// Read the current session id (for endpoints that need to know which
// device is making the request, e.g. "revoke other sessions").
export async function currentSessionId() {
  const jar = await cookies();
  const payload = verify(jar.get(COOKIE_NAME)?.value);
  return payload?.sid || null;
}

export async function currentUser() {
  const jar = await cookies();
  const token = jar.get(COOKIE_NAME)?.value;
  const payload = verify(token);
  if (!payload) return null;
  const u = findUserById(payload.uid);
  return u || null;
}

export async function requireUser() {
  const u = await currentUser();
  if (!u) {
    const err = new Error('Unauthorized');
    err.status = 401;
    throw err;
  }
  if (u.accountStatus && u.accountStatus !== 'active') {
    const err = new Error('Your account is currently disabled. Please contact support.');
    err.status = 403;
    throw err;
  }
  return u;
}

export async function requireAdmin() {
  const u = await requireUser();
  if (!u.isAdmin) {
    const err = new Error('Forbidden');
    err.status = 403;
    throw err;
  }
  return u;
}

export function publicUser(u) {
  if (!u) return null;
  return {
    id: u.id,
    email: u.email,
    name: u.name,
    isAdmin: !!u.isAdmin,
    createdAt: u.createdAt,
    balances: u.balances || {},
    telegramId: u.telegramId || null,
    accountStatus: u.accountStatus || 'active',
    emailVerifiedAt: u.emailVerifiedAt || null,
    twoFactorEnabled: !!u.totp?.enabled,
  };
}

// Bootstrap an admin from env on first call. ADMIN_EMAIL + ADMIN_PASSWORD.
export function bootstrapAdmin() {
  const email = (process.env.ADMIN_EMAIL || '').toLowerCase().trim();
  const password = process.env.ADMIN_PASSWORD || '';
  if (!email || !password) return null;
  const existing = findUserByEmail(email);
  if (existing) {
    if (!existing.isAdmin) {
      existing.isAdmin = true;
      upsertUser(existing);
    }
    return existing;
  }
  const { hash, salt } = hashPassword(password);
  const user = {
    id: newId('user'),
    email,
    name: 'Oakmont Digital Markets Group Admin',
    passwordHash: hash,
    passwordSalt: salt,
    isAdmin: true,
    createdAt: Date.now(),
    balances: {},
  };
  upsertUser(user);
  return user;
}

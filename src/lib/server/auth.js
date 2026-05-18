// Authentication: scrypt password hashing + HMAC-signed session cookies.
// No external dependencies — uses node:crypto only.

import crypto from 'node:crypto';
import { cookies } from 'next/headers';
import {
  findUserById,
  findUserByEmail,
  upsertUser,
  addSession,
} from './store.js';

const COOKIE_NAME = 'aurumx_session';
const COOKIE_TTL_DAYS = 30;

function secret() {
  const s = process.env.SESSION_SECRET;
  if (s && s.length >= 16) return s;
  // Fallback in dev: derive a stable secret from host info so sessions
  // survive a restart, but warn so prod ops add a real secret.
  if (process.env.NODE_ENV === 'production' && !s) {
    // eslint-disable-next-line no-console
    console.warn('[aurumx] SESSION_SECRET not set — using insecure fallback.');
  }
  return 'aurumx-dev-secret-do-not-use-in-prod-aurumx-dev-secret';
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
  jar.set(COOKIE_NAME, '', { path: '/', maxAge: 0 });
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
    name: 'AurumX Admin',
    passwordHash: hash,
    passwordSalt: salt,
    isAdmin: true,
    createdAt: Date.now(),
    balances: {},
  };
  upsertUser(user);
  return user;
}

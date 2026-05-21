// RFC 6238 TOTP — Time-based One-Time Password.
//
// Implemented from first principles on top of node:crypto so Oakmont Digital Markets Group
// doesn't have to take a new dependency. Compatible with Google
// Authenticator, Authy, 1Password and every other authenticator that
// supports otpauth://totp/ URIs.
//
// - 30 s step, 6 digits, HMAC-SHA1 (the RFC 6238 default that everyone
//   actually implements).
// - A small drift window of ±1 step (≈ ±30 s) is accepted on verify.

import crypto from 'node:crypto';

const STEP_SECONDS = 30;
const DIGITS = 6;
const DRIFT_WINDOWS = 1;

// RFC 4648 base32 (no padding) — what every authenticator expects.
const B32_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';

export function base32Encode(buf) {
  let bits = 0;
  let value = 0;
  let out = '';
  for (let i = 0; i < buf.length; i++) {
    value = (value << 8) | buf[i];
    bits += 8;
    while (bits >= 5) {
      out += B32_ALPHABET[(value >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }
  if (bits > 0) out += B32_ALPHABET[(value << (5 - bits)) & 31];
  return out;
}

export function base32Decode(s) {
  const clean = s.replace(/=+$/g, '').replace(/\s+/g, '').toUpperCase();
  let bits = 0;
  let value = 0;
  const out = [];
  for (let i = 0; i < clean.length; i++) {
    const idx = B32_ALPHABET.indexOf(clean[i]);
    if (idx === -1) throw new Error('Invalid base32 character');
    value = (value << 5) | idx;
    bits += 5;
    if (bits >= 8) {
      out.push((value >>> (bits - 8)) & 0xff);
      bits -= 8;
    }
  }
  return Buffer.from(out);
}

/**
 * Generate a new 20-byte (160-bit) secret and return both the raw bytes
 * and its base32 encoding — store the base32 on the user record so the
 * provisioning URI can be rebuilt later.
 */
export function generateSecret() {
  const buf = crypto.randomBytes(20);
  return { buffer: buf, base32: base32Encode(buf) };
}

function hotp(secret, counter) {
  const buf = Buffer.alloc(8);
  // Counter is a uint64 big-endian. Math step safe for any plausible
  // unix time / 30s (≈ 2.4e15 < 2^53).
  buf.writeBigUInt64BE(BigInt(counter));
  const hmac = crypto.createHmac('sha1', secret).update(buf).digest();
  const offset = hmac[hmac.length - 1] & 0x0f;
  const code = ((hmac[offset] & 0x7f) << 24)
    | ((hmac[offset + 1] & 0xff) << 16)
    | ((hmac[offset + 2] & 0xff) << 8)
    | (hmac[offset + 3] & 0xff);
  const mod = 10 ** DIGITS;
  return String(code % mod).padStart(DIGITS, '0');
}

export function totp(secretBase32, atMs = Date.now()) {
  const secret = base32Decode(secretBase32);
  const counter = Math.floor(atMs / 1000 / STEP_SECONDS);
  return hotp(secret, counter);
}

export function verifyTotp(secretBase32, code, atMs = Date.now()) {
  if (!/^\d{6}$/.test(String(code))) return false;
  const secret = base32Decode(secretBase32);
  const counter = Math.floor(atMs / 1000 / STEP_SECONDS);
  // Accept the current step ± DRIFT_WINDOWS to tolerate clock skew.
  for (let d = -DRIFT_WINDOWS; d <= DRIFT_WINDOWS; d++) {
    const expected = hotp(secret, counter + d);
    // Constant-time compare on the 6-char string.
    const a = Buffer.from(String(code));
    const b = Buffer.from(expected);
    if (a.length === b.length && crypto.timingSafeEqual(a, b)) return true;
  }
  return false;
}

/**
 * Build an otpauth:// URI for an authenticator app to scan as a QR.
 * `account` is typically the user's email; `issuer` is shown in the app.
 */
export function provisioningUri({ account, issuer, secretBase32 }) {
  const label = encodeURIComponent(`${issuer}:${account}`);
  const params = new URLSearchParams({
    secret: secretBase32,
    issuer,
    algorithm: 'SHA1',
    digits: String(DIGITS),
    period: String(STEP_SECONDS),
  });
  return `otpauth://totp/${label}?${params.toString()}`;
}

/**
 * Cryptographically random one-time recovery codes — 10 codes of 10
 * hex chars each, used to recover access when the user loses their
 * authenticator. Stored hashed on the user record.
 */
export function generateRecoveryCodes(n = 10) {
  const codes = [];
  for (let i = 0; i < n; i++) {
    codes.push(crypto.randomBytes(5).toString('hex').toUpperCase());
  }
  return codes;
}

export function hashRecoveryCode(code) {
  return crypto.createHash('sha256').update(String(code).toUpperCase().replace(/\s+/g, '')).digest('hex');
}

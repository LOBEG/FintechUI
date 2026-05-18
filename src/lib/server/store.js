// File-based JSON persistence layer for AurumX.
// Designed to run on Railway with an attached volume mounted at /data
// (configurable via DATA_DIR env). Falls back to <repo>/data in dev.
//
// All public functions are synchronous to keep the API routes simple.
// Concurrency safety relies on Node's single-thread event loop plus the
// `writeFileSync` + `renameSync` pattern, which is atomic on POSIX
// filesystems (Railway/Linux) for same-directory renames. Two API requests
// arriving in the same event-loop tick are serialized by Node so they
// cannot interleave reads/writes. This is fine for the volumes a typical
// fintech UI/demo workload handles. For multi-process deployments or
// very high concurrency, swap this layer for SQLite / Postgres without
// touching callers (every callsite goes through the helpers below).

import fs from 'node:fs';
import path from 'node:path';

const DATA_DIR = process.env.DATA_DIR || path.join(process.cwd(), 'data');

function ensureDir() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
}

function fileFor(name) {
  ensureDir();
  return path.join(DATA_DIR, `${name}.json`);
}

function read(name, fallback) {
  const f = fileFor(name);
  if (!fs.existsSync(f)) return fallback;
  try {
    const raw = fs.readFileSync(f, 'utf8');
    if (!raw.trim()) return fallback;
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

function write(name, data) {
  const f = fileFor(name);
  const tmp = `${f}.tmp`;
  fs.writeFileSync(tmp, JSON.stringify(data, null, 2));
  fs.renameSync(tmp, f);
}

// ---------------- USERS ----------------
// User = { id, email, name, passwordHash, passwordSalt, isAdmin, createdAt,
//          balances: { BTC: number, ETH: number, ... USDT: number }, telegramId? }

export function listUsers() {
  return read('users', []);
}
export function saveUsers(users) {
  write('users', users);
}
export function findUserByEmail(email) {
  const e = (email || '').toLowerCase().trim();
  return listUsers().find((u) => u.email === e) || null;
}
export function findUserById(id) {
  return listUsers().find((u) => u.id === id) || null;
}
export function upsertUser(user) {
  const users = listUsers();
  const i = users.findIndex((u) => u.id === user.id);
  if (i === -1) users.push(user);
  else users[i] = user;
  saveUsers(users);
  return user;
}

// ---------------- TRANSACTIONS ----------------
// Tx = { id, userId, type: 'deposit'|'withdraw'|'invest'|'admin_credit',
//        symbol, amount (crypto), usdValue, price, status, note, createdAt,
//        adminId?, tokenId?, ip? }

export function listTransactions() {
  return read('transactions', []);
}
export function saveTransactions(arr) {
  write('transactions', arr);
}
export function addTransaction(tx) {
  const arr = listTransactions();
  arr.unshift(tx);
  saveTransactions(arr);
  return tx;
}
export function transactionsForUser(userId) {
  return listTransactions().filter((t) => t.userId === userId);
}

// --------------- WITHDRAWAL TOKENS ----------------
// Token = { id, code, issuedBy (admin id), userId?, symbol?, maxAmount?,
//           status: 'active'|'used'|'revoked', usedAt?, usedBy?, txId?,
//           createdAt, expiresAt? }

export function listTokens() {
  return read('withdrawalTokens', []);
}
export function saveTokens(arr) {
  write('withdrawalTokens', arr);
}
export function findTokenByCode(code) {
  if (!code) return null;
  return listTokens().find((t) => t.code === code) || null;
}
export function updateToken(id, patch) {
  const arr = listTokens();
  const i = arr.findIndex((t) => t.id === id);
  if (i === -1) return null;
  arr[i] = { ...arr[i], ...patch };
  saveTokens(arr);
  return arr[i];
}
export function addToken(token) {
  const arr = listTokens();
  arr.unshift(token);
  saveTokens(arr);
  return token;
}

// --------------- PASSWORD RESET TOKENS ----------------
// Reset = { id, userId, codeHash, createdAt, expiresAt, usedAt? }
export function listResets() {
  return read('passwordResets', []);
}
export function addReset(r) {
  const arr = listResets();
  arr.unshift(r);
  // Keep the last 1000; older entries are useless anyway.
  write('passwordResets', arr.slice(0, 1000));
  return r;
}
export function findResetById(id) {
  return listResets().find((r) => r.id === id) || null;
}
export function updateReset(id, patch) {
  const arr = listResets();
  const i = arr.findIndex((r) => r.id === id);
  if (i === -1) return null;
  arr[i] = { ...arr[i], ...patch };
  write('passwordResets', arr);
  return arr[i];
}

// --------------- AUDIT LOG ----------------
// Append-only, hash-chained record of every admin action. Each entry
// includes the SHA-256 of the previous entry's serialised payload so any
// tampering is detectable post-hoc by replaying the chain.
// Entry = { id, ts, actorId, actorEmail, action, target?, payload?, prevHash, hash }
import crypto from 'node:crypto';

export function listAudit() {
  return read('auditLog', []);
}
export function appendAudit({ actorId, actorEmail, action, target, payload }) {
  const arr = listAudit();
  const prev = arr[0];
  const prevHash = prev ? prev.hash : 'GENESIS';
  const entry = {
    id: `aud_${Date.now().toString(36)}_${crypto.randomBytes(4).toString('hex')}`,
    ts: Date.now(),
    actorId: actorId || null,
    actorEmail: actorEmail || null,
    action: String(action || ''),
    target: target || null,
    payload: payload || null,
    prevHash,
  };
  entry.hash = crypto
    .createHash('sha256')
    .update(JSON.stringify({
      id: entry.id, ts: entry.ts, actorId: entry.actorId, actorEmail: entry.actorEmail,
      action: entry.action, target: entry.target, payload: entry.payload, prevHash,
    }))
    .digest('hex');
  arr.unshift(entry);
  // Cap the chain at 10k entries on disk to keep file size sane; in a real
  // deployment this rotates to cold storage.
  write('auditLog', arr.slice(0, 10000));
  return entry;
}

// --------------- EMAIL VERIFICATION CODES ---------------
// Code = { id, userId, codeHash, createdAt, expiresAt, usedAt? }
export function listVerifications() {
  return read('emailVerifications', []);
}
export function addVerification(v) {
  const arr = listVerifications();
  arr.unshift(v);
  write('emailVerifications', arr.slice(0, 1000));
  return v;
}
export function findVerification(id) {
  return listVerifications().find((v) => v.id === id) || null;
}
export function updateVerification(id, patch) {
  const arr = listVerifications();
  const i = arr.findIndex((v) => v.id === id);
  if (i === -1) return null;
  arr[i] = { ...arr[i], ...patch };
  write('emailVerifications', arr);
  return arr[i];
}
export function latestVerificationForUser(userId) {
  return listVerifications().find((v) => v.userId === userId && !v.usedAt) || null;
}

// --------------- NOTIFICATIONS ---------------
// Notification = { id, userId, kind, title, body, createdAt, readAt? }
// `userId === null` is a broadcast visible to every signed-in user.
export function listNotifications() {
  return read('notifications', []);
}
export function addNotification(n) {
  const arr = listNotifications();
  arr.unshift(n);
  write('notifications', arr.slice(0, 5000));
  return n;
}
export function notificationsForUser(userId) {
  return listNotifications().filter((n) => !n.userId || n.userId === userId);
}
export function markNotificationsRead(userId, ids) {
  const arr = listNotifications();
  const idSet = ids === 'all' ? null : new Set(ids || []);
  const now = Date.now();
  let changed = false;
  for (const n of arr) {
    if (n.userId && n.userId !== userId) continue; // can't mark someone else's
    if (idSet && !idSet.has(n.id)) continue;
    if (n.userId === userId && !n.readAt) {
      n.readAt = now;
      changed = true;
    } else if (!n.userId) {
      // Broadcast: track per-user reads in a `readBy` set.
      n.readBy = n.readBy || {};
      if (!n.readBy[userId]) {
        n.readBy[userId] = now;
        changed = true;
      }
    }
  }
  if (changed) write('notifications', arr);
  return changed;
}

// --------------- SETTINGS ----------------
const DEFAULT_SETTINGS = {
  maintenanceMode: false,
  banner: '',
  withdrawalsEnabled: true,
  signupsEnabled: true,
  broadcasts: [],
};
export function getSettings() {
  return { ...DEFAULT_SETTINGS, ...read('settings', {}) };
}
export function saveSettings(patch) {
  const next = { ...getSettings(), ...patch };
  write('settings', next);
  return next;
}

// --------------- EMAIL OUTBOX ----------------
export function appendOutbox(entry) {
  const arr = read('outbox', []);
  arr.unshift(entry);
  write('outbox', arr.slice(0, 500));
  return entry;
}
export function listOutbox() {
  return read('outbox', []);
}

// --------------- SESSIONS ---------------
export function listSessions() {
  return read('sessions', []);
}
export function addSession(s) {
  const arr = listSessions();
  arr.unshift(s);
  write('sessions', arr.slice(0, 2000));
  return s;
}
export function revokeSession(id) {
  const arr = listSessions().filter((s) => s.id !== id);
  write('sessions', arr);
}

// --------------- DEPOSIT ADDRESSES ---------------
// One global record per symbol (the address the admin advertises for
// inbound transfers). Stored as { SYMBOL: { address, memo?, network?,
// updatedAt, updatedBy } }.
export function listDepositAddresses() {
  return read('depositAddresses', {});
}
export function setDepositAddress(symbol, payload) {
  const sym = String(symbol || '').toUpperCase();
  if (!sym) throw new Error('symbol required');
  const all = listDepositAddresses();
  all[sym] = { ...payload, symbol: sym, updatedAt: Date.now() };
  write('depositAddresses', all);
  return all[sym];
}
export function removeDepositAddress(symbol) {
  const sym = String(symbol || '').toUpperCase();
  const all = listDepositAddresses();
  if (!all[sym]) return false;
  delete all[sym];
  write('depositAddresses', all);
  return true;
}

// --------------- TESTIMONIALS ---------------
// Testimonial = { id, userId, name, role, text, rating (1-5), status:
//                 'pending'|'approved'|'rejected', createdAt, moderatedAt?,
//                 moderatedBy? }
export function listTestimonials() {
  return read('testimonials', []);
}
export function addTestimonial(t) {
  const arr = listTestimonials();
  arr.unshift(t);
  write('testimonials', arr.slice(0, 1000));
  return t;
}
export function updateTestimonial(id, patch) {
  const arr = listTestimonials();
  const i = arr.findIndex((t) => t.id === id);
  if (i === -1) return null;
  arr[i] = { ...arr[i], ...patch };
  write('testimonials', arr);
  return arr[i];
}
export function deleteTestimonial(id) {
  const arr = listTestimonials().filter((t) => t.id !== id);
  write('testimonials', arr);
}

// --------------- ORDERS ----------------
// Order = { id, userId, side: 'buy'|'sell', kind: 'limit'|'stop',
//           symbol, qty, price (limit price or stop trigger), usd (for buy),
//           status: 'open'|'filled'|'cancelled'|'rejected',
//           createdAt, filledAt?, txId?, cancelledAt?, rejectedReason? }
export function listOrders() {
  return read('orders', []);
}
export function saveOrders(arr) {
  write('orders', arr);
}
export function addOrder(o) {
  const arr = listOrders();
  arr.unshift(o);
  write('orders', arr.slice(0, 5000));
  return o;
}
export function updateOrder(id, patch) {
  const arr = listOrders();
  const i = arr.findIndex((o) => o.id === id);
  if (i === -1) return null;
  arr[i] = { ...arr[i], ...patch };
  write('orders', arr);
  return arr[i];
}
export function ordersForUser(userId) {
  return listOrders().filter((o) => o.userId === userId);
}
export function openOrders() {
  return listOrders().filter((o) => o.status === 'open');
}

// --------------- BENEFICIARIES (whitelisted withdraw addresses) ----------
// Beneficiary = { id, userId, label, symbol, network?, address, memo?,
//                 createdAt, confirmTokenHash?, confirmedAt?, usableAt?,
//                 removedAt? }
// Lifecycle:
//   created     → row inserted, confirmation email sent
//   confirmed   → user clicked the email link (confirmedAt set, usableAt =
//                 confirmedAt + 48h cool-down)
//   usable      → usableAt has passed; withdraw flow will accept it
//   removed     → soft-deleted (removedAt set) so audit trail survives
export function listBeneficiaries() {
  return read('beneficiaries', []);
}
export function addBeneficiary(b) {
  const arr = listBeneficiaries();
  arr.unshift(b);
  write('beneficiaries', arr.slice(0, 10000));
  return b;
}
export function updateBeneficiary(id, patch) {
  const arr = listBeneficiaries();
  const i = arr.findIndex((b) => b.id === id);
  if (i === -1) return null;
  arr[i] = { ...arr[i], ...patch };
  write('beneficiaries', arr);
  return arr[i];
}
export function findBeneficiary(id) {
  return listBeneficiaries().find((b) => b.id === id) || null;
}
export function beneficiariesForUser(userId) {
  return listBeneficiaries().filter((b) => b.userId === userId && !b.removedAt);
}

// ---------------- KYC SUBMISSIONS ----------------
// Submission = { id, userId, requestedTier (1|2|3), status: 'pending'|'approved'|'rejected',
//                payload: { phone?, idDocType?, idDocRef?, address?, sourceOfFunds? },
//                createdAt, reviewedAt?, reviewedBy?, reviewNote? }
export function listKycSubmissions() {
  return read('kycSubmissions', []);
}
export function addKycSubmission(s) {
  const arr = listKycSubmissions();
  arr.unshift(s);
  write('kycSubmissions', arr.slice(0, 10000));
  return s;
}
export function updateKycSubmission(id, patch) {
  const arr = listKycSubmissions();
  const i = arr.findIndex((s) => s.id === id);
  if (i === -1) return null;
  arr[i] = { ...arr[i], ...patch };
  write('kycSubmissions', arr);
  return arr[i];
}
export function findKycSubmission(id) {
  return listKycSubmissions().find((s) => s.id === id) || null;
}
export function pendingKycForUser(userId) {
  return listKycSubmissions().find(
    (s) => s.userId === userId && s.status === 'pending',
  ) || null;
}

// --------------- PRICE ALERTS ----------------
// PriceAlert = { id, userId, symbol, op: 'gt'|'lt', threshold,
//                status: 'active'|'triggered'|'cancelled',
//                createdAt, triggeredAt?, triggeredPrice?, cancelledAt? }
// The background settler (orders.js) evaluates every `active` row against
// the live mid each tick; on a cross it sets `triggered`, writes a
// notification, and emails the user. Triggered/cancelled rows are kept
// so the user can see their history.
export function listPriceAlerts() {
  return read('priceAlerts', []);
}
export function addPriceAlert(a) {
  const arr = listPriceAlerts();
  arr.unshift(a);
  write('priceAlerts', arr.slice(0, 5000));
  return a;
}
export function updatePriceAlert(id, patch) {
  const arr = listPriceAlerts();
  const i = arr.findIndex((a) => a.id === id);
  if (i === -1) return null;
  arr[i] = { ...arr[i], ...patch };
  write('priceAlerts', arr);
  return arr[i];
}
export function priceAlertsForUser(userId) {
  return listPriceAlerts().filter((a) => a.userId === userId);
}
export function activePriceAlerts() {
  return listPriceAlerts().filter((a) => a.status === 'active');
}

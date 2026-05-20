// File-based JSON persistence layer for Oakmont Digital Capital Group.
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

// --------------- WATCHLISTS ----------------
// Watchlist = { userId, symbols: string[], updatedAt }
// One row per user, keyed by userId. Symbols are stored in their *base*
// form ('BTC', 'ETH', …) and the client converts to a BINANCE pair at
// render time. Capped at 50 symbols per user to keep the row size sane.
export function listWatchlists() {
  return read('watchlists', []);
}
export function getWatchlist(userId) {
  const row = listWatchlists().find((w) => w.userId === userId);
  return row ? row.symbols.slice() : [];
}
export function setWatchlist(userId, symbols) {
  const arr = listWatchlists();
  const i = arr.findIndex((w) => w.userId === userId);
  const row = { userId, symbols: symbols.slice(0, 50), updatedAt: Date.now() };
  if (i === -1) arr.push(row);
  else arr[i] = row;
  write('watchlists', arr);
  return row.symbols.slice();
}

// ---------------- DCA ----------------
// Recurring buy schedules. Dca = {
//   id, userId, symbol, usdAmount, intervalMs,
//   status: 'active' | 'paused' | 'cancelled',
//   nextRunAt, lastRunAt?, runs: number,
//   createdAt
// }
// The order settler ticks every 5s and runs any active dca whose
// nextRunAt has elapsed.
export function listDcas() {
  return read('dcas', []);
}
export function addDca(d) {
  const arr = listDcas();
  arr.unshift(d);
  write('dcas', arr.slice(0, 5000));
  return d;
}
export function updateDca(id, patch) {
  const arr = listDcas();
  const i = arr.findIndex((d) => d.id === id);
  if (i === -1) return null;
  arr[i] = { ...arr[i], ...patch };
  write('dcas', arr);
  return arr[i];
}
export function dcasForUser(userId) {
  return listDcas().filter((d) => d.userId === userId);
}
export function activeDcas() {
  return listDcas().filter((d) => d.status === 'active');
}

// ---------------- REFERRALS ----------------
// Each user gets a short, unique referral code on first access. When a
// new account signs up with `?ref=CODE` we set `user.referredBy = id`;
// every time the referee then pays a broker fee, a small rebate
// (REFERRAL_REBATE_BPS, default 1000 = 10% of the fee) is credited to
// the referrer's USDT balance and a `referral_rebate` transaction is
// written. We also keep an idempotency log so re-runs over the same
// source transaction never double-pay.
export function findUserByReferralCode(code) {
  const c = String(code || '').toUpperCase().trim();
  if (!c) return null;
  return listUsers().find((u) => (u.referralCode || '').toUpperCase() === c) || null;
}

export function refereesOf(userId) {
  return listUsers().filter((u) => u.referredBy === userId);
}

export function listReferralRebates() {
  return read('referralRebates', []);
}
export function addReferralRebate(entry) {
  const arr = listReferralRebates();
  // Idempotency: never double-credit the same source transaction.
  if (entry.sourceTxId && arr.some((r) => r.sourceTxId === entry.sourceTxId)) {
    return null;
  }
  arr.unshift(entry);
  write('referralRebates', arr.slice(0, 10000));
  return entry;
}
export function referralRebatesForReferrer(referrerId) {
  return listReferralRebates().filter((r) => r.referrerId === referrerId);
}

// ---------------- SUPPORT TICKETS ----------------
// A ticket has the shape:
//   { id, userId, subject, status: 'open'|'awaiting_user'|'answered'|'closed',
//     priority: 'low'|'normal'|'high', createdAt, updatedAt,
//     messages: [{ id, authorId, authorRole: 'user'|'staff',
//                  body, createdAt }] }
//
// We keep everything in tickets.json so the customer-support inbox stays
// inside the same JSON-store envelope as the rest of the app.
export function listTickets() {
  return read('tickets', []);
}
export function saveTickets(arr) {
  write('tickets', arr);
}
export function ticketsForUser(userId) {
  return listTickets().filter((t) => t.userId === userId);
}
export function findTicket(id) {
  return listTickets().find((t) => t.id === id) || null;
}
export function addTicket(t) {
  const arr = listTickets();
  arr.unshift(t);
  saveTickets(arr.slice(0, 5000));
  return t;
}
export function updateTicket(id, patch) {
  const arr = listTickets();
  const i = arr.findIndex((t) => t.id === id);
  if (i === -1) return null;
  arr[i] = { ...arr[i], ...patch, updatedAt: Date.now() };
  saveTickets(arr);
  return arr[i];
}
export function addTicketMessage(id, msg) {
  const arr = listTickets();
  const i = arr.findIndex((t) => t.id === id);
  if (i === -1) return null;
  arr[i].messages = Array.isArray(arr[i].messages) ? arr[i].messages : [];
  arr[i].messages.push(msg);
  arr[i].updatedAt = Date.now();
  saveTickets(arr);
  return arr[i];
}

// ---------------- ADMIN/BROKER NOTES ----------------
// Free-form context that the desk can record against a user account.
// Notes are append-only — once written they're never edited so the
// audit trail is preserved; deletion happens at retention time only.
//   { id, userId, authorId, authorEmail, body, createdAt }
export function listUserNotes() {
  return read('userNotes', []);
}
export function notesForUser(userId) {
  return listUserNotes().filter((n) => n.userId === userId);
}
export function addUserNote(n) {
  const arr = listUserNotes();
  arr.unshift(n);
  write('userNotes', arr.slice(0, 10000));
  return n;
}

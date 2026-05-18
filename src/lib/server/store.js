// File-based JSON persistence layer for AurumX.
// Designed to run on Railway with an attached volume mounted at /data
// (configurable via DATA_DIR env). Falls back to <repo>/data in dev.
//
// All public functions are synchronous to keep the API routes simple.
// Concurrency safety relies on Node's single-thread event loop and the
// atomic-rename `writeFileSync` pattern. For very high concurrency you
// would swap this layer for SQLite / Postgres without touching callers.

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

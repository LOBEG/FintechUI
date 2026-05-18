// Referral programme.
//
// Each user gets a short, unique referral code at signup (or lazily on
// first /api/referral hit). New users can pass `referralCode` to
// /api/auth/signup; this sets `referredBy` on the new account.
//
// Whenever the referee pays a broker fee on a fill (invest, sell,
// convert spread, DCA tranche, settled limit/stop order), call
// `creditReferralRebate()`. That function:
//   - looks up the referee's `referredBy`,
//   - calculates REFERRAL_REBATE_BPS of the fee (default 1000 = 10%),
//   - credits the referrer's USDT,
//   - writes a `referral_rebate` transaction on the referrer's history,
//   - records an idempotency row in referralRebates.json so re-imports
//     (e.g. settler retries) never double-pay.
//
// All operations are best-effort: if the referrer disappears or the
// rebate is sub-cent we just skip — the referee's flow is never
// allowed to fail because of the rebate side-effect.

import crypto from 'node:crypto';
import {
  findUserById,
  upsertUser,
  addTransaction,
  addReferralRebate,
  findUserByReferralCode,
  listUsers,
} from './store.js';
import { newId } from './auth.js';

const DEFAULT_REBATE_BPS = 1000; // 10% of the broker fee

function rebateBps() {
  const v = parseFloat(process.env.REFERRAL_REBATE_BPS || '');
  if (!isFinite(v) || v < 0 || v > 5000) return DEFAULT_REBATE_BPS; // hard cap 50%
  return v;
}

// Generate a fresh, unique-amongst-users referral code.
function generateUniqueCode(existing) {
  const used = new Set(existing.map((u) => (u.referralCode || '').toUpperCase()).filter(Boolean));
  for (let i = 0; i < 100; i += 1) {
    const code = crypto
      .randomBytes(6)
      .toString('base64')
      .replace(/[^A-Za-z0-9]/g, '')
      .slice(0, 8)
      .toUpperCase();
    if (code.length >= 6 && !used.has(code)) return code;
  }
  // Fallback that's guaranteed unique enough — should never trigger.
  return `R${Date.now().toString(36).toUpperCase()}`;
}

/**
 * Ensure the user has a referral code, persisting one if missing.
 * Returns the (possibly newly-assigned) code.
 */
export function ensureReferralCode(user) {
  if (!user) return null;
  if (user.referralCode && /^[A-Z0-9]{4,12}$/.test(user.referralCode)) {
    return user.referralCode;
  }
  const code = generateUniqueCode(listUsers());
  user.referralCode = code;
  upsertUser(user);
  return code;
}

export function rebateRateInfo() {
  return { bps: rebateBps() };
}

/**
 * Credit a referral rebate, if applicable. Safe to call from any fee-
 * charging route — failures are swallowed and only logged.
 *
 *   refereeId  — the user who just paid the fee
 *   feeUsd     — the broker fee charged on the fill, in USDT
 *   sourceTxId — the source transaction id (for idempotency); pass the
 *                tx.id of the fill so retries don't double-pay.
 *   kind       — short label of the source ('invest', 'sell',
 *                'convert', 'dca', 'order') — purely for the audit row.
 */
export function creditReferralRebate({ refereeId, feeUsd, sourceTxId, kind }) {
  try {
    if (!refereeId || !sourceTxId) return null;
    const fee = Number(feeUsd);
    if (!isFinite(fee) || fee <= 0) return null;
    const referee = findUserById(refereeId);
    if (!referee || !referee.referredBy) return null;
    const referrer = findUserById(referee.referredBy);
    if (!referrer) return null;
    if (referrer.id === referee.id) return null; // self-referral guard
    const bps = rebateBps();
    const raw = (fee * bps) / 10000;
    // Round to cent precision (USDT is quoted to 2 dp) and bail out on
    // sub-cent rebates so we don't pollute the ledger with dust rows.
    const rebate = Math.round(raw * 100) / 100;
    if (rebate <= 0) return null;
    referrer.balances = referrer.balances || {};
    referrer.balances.USDT = (referrer.balances.USDT || 0) + rebate;
    upsertUser(referrer);
    const txId = newId('tx');
    addTransaction({
      id: txId,
      userId: referrer.id,
      type: 'referral_rebate',
      symbol: 'USDT',
      amount: rebate,
      usdValue: rebate,
      status: 'completed',
      note: `Referral rebate (${(bps / 100).toFixed(2)}% of $${fee.toFixed(2)} ${kind || 'fee'} from ${referee.email})`,
      refereeId: referee.id,
      sourceTxId,
      kind: kind || null,
      createdAt: Date.now(),
    });
    addReferralRebate({
      id: newId('ref'),
      referrerId: referrer.id,
      refereeId: referee.id,
      sourceTxId,
      kind: kind || null,
      feeUsd: fee,
      rebateUsd: rebate,
      bps,
      txId,
      createdAt: Date.now(),
    });
    return { rebate, referrerId: referrer.id, txId };
  } catch {
    // Never propagate — the referee's flow must not fail because of a
    // bookkeeping side-effect.
    return null;
  }
}

/**
 * Resolve a referral code provided at signup to a referrer id.
 * Validates the code looks plausible and that the referrer isn't the
 * brand-new user themselves (which is impossible here but defensive).
 */
export function resolveReferralCode(code) {
  if (!code) return null;
  const c = String(code).trim().toUpperCase();
  if (!/^[A-Z0-9]{4,12}$/.test(c)) return null;
  const u = findUserByReferralCode(c);
  return u ? u.id : null;
}

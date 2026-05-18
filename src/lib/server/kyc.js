// KYC tier ladder + velocity-based withdrawal limits.
//
// Tier ladder (matches the problem statement A2 / B1):
//   Tier 0 — unverified email. No withdrawals at all.
//   Tier 1 — email verified + phone confirmed. ≤ $1,000 / day, $5,000 / 30 d.
//   Tier 2 — ID + selfie verified by admin. ≤ $25,000 / day, $100,000 / 30 d.
//   Tier 3 — proof of address + declared source of funds. Effectively unlimited
//            (we still apply a $1M/day sanity cap so an admin-side mistake
//            cannot cause an immediate drain).
//
// The "effective" tier is the minimum of:
//   - the admin-approved `kycTier` on the user record (default 0)
//   - one tier lower if `emailVerifiedAt` is missing (Tier-1 requires it)
//
// Velocity is computed against `transactions.json` (type === 'withdraw')
// summing `usdValue` over the relevant window. This keeps the rule
// straightforward to audit: every entry on the user's statement
// counted toward the cap that was in force when it was paid.

import { findUserById, listTransactions } from './store.js';

const DAY_MS = 24 * 60 * 60 * 1000;
const MONTH_MS = 30 * DAY_MS;

/**
 * Per-tier USD limits. `daily` and `monthly` are inclusive ceilings —
 * the next withdrawal must fit *under* them. Tier-0 is intentionally zero
 * so even a $1 attempted withdrawal is refused for an unverified user.
 */
export const TIER_LIMITS = Object.freeze({
  0: { daily: 0,         monthly: 0,         label: 'Tier 0 · unverified' },
  1: { daily: 1_000,     monthly: 5_000,     label: 'Tier 1 · email + phone' },
  2: { daily: 25_000,    monthly: 100_000,   label: 'Tier 2 · ID verified' },
  3: { daily: 1_000_000, monthly: 5_000_000, label: 'Tier 3 · enhanced' },
});

/**
 * Returns the user's effective KYC tier — capped by their email-verified
 * state so a stale `kycTier=2` on an unverified record cannot leak through.
 *
 * @param {object} user
 * @returns {0|1|2|3}
 */
export function effectiveTier(user) {
  if (!user) return 0;
  let tier = Number.isInteger(user.kycTier) ? user.kycTier : 0;
  if (tier < 0) tier = 0;
  if (tier > 3) tier = 3;
  // Tier-1 and above require a verified email; degrade silently otherwise.
  if (tier >= 1 && !user.emailVerifiedAt) tier = 0;
  return tier;
}

/**
 * Returns the user's KYC tier label (e.g. "Tier 1 · email + phone").
 */
export function tierLabel(user) {
  return TIER_LIMITS[effectiveTier(user)].label;
}

/**
 * Sum of `usdValue` across the user's completed (or in-flight) withdrawal
 * transactions over the last `windowMs` milliseconds. Cancelled / rejected
 * withdrawals are excluded.
 *
 * @param {string} userId
 * @param {number} windowMs
 * @returns {number}
 */
export function withdrawnUsdSince(userId, windowMs) {
  if (!userId || !windowMs) return 0;
  const cutoff = Date.now() - windowMs;
  return listTransactions().reduce((sum, t) => {
    if (t.userId !== userId) return sum;
    if (t.type !== 'withdraw') return sum;
    if (t.status === 'cancelled' || t.status === 'rejected' || t.status === 'reversed') return sum;
    if ((t.createdAt || 0) < cutoff) return sum;
    return sum + (Number(t.usdValue) || 0);
  }, 0);
}

/**
 * Returns a serialisable summary of the user's current KYC posture:
 *   { tier, label, daily: { used, limit, remaining }, monthly: {...} }
 */
export function kycSummary(user) {
  if (!user) {
    const t = TIER_LIMITS[0];
    return { tier: 0, label: t.label,
             daily:   { used: 0, limit: t.daily,   remaining: 0 },
             monthly: { used: 0, limit: t.monthly, remaining: 0 } };
  }
  const tier = effectiveTier(user);
  const lim = TIER_LIMITS[tier];
  const day = withdrawnUsdSince(user.id, DAY_MS);
  const month = withdrawnUsdSince(user.id, MONTH_MS);
  return {
    tier,
    label: lim.label,
    daily:   { used: day,   limit: lim.daily,   remaining: Math.max(0, lim.daily   - day)   },
    monthly: { used: month, limit: lim.monthly, remaining: Math.max(0, lim.monthly - month) },
  };
}

/**
 * Throws an Error with .status if the user is not allowed to withdraw the
 * given USD amount. Otherwise returns the kycSummary (callers may log it).
 *
 * @param {object} user
 * @param {number} usdAmount
 */
export function assertWithdrawAllowed(user, usdAmount) {
  const u = typeof user === 'string' ? findUserById(user) : user;
  if (!u) {
    const err = new Error('User not found');
    err.status = 404;
    throw err;
  }
  const usd = Number(usdAmount) || 0;
  if (usd < 0) {
    const err = new Error('Invalid withdrawal amount');
    err.status = 400;
    throw err;
  }
  const summary = kycSummary(u);
  if (summary.tier === 0) {
    const err = new Error('Withdrawals require KYC verification. Submit your phone number to reach Tier 1.');
    err.status = 403;
    throw err;
  }
  if (usd > summary.daily.remaining) {
    const err = new Error(
      `Daily withdrawal limit reached for ${summary.label}. Used $${summary.daily.used.toFixed(2)} of $${summary.daily.limit.toLocaleString()}. Upgrade your KYC tier to raise this cap.`,
    );
    err.status = 403;
    throw err;
  }
  if (usd > summary.monthly.remaining) {
    const err = new Error(
      `30-day withdrawal limit reached for ${summary.label}. Used $${summary.monthly.used.toFixed(2)} of $${summary.monthly.limit.toLocaleString()}. Upgrade your KYC tier to raise this cap.`,
    );
    err.status = 403;
    throw err;
  }
  return summary;
}

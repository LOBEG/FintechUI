// Sandbox on-ramp. Brand-new users have empty balances, so the invest
// CTA on the dashboard would always error until an admin manually
// credits them. When SANDBOX_ONRAMP_USDT is set to a positive number,
// each user can call this endpoint *once* to receive that amount of
// USDT (faucet-style) so they can try the invest flow end-to-end.
//
// This is OFF by default - production deployments should leave the env
// var unset so real-money flows remain admin-gated.
import { NextResponse } from 'next/server';
import { requireUser } from '@/lib/server/auth.js';
import {
  upsertUser,
  addTransaction,
  appendAudit,
} from '@/lib/server/store.js';
import { rateLimitOrJson } from '@/lib/server/rateLimit.js';
import crypto from 'node:crypto';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function sandboxAmount() {
  const v = parseFloat(process.env.SANDBOX_ONRAMP_USDT || '0');
  return isFinite(v) && v > 0 ? Math.min(v, 10000) : 0;
}

export async function GET() {
  const amount = sandboxAmount();
  return NextResponse.json({
    enabled: amount > 0,
    amount,
  });
}

export async function POST(req) {
  try {
    const limited = rateLimitOrJson(req, { key: 'sandbox', max: 3, windowMs: 60_000 });
    if (limited) return limited;
    const amount = sandboxAmount();
    if (amount <= 0) {
      return NextResponse.json({
        error: 'Sandbox on-ramp is not enabled on this deployment.',
      }, { status: 403 });
    }
    const user = await requireUser();
    if (user.accountStatus === 'disabled') {
      return NextResponse.json({ error: 'Account is disabled.' }, { status: 403 });
    }
    if (user.sandboxClaimedAt) {
      return NextResponse.json({
        error: 'Sandbox credit already claimed on this account.',
      }, { status: 409 });
    }
    user.balances = user.balances || {};
    user.balances.USDT = (parseFloat(user.balances.USDT) || 0) + amount;
    user.sandboxClaimedAt = Date.now();
    upsertUser(user);

    const tx = {
      id: `tx_${Date.now().toString(36)}_${crypto.randomBytes(4).toString('hex')}`,
      userId: user.id,
      type: 'credit',
      symbol: 'USDT',
      amount,
      price: 1,
      usdValue: amount,
      status: 'completed',
      note: 'Sandbox on-ramp (test funds)',
      createdAt: Date.now(),
      sandbox: true,
    };
    addTransaction(tx);
    appendAudit({
      actorId: user.id,
      actorEmail: user.email,
      action: 'sandbox.claim',
      target: user.email,
      payload: { amount },
    });

    return NextResponse.json({ ok: true, transaction: tx, balances: user.balances });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: err.status || 500 });
  }
}

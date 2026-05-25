// Referral programme dashboard endpoint.
//
//   GET /api/referral - returns the caller's code, the share URL, the
//                       list of referees (anonymised email), the total
//                       rebated to date, and the rebate rate.
import { NextResponse } from 'next/server';
import { requireUser } from '@/lib/server/auth.js';
import {
  ensureReferralCode,
  rebateRateInfo,
} from '@/lib/server/referral.js';
import { refereesOf, referralRebatesForReferrer } from '@/lib/server/store.js';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function maskEmail(email) {
  if (!email || typeof email !== 'string') return '';
  const [local, domain] = email.split('@');
  if (!domain) return email;
  const head = local.slice(0, 2);
  return `${head}${'•'.repeat(Math.max(1, local.length - 2))}@${domain}`;
}

export async function GET(req) {
  try {
    const user = await requireUser();
    const code = ensureReferralCode(user);
    const referees = refereesOf(user.id).map((u) => ({
      id: u.id,
      email: maskEmail(u.email),
      referredAt: u.referredAt || u.createdAt || null,
    }));
    const rebates = referralRebatesForReferrer(user.id);
    const totalRebated = Math.round(
      rebates.reduce((acc, r) => acc + (Number(r.rebateUsd) || 0), 0) * 100,
    ) / 100;
    // Build a share URL relative to the request origin so it works in
    // both dev and prod without a hard-coded domain.
    const origin = (() => {
      try {
        return new URL(req.url).origin;
      } catch {
        return '';
      }
    })();
    const shareUrl = origin ? `${origin}/signup?ref=${encodeURIComponent(code)}` : `/signup?ref=${encodeURIComponent(code)}`;
    return NextResponse.json({
      code,
      shareUrl,
      referees,
      refereeCount: referees.length,
      totalRebated,
      rebateBps: rebateRateInfo().bps,
      recent: rebates.slice(0, 20).map((r) => ({
        id: r.id,
        kind: r.kind,
        feeUsd: r.feeUsd,
        rebateUsd: r.rebateUsd,
        createdAt: r.createdAt,
      })),
    });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: err.status || 500 });
  }
}

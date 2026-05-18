// User-facing KYC endpoint.
//   GET  /api/kyc — current tier + 24 h / 30 d usage vs limits + any pending submission
//   POST /api/kyc — submit a Tier-1/2/3 upgrade request
//
// The payload shape varies by tier; the route validates the minimum
// required fields and stores the submission for admin review. We never
// approve automatically — that would defeat the point of KYC.
import { NextResponse } from 'next/server';
import { requireUser, newId } from '@/lib/server/auth.js';
import {
  addKycSubmission,
  pendingKycForUser,
  appendAudit,
  upsertUser,
  findUserById,
  addNotification,
} from '@/lib/server/store.js';
import { kycSummary, effectiveTier } from '@/lib/server/kyc.js';
import { rateLimitOrJson } from '@/lib/server/rateLimit.js';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const user = await requireUser();
    const summary = kycSummary(user);
    const pending = pendingKycForUser(user.id);
    return NextResponse.json({
      ok: true,
      summary,
      emailVerifiedAt: user.emailVerifiedAt || null,
      pendingSubmission: pending
        ? { id: pending.id, requestedTier: pending.requestedTier, createdAt: pending.createdAt }
        : null,
    });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: err.status || 500 });
  }
}

export async function POST(req) {
  try {
    const limited = rateLimitOrJson(req, { key: 'kyc.submit', max: 5, windowMs: 60_000 });
    if (limited) return limited;
    const user = await requireUser();
    const body = await req.json().catch(() => ({}));
    const requestedTier = parseInt(body.requestedTier, 10);
    if (![1, 2, 3].includes(requestedTier)) {
      return NextResponse.json({ error: 'requestedTier must be 1, 2, or 3' }, { status: 400 });
    }
    const current = effectiveTier(user);
    if (requestedTier <= current) {
      return NextResponse.json({ error: `You are already at Tier ${current} or higher.` }, { status: 400 });
    }
    if (requestedTier > current + 1) {
      return NextResponse.json({ error: `Submit Tier ${current + 1} first before requesting Tier ${requestedTier}.` }, { status: 400 });
    }
    // Tier-1 requires a verified email (the Tier-0 floor is precisely
    // "anyone can sign up") — refuse with a clear next step.
    if (requestedTier >= 1 && !user.emailVerifiedAt) {
      return NextResponse.json({ error: 'Verify your email first before applying for KYC.' }, { status: 400 });
    }
    if (pendingKycForUser(user.id)) {
      return NextResponse.json({ error: 'You already have a pending KYC submission. Wait for review.' }, { status: 409 });
    }
    const payload = {};
    if (requestedTier === 1) {
      const phone = String(body.phone || '').trim().slice(0, 32);
      if (!/^[+]?[0-9 ()\-]{7,}$/.test(phone)) {
        return NextResponse.json({ error: 'Provide a valid phone number.' }, { status: 400 });
      }
      payload.phone = phone;
    } else if (requestedTier === 2) {
      const idDocType = String(body.idDocType || '').trim().slice(0, 40);
      const idDocRef = String(body.idDocRef || '').trim().slice(0, 200);
      const dob = String(body.dob || '').trim().slice(0, 20);
      const country = String(body.country || '').trim().slice(0, 60);
      if (!idDocType || !idDocRef || !dob || !country) {
        return NextResponse.json({ error: 'idDocType, idDocRef, dob and country are required for Tier 2.' }, { status: 400 });
      }
      payload.idDocType = idDocType;
      payload.idDocRef = idDocRef;
      payload.dob = dob;
      payload.country = country;
    } else if (requestedTier === 3) {
      const address = String(body.address || '').trim().slice(0, 300);
      const sourceOfFunds = String(body.sourceOfFunds || '').trim().slice(0, 500);
      if (!address || !sourceOfFunds) {
        return NextResponse.json({ error: 'Residential address and source-of-funds declaration required for Tier 3.' }, { status: 400 });
      }
      payload.address = address;
      payload.sourceOfFunds = sourceOfFunds;
    }
    const sub = {
      id: newId('kyc'),
      userId: user.id,
      requestedTier,
      status: 'pending',
      payload,
      createdAt: Date.now(),
    };
    addKycSubmission(sub);
    appendAudit({
      actorId: user.id,
      actorEmail: user.email,
      action: 'kyc.submit',
      target: { submissionId: sub.id, requestedTier },
    });
    // Surface in the admin queue via an in-app notification (admins see
    // broadcast and global notifications).
    try {
      addNotification({
        id: newId('ntf'),
        userId: null,
        kind: 'kyc',
        title: `KYC Tier ${requestedTier} submission`,
        body: `${user.email} requested Tier ${requestedTier} review.`,
        createdAt: Date.now(),
      });
    } catch (_) {}
    return NextResponse.json({ ok: true, submission: { id: sub.id, requestedTier, status: 'pending' } });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: err.status || 500 });
  }
}

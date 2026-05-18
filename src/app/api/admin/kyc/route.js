// Admin KYC queue.
//   GET  /api/admin/kyc — list pending submissions (oldest first) + recently
//                         reviewed (newest first) for context
//   POST /api/admin/kyc — approve or reject a submission. Approving bumps
//                         the user's `kycTier` to the requested tier.
import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/server/auth.js';
import {
  listKycSubmissions,
  findKycSubmission,
  updateKycSubmission,
  findUserById,
  upsertUser,
  appendAudit,
  addNotification,
} from '@/lib/server/store.js';
import { newId } from '@/lib/server/auth.js';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    await requireAdmin();
    const all = listKycSubmissions();
    const pending = all
      .filter((s) => s.status === 'pending')
      .sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0))
      .map((s) => withUserEmail(s));
    const recent = all
      .filter((s) => s.status !== 'pending')
      .slice(0, 50)
      .map((s) => withUserEmail(s));
    return NextResponse.json({ ok: true, pending, recent });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: err.status || 500 });
  }
}

export async function POST(req) {
  try {
    const admin = await requireAdmin();
    const body = await req.json().catch(() => ({}));
    const id = String(body.id || '');
    const decision = String(body.decision || '');
    const note = String(body.note || '').slice(0, 500);
    if (!id || !['approve', 'reject'].includes(decision)) {
      return NextResponse.json({ error: 'id and decision (approve|reject) required' }, { status: 400 });
    }
    const sub = findKycSubmission(id);
    if (!sub) return NextResponse.json({ error: 'Submission not found' }, { status: 404 });
    if (sub.status !== 'pending') {
      return NextResponse.json({ error: `Already ${sub.status}` }, { status: 409 });
    }
    const user = findUserById(sub.userId);
    if (!user) return NextResponse.json({ error: 'User no longer exists' }, { status: 404 });
    const now = Date.now();
    if (decision === 'approve') {
      user.kycTier = sub.requestedTier;
      user.kycApprovedAt = now;
      upsertUser(user);
    }
    updateKycSubmission(id, {
      status: decision === 'approve' ? 'approved' : 'rejected',
      reviewedAt: now,
      reviewedBy: admin.id,
      reviewNote: note || null,
    });
    appendAudit({
      actorId: admin.id,
      actorEmail: admin.email,
      action: `kyc.${decision}`,
      target: { submissionId: id, userId: sub.userId, requestedTier: sub.requestedTier },
      payload: note ? { note } : null,
    });
    // Notify the user in-app so they don't have to refresh email.
    try {
      addNotification({
        id: newId('ntf'),
        userId: sub.userId,
        kind: 'kyc',
        title: decision === 'approve'
          ? `KYC Tier ${sub.requestedTier} approved`
          : `KYC Tier ${sub.requestedTier} rejected`,
        body: decision === 'approve'
          ? `Your account is now Tier ${sub.requestedTier}. New withdrawal limits apply immediately.`
          : (note || 'See your account page for details.'),
        createdAt: now,
      });
    } catch (_) {}
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: err.status || 500 });
  }
}

function withUserEmail(s) {
  const u = findUserById(s.userId);
  return { ...s, userEmail: u?.email || null };
}

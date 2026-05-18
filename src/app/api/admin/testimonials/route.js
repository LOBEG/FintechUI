// Admin listing + moderation of testimonials.
import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/server/auth.js';
import {
  listTestimonials,
  updateTestimonial,
  deleteTestimonial,
  appendAudit,
} from '@/lib/server/store.js';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    await requireAdmin();
    return NextResponse.json({ testimonials: listTestimonials() });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: err.status || 500 });
  }
}

export async function PATCH(req) {
  try {
    const admin = await requireAdmin();
    const body = await req.json().catch(() => ({}));
    const id = String(body.id || '');
    const status = String(body.status || '');
    if (!id || !['approved', 'rejected', 'pending'].includes(status)) {
      return NextResponse.json({ error: 'Bad request' }, { status: 400 });
    }
    const t = updateTestimonial(id, { status, moderatedAt: Date.now(), moderatedBy: admin.email });
    if (!t) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    appendAudit({
      actorId: admin.id,
      actorEmail: admin.email,
      action: 'testimonial.moderate',
      target: id,
      payload: { status },
    });
    return NextResponse.json({ ok: true, testimonial: t });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: err.status || 500 });
  }
}

export async function DELETE(req) {
  try {
    const admin = await requireAdmin();
    const body = await req.json().catch(() => ({}));
    const id = String(body.id || '');
    if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });
    deleteTestimonial(id);
    appendAudit({
      actorId: admin.id,
      actorEmail: admin.email,
      action: 'testimonial.delete',
      target: id,
    });
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: err.status || 500 });
  }
}

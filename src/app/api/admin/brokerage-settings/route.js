import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/server/auth.js';
import { getBrokerageSettings, saveBrokerageSettings, appendAudit } from '@/lib/server/store.js';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    await requireAdmin();
    return NextResponse.json({ settings: getBrokerageSettings() });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: err.status || 500 });
  }
}

export async function PATCH(req) {
  try {
    const admin = await requireAdmin();
    const body = await req.json().catch(() => ({}));
    const patch = {};
    if (body.integrations && typeof body.integrations === 'object') patch.integrations = body.integrations;
    if (body.classes && typeof body.classes === 'object') patch.classes = body.classes;
    if (body.limits && typeof body.limits === 'object') patch.limits = body.limits;
    const next = saveBrokerageSettings(patch);
    appendAudit({
      actorId: admin.id,
      actorEmail: admin.email,
      action: 'brokerage.settings.update',
      payload: patch,
    });
    return NextResponse.json({ ok: true, settings: next });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: err.status || 500 });
  }
}

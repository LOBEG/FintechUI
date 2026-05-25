import { NextResponse } from 'next/server';
import { requireUser } from '@/lib/server/auth.js';
import { setPreferredBroker } from '@/lib/server/store.js';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const ALLOWED = ['prime', 'crypto', 'multiAsset'];

export async function GET() {
  try {
    const user = await requireUser();
    return NextResponse.json({ preferredBroker: user.preferredBroker || 'prime' });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: err.status || 500 });
  }
}

export async function PATCH(req) {
  try {
    const user = await requireUser();
    const body = await req.json().catch(() => ({}));
    const broker = String(body.broker || '').trim();
    if (!ALLOWED.includes(broker)) {
      return NextResponse.json({ error: 'Invalid broker' }, { status: 400 });
    }
    setPreferredBroker(user.id, broker);
    return NextResponse.json({ ok: true, preferredBroker: broker });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: err.status || 500 });
  }
}

import { NextResponse } from 'next/server';
import { requireUser } from '@/lib/server/auth.js';
import { getBrokerageSettings } from '@/lib/server/store.js';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    await requireUser();
    return NextResponse.json({ settings: getBrokerageSettings() });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: err.status || 500 });
  }
}

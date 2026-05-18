// Read the admin audit log. Append-only and hash-chained at write time;
// this endpoint returns the most recent N entries together with the
// previous-hash so an auditor can verify continuity client-side.
import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/server/auth.js';
import { listAudit } from '@/lib/server/store.js';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req) {
  try {
    await requireAdmin();
    const url = new URL(req.url);
    const limit = Math.min(500, Math.max(1, parseInt(url.searchParams.get('limit') || '200', 10)));
    return NextResponse.json({ entries: listAudit().slice(0, limit) });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: err.status || 500 });
  }
}

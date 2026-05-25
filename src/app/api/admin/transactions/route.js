import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/server/auth.js';
import { listTransactions } from '@/lib/server/store.js';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    await requireAdmin();
    return NextResponse.json({ transactions: listTransactions().slice(0, 200) });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: err.status || 500 });
  }
}

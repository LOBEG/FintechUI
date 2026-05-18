import { NextResponse } from 'next/server';
import { requireUser } from '@/lib/server/auth.js';
import { transactionsForUser } from '@/lib/server/store.js';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const user = await requireUser();
    return NextResponse.json({ transactions: transactionsForUser(user.id) });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: err.status || 500 });
  }
}

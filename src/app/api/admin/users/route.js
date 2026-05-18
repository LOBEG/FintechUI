import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/server/auth.js';
import { listUsers } from '@/lib/server/store.js';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    await requireAdmin();
    const users = listUsers().map((u) => ({
      id: u.id,
      email: u.email,
      name: u.name,
      isAdmin: !!u.isAdmin,
      createdAt: u.createdAt,
      balances: u.balances || {},
      accountStatus: u.accountStatus || 'active',
      statusReason: u.statusReason || null,
    }));
    return NextResponse.json({ users });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: err.status || 500 });
  }
}

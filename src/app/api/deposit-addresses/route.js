// Authenticated users can read the admin-configured deposit addresses
// so they know where to send funds. Addresses are managed by admins via
// /api/admin/deposit-addresses or the Telegram bot.
import { NextResponse } from 'next/server';
import { requireUser } from '@/lib/server/auth.js';
import { listDepositAddresses } from '@/lib/server/store.js';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    await requireUser();
    const all = listDepositAddresses();
    // Return as a sorted array for the UI.
    const rows = Object.values(all).sort((a, b) => a.symbol.localeCompare(b.symbol));
    return NextResponse.json({ addresses: rows });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: err.status || 500 });
  }
}

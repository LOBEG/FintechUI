// Admin/broker view of every support ticket on the platform.
//
//   GET /api/admin/support?status=open|awaiting_user|answered|closed
//
// The list is enriched with the user's email so the desk doesn't need a
// second lookup before triaging.
import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/server/auth.js';
import { listTickets, findUserById } from '@/lib/server/store.js';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const ALLOWED_STATUS = new Set(['open', 'awaiting_user', 'answered', 'closed']);

export async function GET(req) {
  try {
    await requireAdmin();
    const url = new URL(req.url);
    const status = url.searchParams.get('status');
    let items = listTickets();
    if (status && ALLOWED_STATUS.has(status)) {
      items = items.filter((t) => t.status === status);
    }
    // Most recently active tickets first.
    items = items
      .slice()
      .sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0))
      .map((t) => {
        const u = findUserById(t.userId);
        return {
          ...t,
          userEmail: u ? u.email : null,
          userName: u ? u.name : null,
        };
      });
    return NextResponse.json({ items });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: err.status || 500 });
  }
}

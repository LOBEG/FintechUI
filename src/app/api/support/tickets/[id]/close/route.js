// Close an open support ticket from the user side. Admins can also
// close from /api/admin/support/[id]/status.
import { NextResponse } from 'next/server';
import { requireUser } from '@/lib/server/auth.js';
import { findTicket, updateTicket } from '@/lib/server/store.js';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(_req, { params }) {
  try {
    const user = await requireUser();
    const id = (await params)?.id;
    const ticket = findTicket(id);
    if (!ticket || ticket.userId !== user.id) {
      return NextResponse.json({ error: 'Ticket not found' }, { status: 404 });
    }
    if (ticket.status === 'closed') return NextResponse.json({ ticket });
    const updated = updateTicket(ticket.id, { status: 'closed', closedAt: Date.now() });
    return NextResponse.json({ ticket: updated });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: err.status || 500 });
  }
}

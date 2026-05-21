// Single-ticket detail endpoint for end users.
//
//   GET /api/support/tickets/[id] - full thread for one ticket
//
// The caller must own the ticket; admin/broker access happens through
// /api/admin/support/* instead so this route can stay tight.
import { NextResponse } from 'next/server';
import { requireUser } from '@/lib/server/auth.js';
import { findTicket } from '@/lib/server/store.js';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(_req, { params }) {
  try {
    const user = await requireUser();
    const id = (await params)?.id;
    const ticket = findTicket(id);
    if (!ticket || ticket.userId !== user.id) {
      return NextResponse.json({ error: 'Ticket not found' }, { status: 404 });
    }
    return NextResponse.json({ ticket });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: err.status || 500 });
  }
}

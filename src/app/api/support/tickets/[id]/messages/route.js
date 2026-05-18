// Append a user-side reply to an existing ticket.
//
//   POST /api/support/tickets/[id]/messages
//     body: { body: string }
//
// Re-opens a ticket that was previously 'answered' or 'awaiting_user' —
// the desk treats anything the user touches as needing attention again.
import { NextResponse } from 'next/server';
import { requireUser, newId } from '@/lib/server/auth.js';
import { findTicket, addTicketMessage, updateTicket } from '@/lib/server/store.js';
import { rateLimitOrJson } from '@/lib/server/rateLimit.js';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req, { params }) {
  try {
    const user = await requireUser();
    const id = (await params)?.id;
    const ticket = findTicket(id);
    if (!ticket || ticket.userId !== user.id) {
      return NextResponse.json({ error: 'Ticket not found' }, { status: 404 });
    }
    if (ticket.status === 'closed') {
      return NextResponse.json({ error: 'Ticket is closed. Please open a new one.' }, { status: 400 });
    }
    const limited = rateLimitOrJson(req, `support:msg:${user.id}`, { points: 30, windowMs: 60_000 });
    if (limited) return limited;
    const body = await req.json().catch(() => ({}));
    const text = String(body.body || '').trim().slice(0, 4000);
    if (!text) return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    addTicketMessage(ticket.id, {
      id: newId('msg'),
      authorId: user.id,
      authorRole: 'user',
      body: text,
      createdAt: Date.now(),
    });
    // Anything the user adds re-opens the thread for the desk.
    const updated = updateTicket(ticket.id, { status: 'open' });
    return NextResponse.json({ ticket: updated });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: err.status || 500 });
  }
}

// Admin status transitions for a ticket. Useful for triage actions
// like marking a ticket 'awaiting_user' (waiting on more info) without
// posting a public reply, or force-closing a stale thread.
//
//   POST /api/admin/support/[id]/status
//     body: { status: 'open'|'awaiting_user'|'answered'|'closed' }
import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/server/auth.js';
import { findTicket, updateTicket, appendAudit } from '@/lib/server/store.js';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const ALLOWED = new Set(['open', 'awaiting_user', 'answered', 'closed']);

export async function POST(req, { params }) {
  try {
    const admin = await requireAdmin();
    const id = (await params)?.id;
    const ticket = findTicket(id);
    if (!ticket) return NextResponse.json({ error: 'Ticket not found' }, { status: 404 });
    const body = await req.json().catch(() => ({}));
    const status = String(body.status || '');
    if (!ALLOWED.has(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
    }
    const patch = { status };
    if (status === 'closed') patch.closedAt = Date.now();
    const updated = updateTicket(ticket.id, patch);
    appendAudit({
      actorId: admin.id,
      actorEmail: admin.email,
      action: 'support.status',
      target: { ticketId: ticket.id, userId: ticket.userId },
      payload: { status, from: ticket.status },
    });
    return NextResponse.json({ ticket: updated });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: err.status || 500 });
  }
}

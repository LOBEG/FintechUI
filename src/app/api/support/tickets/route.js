// Support tickets endpoint for end users.
//
//   GET  /api/support/tickets         - list the caller's tickets
//   POST /api/support/tickets         - open a new ticket
//                                        body: { subject, body, priority? }
//
// Tickets always belong to one user. Admin replies come back via the
// notification centre, so this endpoint never needs to surface staff
// internals.
import { NextResponse } from 'next/server';
import { requireUser, newId } from '@/lib/server/auth.js';
import { addTicket, ticketsForUser } from '@/lib/server/store.js';
import { rateLimitOrJson } from '@/lib/server/rateLimit.js';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const ALLOWED_PRIORITY = new Set(['low', 'normal', 'high']);

export async function GET() {
  try {
    const user = await requireUser();
    const items = ticketsForUser(user.id)
      .slice()
      .sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));
    return NextResponse.json({ items });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: err.status || 500 });
  }
}

export async function POST(req) {
  try {
    const user = await requireUser();
    const limited = rateLimitOrJson(req, `support:create:${user.id}`, { points: 6, windowMs: 60_000 });
    if (limited) return limited;
    const body = await req.json().catch(() => ({}));
    const subject = String(body.subject || '').trim().slice(0, 200);
    const firstMessage = String(body.body || '').trim().slice(0, 4000);
    const priority = ALLOWED_PRIORITY.has(body.priority) ? body.priority : 'normal';
    if (!subject) return NextResponse.json({ error: 'Subject is required' }, { status: 400 });
    if (!firstMessage) return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    const now = Date.now();
    const ticket = {
      id: newId('tkt'),
      userId: user.id,
      subject,
      priority,
      status: 'open',
      createdAt: now,
      updatedAt: now,
      messages: [{
        id: newId('msg'),
        authorId: user.id,
        authorRole: 'user',
        body: firstMessage,
        createdAt: now,
      }],
    };
    addTicket(ticket);
    return NextResponse.json({ ticket });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: err.status || 500 });
  }
}

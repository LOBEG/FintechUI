// Admin/broker reply to a support ticket.
//
//   POST /api/admin/support/[id]/reply
//     body: { body: string }
//
// Side effects:
// - Appends the reply to the ticket thread, marks the ticket 'answered'.
// - Pushes a notification into the user's notification centre so the
//   reply shows up in the bell-icon dropdown alongside trade alerts.
// - Sends a courtesy email so off-platform users get pinged too.
// - Writes an audit-log entry — replies are admin actions.
import { NextResponse } from 'next/server';
import { requireAdmin, newId } from '@/lib/server/auth.js';
import {
  findTicket,
  addTicketMessage,
  updateTicket,
  addNotification,
  findUserById,
  appendAudit,
} from '@/lib/server/store.js';
import { sendEmail } from '@/lib/server/email.js';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function escapeHtml(s) {
  return String(s || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

export async function POST(req, { params }) {
  try {
    const admin = await requireAdmin();
    const id = (await params)?.id;
    const ticket = findTicket(id);
    if (!ticket) return NextResponse.json({ error: 'Ticket not found' }, { status: 404 });
    const body = await req.json().catch(() => ({}));
    const text = String(body.body || '').trim().slice(0, 4000);
    if (!text) return NextResponse.json({ error: 'Reply body is required' }, { status: 400 });
    addTicketMessage(ticket.id, {
      id: newId('msg'),
      authorId: admin.id,
      authorEmail: admin.email,
      authorRole: 'staff',
      body: text,
      createdAt: Date.now(),
    });
    const updated = updateTicket(ticket.id, { status: 'answered', lastStaffReplyAt: Date.now() });
    // Surface the reply in the user's notification centre.
    addNotification({
      id: newId('ntf'),
      userId: ticket.userId,
      kind: 'support_reply',
      title: `Support: ${ticket.subject}`,
      body: text.slice(0, 240),
      ticketId: ticket.id,
      createdAt: Date.now(),
    });
    // Best-effort email fan-out — failure here must not roll back the reply.
    try {
      const u = findUserById(ticket.userId);
      if (u && u.email) {
        const safeSubject = escapeHtml(ticket.subject);
        const safeBody = escapeHtml(text).replace(/\n/g, '<br/>');
        await sendEmail({
          to: u.email,
          subject: `AurumX support reply — ${ticket.subject}`,
          html: `<p>Hi ${escapeHtml(u.name || u.email)},</p>
<p>Our support team has replied to your ticket <strong>${safeSubject}</strong>:</p>
<blockquote style="border-left:3px solid #ccc;padding:0 12px;color:#444">${safeBody}</blockquote>
<p>You can reply from the support panel on your dashboard.</p>`,
          text: `Our support team has replied to your ticket "${ticket.subject}":\n\n${text}\n\nReply from your dashboard.`,
        });
      }
    } catch (_) { /* ignore */ }
    appendAudit({
      actorId: admin.id,
      actorEmail: admin.email,
      action: 'support.reply',
      target: { ticketId: ticket.id, userId: ticket.userId },
      payload: { bodyLen: text.length },
    });
    return NextResponse.json({ ticket: updated });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: err.status || 500 });
  }
}

// Per-user admin notes — free-form context the desk records against a
// user account (calls, AML observations, "asked about X on DD/MM").
//
//   GET  /api/admin/users/[id]/notes        — list notes for one user
//   POST /api/admin/users/[id]/notes        — append a note
//                                             body: { body: string }
//
// Notes are append-only by design so the trail is never silently
// rewritten — see store.addUserNote / notesForUser.
import { NextResponse } from 'next/server';
import { requireAdmin, newId } from '@/lib/server/auth.js';
import {
  findUserById,
  addUserNote,
  notesForUser,
  appendAudit,
} from '@/lib/server/store.js';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(_req, { params }) {
  try {
    await requireAdmin();
    const userId = (await params)?.id;
    if (!findUserById(userId)) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    const items = notesForUser(userId)
      .slice()
      .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
    return NextResponse.json({ items });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: err.status || 500 });
  }
}

export async function POST(req, { params }) {
  try {
    const admin = await requireAdmin();
    const userId = (await params)?.id;
    const user = findUserById(userId);
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });
    const body = await req.json().catch(() => ({}));
    const text = String(body.body || '').trim().slice(0, 2000);
    if (!text) return NextResponse.json({ error: 'Note body is required' }, { status: 400 });
    const note = {
      id: newId('note'),
      userId,
      authorId: admin.id,
      authorEmail: admin.email,
      body: text,
      createdAt: Date.now(),
    };
    addUserNote(note);
    appendAudit({
      actorId: admin.id,
      actorEmail: admin.email,
      action: 'user.note.add',
      target: { userId },
      payload: { bodyLen: text.length },
    });
    return NextResponse.json({ note });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: err.status || 500 });
  }
}

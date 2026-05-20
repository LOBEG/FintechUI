// User-facing notifications endpoint.
//
//   GET  /api/notifications        — list, newest first; broadcasts + own
//   POST /api/notifications/read   — mark id(s) read; body { ids: [...] | 'all' }
//
// Admins can push per-user notifications via /api/admin/* endpoints
// (e.g. the operations dashboard); broadcasts come from settings.

import { NextResponse } from 'next/server';
import { requireUser } from '@/lib/server/auth.js';
import {
  notificationsForUser,
  markNotificationsRead,
  getSettings,
} from '@/lib/server/store.js';
import { BRAND_NOTIFICATION_TITLE } from '@/lib/brand.js';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const user = await requireUser();
    const own = notificationsForUser(user.id);
    // Surface persistent broadcasts from settings (banner string) so the
    // bell shows them even before they've been turned into proper
    // notification rows.
    const settings = getSettings();
    const items = own.map((n) => ({
      id: n.id,
      kind: n.kind || 'info',
      title: n.title || '',
      body: n.body || '',
      createdAt: n.createdAt,
      read: n.userId === user.id ? !!n.readAt : !!(n.readBy && n.readBy[user.id]),
    }));
    if (settings.banner) {
      items.unshift({
        id: 'banner',
        kind: 'broadcast',
        title: BRAND_NOTIFICATION_TITLE,
        body: String(settings.banner),
        createdAt: Date.now(),
        read: false,
      });
    }
    const unread = items.filter((n) => !n.read).length;
    return NextResponse.json({ items, unread });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: err.status || 500 });
  }
}

export async function POST(req) {
  try {
    const user = await requireUser();
    const body = await req.json().catch(() => ({}));
    const ids = body.ids === 'all' ? 'all' : Array.isArray(body.ids) ? body.ids : [];
    markNotificationsRead(user.id, ids);
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: err.status || 500 });
  }
}

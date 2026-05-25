// Telegram webhook receiver. Telegram is required to send the secret in
// the X-Telegram-Bot-Api-Secret-Token header (configured via setWebhook).
// We also dedupe on the Telegram-supplied `update_id`: if an attacker
// captures a valid (secret-bearing) update and replays it, the dedup
// cache rejects the second delivery.
import { NextResponse } from 'next/server';
import { handleUpdate, expectedWebhookSecret, isTelegramConfigured } from '@/lib/server/telegram.js';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// In-memory ring of recently-seen update_ids. ~5k entries ≈ tens of
// minutes of legitimate traffic on a busy bot, plenty to defeat replays
// from a single capture. Survives only as long as the process - that's
// fine because a process restart resets the secret window.
const SEEN = new Set();
const SEEN_ORDER = [];
const SEEN_MAX = 5000;

function alreadySeen(updateId) {
  if (typeof updateId !== 'number' || !Number.isFinite(updateId)) return false;
  if (SEEN.has(updateId)) return true;
  SEEN.add(updateId);
  SEEN_ORDER.push(updateId);
  if (SEEN_ORDER.length > SEEN_MAX) {
    SEEN.delete(SEEN_ORDER.shift());
  }
  return false;
}

export async function POST(req) {
  if (!isTelegramConfigured()) {
    return NextResponse.json({ error: 'Telegram bot not configured' }, { status: 503 });
  }
  const expected = expectedWebhookSecret();
  if (expected) {
    const got = req.headers.get('x-telegram-bot-api-secret-token');
    if (got !== expected) {
      return NextResponse.json({ error: 'forbidden' }, { status: 403 });
    }
  }
  const update = await req.json().catch(() => null);
  if (!update) return NextResponse.json({ error: 'bad payload' }, { status: 400 });
  if (alreadySeen(update.update_id)) {
    // Acknowledge so Telegram doesn't keep retrying, but do not
    // re-process the update.
    return NextResponse.json({ ok: true, deduped: true });
  }
  await handleUpdate(update);
  // Telegram only checks for 200; ignore body.
  return NextResponse.json({ ok: true });
}

export async function GET() {
  return NextResponse.json({
    configured: isTelegramConfigured(),
    secretConfigured: !!expectedWebhookSecret(),
  });
}

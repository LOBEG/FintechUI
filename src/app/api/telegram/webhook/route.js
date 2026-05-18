// Telegram webhook receiver. Telegram is required to send the secret in
// the X-Telegram-Bot-Api-Secret-Token header (configured via setWebhook).
import { NextResponse } from 'next/server';
import { handleUpdate, expectedWebhookSecret, isTelegramConfigured } from '@/lib/server/telegram.js';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

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

// List / create / revoke withdrawal authorisation tokens.
import { NextResponse } from 'next/server';
import { requireAdmin, newCode, newId } from '@/lib/server/auth.js';
import {
  listTokens,
  addToken,
  updateToken,
  findUserByEmail,
} from '@/lib/server/store.js';
import { isSupportedSymbol } from '@/lib/server/prices.js';
import { sendWithdrawalTokenEmail } from '@/lib/server/email.js';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    await requireAdmin();
    return NextResponse.json({ tokens: listTokens() });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: err.status || 500 });
  }
}

export async function POST(req) {
  try {
    const admin = await requireAdmin();
    const body = await req.json().catch(() => ({}));
    const email = String(body.email || '').toLowerCase().trim();
    const symbol = body.symbol ? String(body.symbol).toUpperCase() : null;
    const maxAmount = body.maxAmount != null ? parseFloat(body.maxAmount) : null;
    if (symbol && !isSupportedSymbol(symbol)) {
      return NextResponse.json({ error: 'Unsupported asset' }, { status: 400 });
    }
    let userId = null;
    let user = null;
    if (email) {
      user = findUserByEmail(email);
      if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });
      userId = user.id;
    }
    const code = newCode(20);
    const tok = {
      id: newId('tok'),
      code,
      issuedBy: admin.id,
      userId,
      symbol,
      maxAmount: isFinite(maxAmount) ? maxAmount : null,
      status: 'active',
      createdAt: Date.now(),
    };
    addToken(tok);
    if (user) {
      try {
        await sendWithdrawalTokenEmail({ user, code, symbol, maxAmount });
      } catch (_) {}
    }
    return NextResponse.json({ ok: true, token: tok });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: err.status || 500 });
  }
}

export async function DELETE(req) {
  try {
    await requireAdmin();
    const body = await req.json().catch(() => ({}));
    const id = String(body.id || '');
    if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });
    const updated = updateToken(id, { status: 'revoked', revokedAt: Date.now() });
    if (!updated) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json({ ok: true, token: updated });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: err.status || 500 });
  }
}

// List / create / revoke withdrawal authorisation tokens.
import { NextResponse } from 'next/server';
import { requireAdmin, newCode, newId } from '@/lib/server/auth.js';
import {
  listTokens,
  addToken,
  updateToken,
  findUserByEmail,
  appendAudit,
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
    const expiresInHours = body.expiresInHours != null ? parseFloat(body.expiresInHours) : 24;
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
    const expiresAt =
      isFinite(expiresInHours) && expiresInHours > 0
        ? Date.now() + expiresInHours * 60 * 60 * 1000
        : null;
    const tok = {
      id: newId('tok'),
      code,
      issuedBy: admin.id,
      userId,
      symbol,
      maxAmount: isFinite(maxAmount) ? maxAmount : null,
      status: 'active',
      createdAt: Date.now(),
      expiresAt,
    };
    addToken(tok);
    appendAudit({
      actorId: admin.id,
      actorEmail: admin.email,
      action: 'token.issue',
      target: user ? user.email : null,
      payload: { tokenId: tok.id, symbol, maxAmount, expiresAt },
    });
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
    const admin = await requireAdmin();
    const body = await req.json().catch(() => ({}));
    const id = String(body.id || '');
    if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });
    const updated = updateToken(id, { status: 'revoked', revokedAt: Date.now() });
    if (!updated) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    appendAudit({
      actorId: admin.id,
      actorEmail: admin.email,
      action: 'token.revoke',
      target: updated.userId || null,
      payload: { tokenId: id },
    });
    return NextResponse.json({ ok: true, token: updated });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: err.status || 500 });
  }
}

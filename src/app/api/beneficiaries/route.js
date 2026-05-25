// Beneficiary address book - list, add, remove.
//
// Adding a beneficiary triggers an email confirmation. The user must
// click the link in the email AND then wait out a 48-hour cool-down
// before the address can receive funds. This is the standard pattern
// every major broker uses to defeat ATO-and-drain attacks.
//
// Sanctioned addresses (OFAC SDN list - see src/lib/server/sanctions.js)
// are rejected at create time and at withdraw time.
import { NextResponse } from 'next/server';
import crypto from 'node:crypto';
import { requireUser, newId, newCode } from '@/lib/server/auth.js';
import {
  addBeneficiary,
  updateBeneficiary,
  beneficiariesForUser,
  listBeneficiaries,
  appendAudit,
} from '@/lib/server/store.js';
import { isSupportedSymbol } from '@/lib/server/prices.js';
import { validateAddressForSymbol, requiresMemo, networksFor } from '@/lib/server/addressFormats.js';
import { sanctionsMatchReason } from '@/lib/server/sanctions.js';
import { sendEmail } from '@/lib/server/email.js';
import { rateLimitOrJson } from '@/lib/server/rateLimit.js';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const COOLDOWN_MS = 48 * 60 * 60 * 1000;

function hashToken(token) {
  return crypto.createHash('sha256').update(String(token)).digest('hex');
}

function publicView(b) {
  if (!b) return null;
  const now = Date.now();
  return {
    id: b.id,
    label: b.label,
    symbol: b.symbol,
    network: b.network || null,
    address: b.address,
    memo: b.memo || null,
    createdAt: b.createdAt,
    confirmedAt: b.confirmedAt || null,
    usableAt: b.usableAt || null,
    status: b.removedAt
      ? 'removed'
      : !b.confirmedAt
        ? 'pending-email'
        : (b.usableAt || 0) > now
          ? 'cooling-down'
          : 'active',
  };
}

export async function GET() {
  try {
    const user = await requireUser();
    const list = beneficiariesForUser(user.id)
      .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0))
      .map(publicView);
    return NextResponse.json({ ok: true, beneficiaries: list });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: err.status || 500 });
  }
}

export async function POST(req) {
  try {
    const limited = rateLimitOrJson(req, { key: 'beneficiaries.add', max: 10, windowMs: 60_000 });
    if (limited) return limited;
    const user = await requireUser();
    const body = await req.json().catch(() => ({}));
    const label = String(body.label || '').trim().slice(0, 60);
    const symbol = String(body.symbol || '').toUpperCase();
    const address = String(body.address || '').trim();
    const memo = body.memo ? String(body.memo).trim().slice(0, 100) : '';
    const network = body.network ? String(body.network).trim().slice(0, 50) : '';
    if (!label) {
      return NextResponse.json({ error: 'Label is required' }, { status: 400 });
    }
    if (!isSupportedSymbol(symbol)) {
      return NextResponse.json({ error: 'Unsupported asset' }, { status: 400 });
    }
    if (!address) {
      return NextResponse.json({ error: 'Address is required' }, { status: 400 });
    }
    const check = validateAddressForSymbol(symbol, address);
    if (!check.ok) {
      return NextResponse.json({ error: check.reason }, { status: 400 });
    }
    if (requiresMemo(symbol) && !memo) {
      return NextResponse.json({
        error: `${symbol} requires a memo / destination tag.`,
      }, { status: 400 });
    }
    const allowed = networksFor(symbol);
    if (network && allowed.length && !allowed.includes(network)) {
      return NextResponse.json({
        error: `Network "${network}" is not supported for ${symbol}.`,
      }, { status: 400 });
    }
    const sanctioned = sanctionsMatchReason(address);
    if (sanctioned) {
      appendAudit({
        actorId: user.id,
        actorEmail: user.email,
        action: 'beneficiary.sanctioned_reject',
        target: { symbol, address },
      });
      return NextResponse.json({ error: sanctioned }, { status: 400 });
    }
    // Prevent duplicates per (user, symbol, address, memo) - silently
    // returning the existing row would mask phishing edits, so be loud.
    const dup = beneficiariesForUser(user.id).find(
      (b) =>
        b.symbol === symbol &&
        b.address.toLowerCase() === address.toLowerCase() &&
        (b.memo || '') === memo,
    );
    if (dup) {
      return NextResponse.json({ error: 'Beneficiary already exists' }, { status: 409 });
    }
    const token = newCode(32);
    const b = {
      id: newId('ben'),
      userId: user.id,
      label,
      symbol,
      network: network || null,
      address,
      memo: memo || null,
      createdAt: Date.now(),
      confirmTokenHash: hashToken(token),
      confirmTokenExpiresAt: Date.now() + 24 * 60 * 60 * 1000,
    };
    addBeneficiary(b);
    const appUrl = process.env.APP_URL || '';
    const confirmUrl = `${appUrl}/api/beneficiaries/confirm?id=${encodeURIComponent(b.id)}&token=${encodeURIComponent(token)}`;
    const html = `<p>Confirm new withdrawal beneficiary "<b>${escapeHtml(label)}</b>" for ${symbol}:</p>` +
      `<p style="font-family:Menlo,monospace;background:#11172a;color:#fff;padding:8px;border-radius:6px">${escapeHtml(address)}${memo ? ` · memo ${escapeHtml(memo)}` : ''}${network ? ` · ${escapeHtml(network)}` : ''}</p>` +
      `<p><a href="${confirmUrl}" style="background:#06d6c4;color:#03121f;padding:10px 16px;border-radius:8px;text-decoration:none">Confirm beneficiary</a></p>` +
      `<p>Even after confirmation, this address cannot receive funds for <b>48 hours</b>. If you did not add this beneficiary, ignore this email and rotate your password immediately.</p>`;
    try {
      await sendEmail({
        to: user.email,
        subject: `Confirm new withdrawal beneficiary - ${symbol}`,
        html,
        text: `Confirm beneficiary "${label}" for ${symbol} at ${address}. Open ${confirmUrl}. A 48-hour cool-down applies after confirmation.`,
      });
    } catch (_) { /* outbox still captures it */ }
    appendAudit({
      actorId: user.id,
      actorEmail: user.email,
      action: 'beneficiary.add',
      target: { id: b.id, symbol, address, network: network || null },
    });
    return NextResponse.json({ ok: true, beneficiary: publicView(b) });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: err.status || 500 });
  }
}

export async function DELETE(req) {
  try {
    const user = await requireUser();
    const url = new URL(req.url);
    const id = url.searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });
    const all = listBeneficiaries();
    const found = all.find((b) => b.id === id && b.userId === user.id && !b.removedAt);
    if (!found) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    updateBeneficiary(id, { removedAt: Date.now() });
    appendAudit({
      actorId: user.id,
      actorEmail: user.email,
      action: 'beneficiary.remove',
      target: { id, symbol: found.symbol, address: found.address },
    });
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: err.status || 500 });
  }
}

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  }[c]));
}

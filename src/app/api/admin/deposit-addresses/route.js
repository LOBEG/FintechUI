import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/server/auth.js';
import {
  listDepositAddresses,
  setDepositAddress,
  removeDepositAddress,
  appendAudit,
} from '@/lib/server/store.js';
import { isSupportedSymbol } from '@/lib/server/prices.js';
import { validateAddressForSymbol } from '@/lib/server/addressFormats.js';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    await requireAdmin();
    return NextResponse.json({ addresses: listDepositAddresses() });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: err.status || 500 });
  }
}

export async function POST(req) {
  try {
    const admin = await requireAdmin();
    const body = await req.json().catch(() => ({}));
    const symbol = String(body.symbol || '').toUpperCase();
    const address = String(body.address || '').trim();
    const memo = body.memo ? String(body.memo).trim() : '';
    const network = body.network ? String(body.network).trim() : '';
    const label = body.label ? String(body.label).trim() : '';
    if (!isSupportedSymbol(symbol)) {
      return NextResponse.json({ error: 'Unsupported asset' }, { status: 400 });
    }
    if (!address) {
      return NextResponse.json({ error: 'Address is required' }, { status: 400 });
    }
    if (address.length > 200 || memo.length > 100 || network.length > 50 || label.length > 80) {
      return NextResponse.json({ error: 'Field too long' }, { status: 400 });
    }
    const check = validateAddressForSymbol(symbol, address);
    if (!check.ok) {
      return NextResponse.json({ error: check.reason }, { status: 400 });
    }
    const saved = setDepositAddress(symbol, {
      address,
      memo,
      network,
      label,
      updatedBy: admin.email,
    });
    appendAudit({
      actorId: admin.id,
      actorEmail: admin.email,
      action: 'address.set',
      target: symbol,
      payload: { address, memo, network, label },
    });
    return NextResponse.json({ ok: true, address: saved });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: err.status || 500 });
  }
}

export async function DELETE(req) {
  try {
    const admin = await requireAdmin();
    const body = await req.json().catch(() => ({}));
    const symbol = String(body.symbol || '').toUpperCase();
    if (!symbol) return NextResponse.json({ error: 'symbol required' }, { status: 400 });
    const ok = removeDepositAddress(symbol);
    if (!ok) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    appendAudit({
      actorId: admin.id,
      actorEmail: admin.email,
      action: 'address.remove',
      target: symbol,
    });
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: err.status || 500 });
  }
}

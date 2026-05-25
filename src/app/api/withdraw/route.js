// Withdraw crypto, gated by an admin-issued single-use token.
import { NextResponse } from 'next/server';
import { requireUser, newId } from '@/lib/server/auth.js';
import {
  findTokenByCode,
  updateToken,
  upsertUser,
  addTransaction,
  getSettings,
  beneficiariesForUser,
  appendAudit,
} from '@/lib/server/store.js';
import { priceFor, isSupportedSymbol } from '@/lib/server/prices.js';
import { sendWithdrawEmail } from '@/lib/server/email.js';
import { rateLimitOrJson } from '@/lib/server/rateLimit.js';
import { validateAddressForSymbol, requiresMemo, networksFor } from '@/lib/server/addressFormats.js';
import { sanctionsMatchReason } from '@/lib/server/sanctions.js';
import { assertWithdrawAllowed } from '@/lib/server/kyc.js';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req) {
  try {
    const limited = rateLimitOrJson(req, { key: 'withdraw', max: 10, windowMs: 60_000 });
    if (limited) return limited;
    const user = await requireUser();
    const settings = getSettings();
    if (!settings.withdrawalsEnabled) {
      return NextResponse.json({ error: 'Withdrawals are currently disabled.' }, { status: 403 });
    }
    const body = await req.json().catch(() => ({}));
    const symbol = String(body.symbol || '').toUpperCase();
    const amount = parseFloat(body.amount);
    const code = String(body.token || '').trim();
    let address = String(body.address || '').trim();
    let memo = body.memo ? String(body.memo).trim().slice(0, 100) : '';
    let network = body.network ? String(body.network).trim().slice(0, 50) : '';
    const beneficiaryId = body.beneficiaryId ? String(body.beneficiaryId) : '';
    // If a saved beneficiary is selected, hydrate the address details from it.
    // This is the preferred path because the beneficiary has already
    // passed the 24 h email confirmation + 48 h cool-down.
    let beneficiary = null;
    if (beneficiaryId) {
      beneficiary = beneficiariesForUser(user.id).find((b) => b.id === beneficiaryId) || null;
      if (!beneficiary) {
        return NextResponse.json({ error: 'Saved beneficiary not found' }, { status: 404 });
      }
      if (beneficiary.symbol !== symbol) {
        return NextResponse.json({ error: 'Beneficiary is for a different asset' }, { status: 400 });
      }
      if (!beneficiary.confirmedAt) {
        return NextResponse.json({ error: 'Beneficiary has not been confirmed by email yet' }, { status: 400 });
      }
      if (!beneficiary.usableAt || Date.now() < beneficiary.usableAt) {
        const when = beneficiary.usableAt ? new Date(beneficiary.usableAt).toUTCString() : 'pending';
        return NextResponse.json({ error: `Beneficiary is still in the 48-hour cool-down. Usable from ${when}.` }, { status: 400 });
      }
      address = beneficiary.address;
      memo = beneficiary.memo || '';
      network = beneficiary.network || network;
    }
    if (!isSupportedSymbol(symbol)) {
      return NextResponse.json({ error: 'Unsupported asset' }, { status: 400 });
    }
    if (!isFinite(amount) || amount <= 0) {
      return NextResponse.json({ error: 'Amount must be greater than zero' }, { status: 400 });
    }
    // If settings require a whitelisted beneficiary, refuse any ad-hoc
    // free-text destination. This is the recommended setting for any
    // live deployment.
    const requiresWhitelist = !!settings.requireWhitelist;
    if (requiresWhitelist && !beneficiary) {
      return NextResponse.json({
        error: 'This account requires withdrawals to a saved, confirmed beneficiary. Add and confirm one in the address book first.',
      }, { status: 403 });
    }
    // Validate the destination address against the asset's format. The
    // user may also omit it entirely (manual desk processing).
    if (address) {
      // Always screen against the embedded OFAC sample list, even when
      // the address comes from a saved beneficiary - the list updates
      // over time, so a previously-accepted address may now be sanctioned.
      const sanctioned = sanctionsMatchReason(address);
      if (sanctioned) {
        appendAudit({
          actorId: user.id,
          actorEmail: user.email,
          action: 'withdraw.sanctioned_reject',
          target: { symbol, address },
        });
        return NextResponse.json({ error: sanctioned }, { status: 400 });
      }
      const check = validateAddressForSymbol(symbol, address);
      if (!check.ok) {
        return NextResponse.json({ error: check.reason }, { status: 400 });
      }
      // Memo / destination-tag bearing chains are unforgiving: funds
      // sent without a memo are unrecoverable on exchange-side hot
      // wallets. Refuse the withdrawal rather than risk lost funds.
      if (requiresMemo(symbol) && !memo) {
        return NextResponse.json({
          error: `${symbol} requires a memo / destination tag. Withdrawals without it are unrecoverable.`,
        }, { status: 400 });
      }
      // If a network is supplied, sanity-check it against the asset.
      const allowed = networksFor(symbol);
      if (network && allowed.length && !allowed.includes(network)) {
        return NextResponse.json({
          error: `Network "${network}" is not supported for ${symbol}. Choose one of: ${allowed.join(', ')}.`,
        }, { status: 400 });
      }
    }
    if (!code) {
      return NextResponse.json({ error: 'Withdrawal authorisation token is required' }, { status: 400 });
    }
    const tok = findTokenByCode(code);
    if (!tok || tok.status !== 'active') {
      return NextResponse.json({ error: 'Invalid or already-used token' }, { status: 400 });
    }
    if (tok.expiresAt && Date.now() > tok.expiresAt) {
      // Auto-mark expired tokens so they cannot be retried.
      updateToken(tok.id, { status: 'expired', expiredAt: Date.now() });
      return NextResponse.json({ error: 'This authorisation token has expired. Request a fresh one.' }, { status: 400 });
    }
    if (tok.userId && tok.userId !== user.id) {
      return NextResponse.json({ error: 'This token was not issued to your account' }, { status: 403 });
    }
    if (tok.symbol && tok.symbol !== symbol) {
      return NextResponse.json({ error: `Token is restricted to ${tok.symbol} only` }, { status: 400 });
    }
    if (tok.maxAmount && amount > tok.maxAmount) {
      return NextResponse.json(
        { error: `Token authorises at most ${tok.maxAmount} ${symbol}` },
        { status: 400 },
      );
    }
    const bal = user.balances?.[symbol] || 0;
    if (bal < amount) {
      return NextResponse.json(
        { error: `Insufficient ${symbol}. Available: ${bal}` },
        { status: 400 },
      );
    }

    const price = await priceFor(symbol);
    // Enforce KYC tier limits on the USD value before debiting. This is
    // the only place we can know the live USD value, so the check has to
    // sit here rather than at validation time.
    try {
      assertWithdrawAllowed(user, amount * price);
    } catch (e) {
      return NextResponse.json({ error: e.message }, { status: e.status || 403 });
    }
    user.balances[symbol] = bal - amount;
    upsertUser(user);

    const tx = {
      id: newId('tx'),
      userId: user.id,
      type: 'withdraw',
      symbol,
      amount,
      price,
      usdValue: amount * price,
      status: 'completed',
      note: address ? `Withdrew to ${address}` : 'Withdrawal authorised by admin token',
      createdAt: Date.now(),
      tokenId: tok.id,
      address: address || null,
      memo: memo || null,
      network: network || null,
      beneficiaryId: beneficiary ? beneficiary.id : null,
    };
    addTransaction(tx);
    updateToken(tok.id, { status: 'used', usedAt: Date.now(), usedBy: user.id, txId: tx.id });
    try {
      await sendWithdrawEmail({ user, symbol, amount, price, address, note: tx.note });
    } catch (_) {}

    return NextResponse.json({ ok: true, transaction: tx, balances: user.balances });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: err.status || 500 });
  }
}

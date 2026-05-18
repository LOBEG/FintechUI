// Confirms a new beneficiary via the email link.
//   GET /api/beneficiaries/confirm?id=<id>&token=<token>
// Renders a small HTML page so the user has feedback in the browser.
// We compare tokens with constant-time SHA-256 hashes stored at create
// time.
import crypto from 'node:crypto';
import {
  listBeneficiaries,
  updateBeneficiary,
  appendAudit,
  findUserById,
} from '@/lib/server/store.js';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const COOLDOWN_MS = 48 * 60 * 60 * 1000;

function page(title, body) {
  return new Response(
    `<!doctype html><html><body style="margin:0;background:#05070d;font-family:Inter,Helvetica,sans-serif;color:#fff;min-height:100vh;display:flex;align-items:center;justify-content:center">
       <div style="max-width:480px;padding:32px;border:1px solid #1f2937;border-radius:12px;background:#0b1220">
         <h1 style="font-size:20px;margin:0 0 12px">${title}</h1>
         <div style="font-size:14px;color:#cbd5e1;line-height:1.5">${body}</div>
         <p style="margin-top:24px"><a href="/dashboard" style="color:#facc15;text-decoration:none">→ Back to dashboard</a></p>
       </div>
     </body></html>`,
    { status: 200, headers: { 'content-type': 'text/html; charset=utf-8' } },
  );
}

function hashToken(token) {
  return crypto.createHash('sha256').update(String(token)).digest('hex');
}

function safeEq(a, b) {
  const A = Buffer.from(String(a), 'utf8');
  const B = Buffer.from(String(b), 'utf8');
  if (A.length !== B.length) return false;
  return crypto.timingSafeEqual(A, B);
}

export async function GET(req) {
  const url = new URL(req.url);
  const id = url.searchParams.get('id');
  const token = url.searchParams.get('token');
  if (!id || !token) {
    return page('Invalid link', 'This confirmation link is missing required parameters.');
  }
  const b = listBeneficiaries().find((x) => x.id === id);
  if (!b || b.removedAt) {
    return page('Not found', 'This beneficiary no longer exists.');
  }
  if (b.confirmedAt) {
    return page('Already confirmed', 'This beneficiary has already been confirmed. The 48-hour cool-down still applies before it can receive funds.');
  }
  if (b.confirmTokenExpiresAt && Date.now() > b.confirmTokenExpiresAt) {
    return page('Link expired', 'This confirmation link has expired. Re-add the beneficiary from the dashboard to generate a fresh link.');
  }
  if (!b.confirmTokenHash || !safeEq(hashToken(token), b.confirmTokenHash)) {
    return page('Invalid token', 'This confirmation link is invalid. If you did not add this beneficiary, ignore the email and consider rotating your password.');
  }
  const now = Date.now();
  const usableAt = now + COOLDOWN_MS;
  updateBeneficiary(id, {
    confirmedAt: now,
    usableAt,
    // Burn the token so the link cannot be replayed.
    confirmTokenHash: null,
    confirmTokenExpiresAt: null,
  });
  const user = findUserById(b.userId);
  appendAudit({
    actorId: b.userId,
    actorEmail: user?.email || null,
    action: 'beneficiary.confirm',
    target: { id: b.id, symbol: b.symbol, address: b.address },
  });
  const when = new Date(usableAt).toUTCString();
  return page(
    'Beneficiary confirmed',
    `<p><b>${escapeHtml(b.label)}</b> · ${escapeHtml(b.symbol)} · <code style="font-family:Menlo,monospace">${escapeHtml(b.address)}</code></p>` +
    `<p>This beneficiary is now confirmed but cannot receive funds until the 48-hour security cool-down completes:</p>` +
    `<p style="background:#11172a;padding:10px;border-radius:8px"><b>Usable from:</b> ${when}</p>`,
  );
}

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  }[c]));
}

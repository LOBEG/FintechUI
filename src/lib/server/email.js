// Email delivery for Oakmont Digital Capital Group.
// - Uses nodemailer + SMTP when SMTP_HOST/SMTP_USER/SMTP_PASS are set.
// - Always appends to the `outbox.json` file so admins can audit what
//   was attempted and dev environments still see "what would have been sent".

import { appendOutbox } from './store.js';

let _transporter = null;

async function getTransporter() {
  if (_transporter !== null) return _transporter;
  const host = process.env.SMTP_HOST;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  if (!host || !user || !pass) {
    _transporter = false; // explicit disabled marker
    return false;
  }
  try {
    const mod = await import('nodemailer');
    const nodemailer = mod.default || mod;
    _transporter = nodemailer.createTransport({
      host,
      port: parseInt(process.env.SMTP_PORT || '587', 10),
      secure: String(process.env.SMTP_SECURE || 'false') === 'true',
      auth: { user, pass },
    });
    return _transporter;
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('[email] nodemailer init failed:', err.message);
    _transporter = false;
    return false;
  }
}

function fromAddress() {
  return process.env.EMAIL_FROM || 'Oakmont Digital Capital Group <no-reply@oakmontdigitalcapital.com>';
}

function brandedTemplate({ title, intro, rows = [], cta, ctaUrl, footer }) {
  const rowHtml = rows
    .map(
      (r) =>
        `<tr><td style="padding:6px 0;color:#9aa1ad;font-size:13px">${r.k}</td>` +
        `<td style="padding:6px 0;color:#ffffff;font-size:13px;text-align:right">${r.v}</td></tr>`,
    )
    .join('');
  return `<!doctype html><html><body style="margin:0;background:#05070d;font-family:Inter,Helvetica,Arial,sans-serif;color:#fff">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#05070d;padding:32px 0">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="background:#0b1020;border:1px solid rgba(255,255,255,0.06);border-radius:16px;overflow:hidden">
        <tr><td style="padding:24px 28px;border-bottom:1px solid rgba(255,255,255,0.06)">
          <div style="font-size:18px;font-weight:600;letter-spacing:.04em">
            <span style="background:linear-gradient(90deg,#f7e7a3,#d4a63f,#8d641d);-webkit-background-clip:text;background-clip:text;color:transparent">Oakmont</span> Digital Capital Group
          </div>
        </td></tr>
        <tr><td style="padding:28px">
          <h1 style="margin:0 0 10px;font-size:22px;font-weight:600">${title}</h1>
          <p style="margin:0 0 18px;color:#c8ccd4;line-height:1.55">${intro}</p>
          ${rowHtml ? `<table width="100%" style="margin:10px 0 18px;border-top:1px solid rgba(255,255,255,0.06);border-bottom:1px solid rgba(255,255,255,0.06)">${rowHtml}</table>` : ''}
          ${cta && ctaUrl ? `<p style="margin:18px 0 0"><a href="${ctaUrl}" style="display:inline-block;padding:11px 18px;border-radius:10px;background:linear-gradient(135deg,#00ffa3,#00d68a);color:#05070d;text-decoration:none;font-weight:600">${cta}</a></p>` : ''}
        </td></tr>
        <tr><td style="padding:18px 28px;border-top:1px solid rgba(255,255,255,0.06);color:#7a8290;font-size:11px">
          ${footer || 'You are receiving this because you have an Oakmont Digital Capital Group account. Oakmont Digital Capital Group never asks for your password or 2FA codes by email.'}
        </td></tr>
      </table>
    </td></tr>
  </table></body></html>`;
}

export async function sendEmail({ to, subject, html, text }) {
  const entry = {
    id: `mail_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`,
    to,
    subject,
    text,
    sentAt: null,
    queuedAt: Date.now(),
    deliveredVia: 'pending',
    error: null,
  };
  const t = await getTransporter();
  if (!t) {
    entry.deliveredVia = 'outbox';
    entry.sentAt = Date.now();
    appendOutbox(entry);
    // eslint-disable-next-line no-console
    console.info(`[email/outbox] to=${to} subject="${subject}"`);
    return entry;
  }
  try {
    await t.sendMail({ from: fromAddress(), to, subject, text, html });
    entry.deliveredVia = 'smtp';
    entry.sentAt = Date.now();
  } catch (err) {
    entry.deliveredVia = 'failed';
    entry.error = err.message || String(err);
    // eslint-disable-next-line no-console
    console.error('[email] send failed:', entry.error);
  }
  appendOutbox(entry);
  return entry;
}

// ----------- Templated transactional emails -----------

function fmt(n, d = 8) {
  if (!isFinite(n)) return '0';
  return Number(n).toLocaleString('en-US', { maximumFractionDigits: d });
}
function fmtUsd(n) {
  return `$${Number(n || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export async function sendDepositEmail({ user, symbol, amount, price, note }) {
  const usd = amount * price;
  const text = `Deposit received: ${fmt(amount)} ${symbol} (≈ ${fmtUsd(usd)}). New balance reflected in your Oakmont Digital Capital Group wallet.`;
  const html = brandedTemplate({
    title: 'Deposit confirmed',
    intro: `Your Oakmont Digital Capital Group wallet has been credited with the funds below.${note ? ` <br/><span style="color:#9aa1ad">${note}</span>` : ''}`,
    rows: [
      { k: 'Asset', v: symbol },
      { k: 'Amount', v: `${fmt(amount)} ${symbol}` },
      { k: 'Indicative value', v: fmtUsd(usd) },
      { k: 'Price at credit', v: fmtUsd(price) },
      { k: 'Date', v: new Date().toUTCString() },
    ],
    cta: 'Open wallet',
    ctaUrl: `${process.env.APP_URL || ''}/dashboard`,
  });
  return sendEmail({ to: user.email, subject: `Deposit confirmed - ${fmt(amount)} ${symbol}`, html, text });
}

export async function sendWithdrawEmail({ user, symbol, amount, price, address, note }) {
  const usd = amount * price;
  const text = `Withdrawal processed: ${fmt(amount)} ${symbol} (≈ ${fmtUsd(usd)}).`;
  const html = brandedTemplate({
    title: 'Withdrawal processed',
    intro: `Your withdrawal request was authorised by Oakmont Digital Capital Group and has been submitted on-chain.${note ? `<br/><span style="color:#9aa1ad">${note}</span>` : ''}`,
    rows: [
      { k: 'Asset', v: symbol },
      { k: 'Amount', v: `${fmt(amount)} ${symbol}` },
      { k: 'Indicative value', v: fmtUsd(usd) },
      { k: 'Destination', v: address || '- provided in app -' },
      { k: 'Date', v: new Date().toUTCString() },
    ],
    cta: 'View transactions',
    ctaUrl: `${process.env.APP_URL || ''}/dashboard`,
    footer:
      'If you did not initiate this withdrawal, contact Oakmont Digital Capital Group support immediately via the in-app chat or Telegram support button.',
  });
  return sendEmail({ to: user.email, subject: `Withdrawal processed - ${fmt(amount)} ${symbol}`, html, text });
}

export async function sendInvestEmail({ user, symbol, cryptoAmount, usdAmount, price }) {
  const text = `Investment confirmed: ${fmtUsd(usdAmount)} → ${fmt(cryptoAmount)} ${symbol} @ ${fmtUsd(price)}.`;
  const html = brandedTemplate({
    title: 'Investment confirmed',
    intro: 'Your Oakmont Digital Capital Group investment has executed at the live market price.',
    rows: [
      { k: 'USD invested', v: fmtUsd(usdAmount) },
      { k: 'Asset acquired', v: symbol },
      { k: 'Quantity', v: `${fmt(cryptoAmount)} ${symbol}` },
      { k: 'Fill price', v: fmtUsd(price) },
      { k: 'Date', v: new Date().toUTCString() },
    ],
    cta: 'Open dashboard',
    ctaUrl: `${process.env.APP_URL || ''}/dashboard`,
  });
  return sendEmail({ to: user.email, subject: `Investment confirmed - ${symbol}`, html, text });
}

export async function sendWithdrawalTokenEmail({ user, code, symbol, maxAmount }) {
  const scope = symbol
    ? `${symbol}${maxAmount ? ` up to ${fmt(maxAmount)}` : ''}`
    : 'any supported asset';
  const text = `Your Oakmont Digital Capital Group withdrawal authorisation token: ${code}. Scope: ${scope}.`;
  const html = brandedTemplate({
    title: 'Withdrawal authorisation token',
    intro:
      'An Oakmont Digital Capital Group administrator has issued the one-time authorisation token below. Enter it on the withdrawal screen to release your funds. Tokens are single-use.',
    rows: [
      { k: 'Token', v: `<span style="font-family:Menlo,monospace;background:#11172a;padding:4px 8px;border-radius:6px">${code}</span>` },
      { k: 'Scope', v: scope },
      { k: 'Issued', v: new Date().toUTCString() },
    ],
    cta: 'Withdraw now',
    ctaUrl: `${process.env.APP_URL || ''}/dashboard`,
    footer:
      'Never share this token. Oakmont Digital Capital Group support will never ask for it. If you did not request a withdrawal, ignore this email.',
  });
  return sendEmail({ to: user.email, subject: 'Oakmont Digital Capital Group withdrawal authorisation token', html, text });
}

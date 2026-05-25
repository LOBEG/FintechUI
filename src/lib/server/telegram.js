// Telegram admin bot for Oakmont Digital Markets Groups.
//
// Set the following env vars:
//   TELEGRAM_BOT_TOKEN     - BotFather token
//   TELEGRAM_WEBHOOK_SECRET - random string; Telegram is required to send this
//                             back in the `X-Telegram-Bot-Api-Secret-Token` header.
//   TELEGRAM_ADMIN_CHAT_IDS - comma-separated chat IDs allowed to issue admin commands.
//
// Set the webhook (once, from any shell after deploy):
//   curl -X POST "https://api.telegram.org/bot$TELEGRAM_BOT_TOKEN/setWebhook" \
//     -d "url=https://<your-railway-domain>/api/telegram/webhook" \
//     -d "secret_token=$TELEGRAM_WEBHOOK_SECRET"
//
// Supported commands (admin chat IDs only):
//   /start | /help                - show command list
//   /status                       - site status summary
//   /users                        - list registered users
//   /balance <email>              - show wallet for user
//   /credit <email> <SYM> <amount> [note]
//                                 - admin-credit a deposit; emails user
//   /issue_token <email> [SYM] [maxAmount]
//                                 - issue a single-use withdrawal token
//   /tokens                       - list active withdrawal tokens
//   /revoke <code>                - revoke a withdrawal token
//   /tx [n=10]                    - last N transactions
//   /maintenance on|off           - toggle site-wide maintenance mode
//   /withdrawals on|off           - toggle withdrawals
//   /signups on|off               - toggle signups
//   /banner <text>                - set top banner; "clear" to remove
//   /broadcast <text>             - push a broadcast notice (max 50 stored)

import {
  listUsers,
  findUserByEmail,
  upsertUser,
  listTransactions,
  addTransaction,
  listTokens,
  addToken,
  updateToken,
  getSettings,
  saveSettings,
  listDepositAddresses,
  setDepositAddress,
  removeDepositAddress,
} from './store.js';
import { newId, newCode } from './auth.js';
import { priceFor, isSupportedSymbol } from './prices.js';
import { sendDepositEmail, sendWithdrawalTokenEmail, sendEmail } from './email.js';

const TG_API = 'https://api.telegram.org';

function token() {
  return process.env.TELEGRAM_BOT_TOKEN || '';
}
function adminIds() {
  return (process.env.TELEGRAM_ADMIN_CHAT_IDS || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
}
export function expectedWebhookSecret() {
  return process.env.TELEGRAM_WEBHOOK_SECRET || '';
}
export function isTelegramConfigured() {
  return !!token();
}

export async function tgSend(chatId, text, extra = {}) {
  if (!token()) return null;
  try {
    const res = await fetch(`${TG_API}/bot${token()}/sendMessage`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        parse_mode: 'HTML',
        disable_web_page_preview: true,
        ...extra,
      }),
    });
    return await res.json();
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('[telegram] send error:', err.message);
    return null;
  }
}

function isAdminChat(chatId) {
  const ids = adminIds();
  // If no admins are configured we refuse all admin commands.
  if (ids.length === 0) return false;
  return ids.includes(String(chatId));
}

function bool(s) {
  return /^(on|true|1|yes|enable)$/i.test(s);
}

function fmtUser(u) {
  return `<b>${esc(u.email)}</b>${u.isAdmin ? ' <i>(admin)</i>' : ''} - id <code>${u.id}</code>`;
}

function esc(s) {
  return String(s == null ? '' : s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function fmtBalances(b) {
  const entries = Object.entries(b || {}).filter(([, v]) => v > 0);
  if (!entries.length) return '<i>empty</i>';
  return entries.map(([k, v]) => `${k}: <code>${v}</code>`).join(', ');
}

const HELP = `<b>Oakmont Digital Markets Groups admin bot</b>
/status - site overview
/users - list users
/balance &lt;email&gt;
/credit &lt;email&gt; &lt;SYM&gt; &lt;amount&gt; [note]
/adjust &lt;email&gt; &lt;SYM&gt; &lt;±amount&gt; [reason]
/issue_token &lt;email&gt; [SYM] [maxAmount]
/tokens - list active tokens
/revoke &lt;code&gt;
/tx [n] - last N transactions
/address &lt;SYM&gt; &lt;addr&gt; [memo|network=…|label=…]
/addresses - list deposit addresses
/remove_address &lt;SYM&gt;
/maintenance on|off
/withdrawals on|off
/signups on|off
/banner &lt;text|clear&gt;
/broadcast &lt;text&gt;`;

export async function handleUpdate(update) {
  const msg = update?.message || update?.edited_message;
  if (!msg || !msg.text) return { ok: true, ignored: true };
  const chatId = msg.chat?.id;
  const text = msg.text.trim();

  if (!isAdminChat(chatId)) {
    await tgSend(chatId, '⛔ Unauthorised. This chat ID is not in <code>TELEGRAM_ADMIN_CHAT_IDS</code>.');
    return { ok: true, unauthorised: true, chatId };
  }

  const [rawCmd, ...rest] = text.split(/\s+/);
  const cmd = rawCmd.replace(/@\w+$/, '').toLowerCase();
  const arg = rest.join(' ');

  try {
    switch (cmd) {
      case '/start':
      case '/help':
        await tgSend(chatId, HELP);
        return { ok: true };

      case '/status': {
        const s = getSettings();
        const u = listUsers();
        const tx = listTransactions();
        const tokens = listTokens();
        await tgSend(
          chatId,
          `<b>Status</b>\nUsers: <b>${u.length}</b>\nTransactions: <b>${tx.length}</b>\nActive tokens: <b>${tokens.filter((t) => t.status === 'active').length}</b>\nMaintenance: <b>${s.maintenanceMode ? 'ON' : 'off'}</b>\nWithdrawals: <b>${s.withdrawalsEnabled ? 'enabled' : 'disabled'}</b>\nSignups: <b>${s.signupsEnabled ? 'enabled' : 'disabled'}</b>\nBanner: ${s.banner ? `<i>${esc(s.banner)}</i>` : '<i>none</i>'}`,
        );
        return { ok: true };
      }

      case '/users': {
        const users = listUsers();
        if (!users.length) {
          await tgSend(chatId, 'No users yet.');
          return { ok: true };
        }
        const lines = users.slice(0, 30).map(fmtUser);
        await tgSend(chatId, `<b>Users (${users.length})</b>\n${lines.join('\n')}`);
        return { ok: true };
      }

      case '/balance': {
        const email = rest[0];
        if (!email) return tgSend(chatId, 'Usage: /balance &lt;email&gt;');
        const u = findUserByEmail(email);
        if (!u) return tgSend(chatId, `No user with email <code>${esc(email)}</code>`);
        await tgSend(chatId, `<b>${esc(u.email)}</b>\n${fmtBalances(u.balances)}`);
        return { ok: true };
      }

      case '/credit': {
        const [email, sym, amountStr, ...noteWords] = rest;
        const amount = parseFloat(amountStr);
        if (!email || !sym || !isFinite(amount) || amount <= 0) {
          return tgSend(chatId, 'Usage: /credit &lt;email&gt; &lt;SYM&gt; &lt;amount&gt; [note]');
        }
        const SYM = sym.toUpperCase();
        if (!isSupportedSymbol(SYM)) {
          return tgSend(chatId, `Unsupported symbol <code>${esc(SYM)}</code>.`);
        }
        const u = findUserByEmail(email);
        if (!u) return tgSend(chatId, `No user with email <code>${esc(email)}</code>`);
        const price = await priceFor(SYM);
        u.balances = u.balances || {};
        u.balances[SYM] = (u.balances[SYM] || 0) + amount;
        upsertUser(u);
        const note = noteWords.join(' ') || 'Admin-credited via Telegram';
        const tx = {
          id: newId('tx'),
          userId: u.id,
          type: 'admin_credit',
          symbol: SYM,
          amount,
          price,
          usdValue: amount * price,
          status: 'completed',
          note,
          createdAt: Date.now(),
          via: 'telegram',
        };
        addTransaction(tx);
        try {
          await sendDepositEmail({ user: u, symbol: SYM, amount, price, note });
        } catch (_) {}
        await tgSend(
          chatId,
          `✅ Credited <b>${amount} ${SYM}</b> to <b>${esc(u.email)}</b> @ $${price.toFixed(2)} (≈ $${(amount * price).toFixed(2)}). Email queued.`,
        );
        return { ok: true };
      }

      case '/issue_token': {
        const [email, sym, maxAmountStr] = rest;
        if (!email) return tgSend(chatId, 'Usage: /issue_token &lt;email&gt; [SYM] [maxAmount]');
        const u = findUserByEmail(email);
        if (!u) return tgSend(chatId, `No user with email <code>${esc(email)}</code>`);
        const SYM = sym ? sym.toUpperCase() : null;
        if (SYM && !isSupportedSymbol(SYM)) {
          return tgSend(chatId, `Unsupported symbol <code>${esc(SYM)}</code>.`);
        }
        const maxAmount = maxAmountStr ? parseFloat(maxAmountStr) : null;
        const code = newCode(20);
        const tok = {
          id: newId('tok'),
          code,
          issuedBy: 'telegram',
          userId: u.id,
          symbol: SYM,
          maxAmount: isFinite(maxAmount) ? maxAmount : null,
          status: 'active',
          createdAt: Date.now(),
        };
        addToken(tok);
        try {
          await sendWithdrawalTokenEmail({ user: u, code, symbol: SYM, maxAmount });
        } catch (_) {}
        await tgSend(
          chatId,
          `🔐 Token issued for <b>${esc(u.email)}</b>:\n<code>${code}</code>\nScope: ${SYM || 'any'}${maxAmount ? ` ≤ ${maxAmount}` : ''}\nEmailed to user.`,
        );
        return { ok: true };
      }

      case '/tokens': {
        const active = listTokens().filter((t) => t.status === 'active');
        if (!active.length) return tgSend(chatId, 'No active withdrawal tokens.');
        const lines = active.slice(0, 20).map((t) => {
          const u = listUsers().find((x) => x.id === t.userId);
          return `<code>${t.code}</code> - ${u ? esc(u.email) : '(unbound)'} · ${t.symbol || 'any'}${t.maxAmount ? ` ≤ ${t.maxAmount}` : ''}`;
        });
        await tgSend(chatId, `<b>Active tokens (${active.length})</b>\n${lines.join('\n')}`);
        return { ok: true };
      }

      case '/revoke': {
        const code = rest[0];
        if (!code) return tgSend(chatId, 'Usage: /revoke &lt;code&gt;');
        const tok = listTokens().find((t) => t.code === code);
        if (!tok) return tgSend(chatId, 'Token not found.');
        if (tok.status !== 'active') return tgSend(chatId, `Token already ${tok.status}.`);
        updateToken(tok.id, { status: 'revoked', revokedAt: Date.now() });
        await tgSend(chatId, `🚫 Token <code>${code}</code> revoked.`);
        return { ok: true };
      }

      case '/tx': {
        const n = Math.min(parseInt(rest[0] || '10', 10) || 10, 50);
        const tx = listTransactions().slice(0, n);
        if (!tx.length) return tgSend(chatId, 'No transactions.');
        const lines = tx.map((t) => {
          const u = listUsers().find((x) => x.id === t.userId);
          const sign = t.type === 'withdraw' ? '-' : '+';
          return `${new Date(t.createdAt).toISOString().slice(0, 16)} · ${t.type} ${sign}${t.amount} ${t.symbol} · ${u ? esc(u.email) : '?'}`;
        });
        await tgSend(chatId, `<b>Last ${n} tx</b>\n<code>${lines.join('\n')}</code>`);
        return { ok: true };
      }

      case '/maintenance': {
        const v = bool(rest[0] || '');
        const s = saveSettings({ maintenanceMode: v });
        await tgSend(chatId, `Maintenance mode: <b>${s.maintenanceMode ? 'ON' : 'off'}</b>`);
        return { ok: true };
      }
      case '/withdrawals': {
        const v = bool(rest[0] || '');
        const s = saveSettings({ withdrawalsEnabled: v });
        await tgSend(chatId, `Withdrawals: <b>${s.withdrawalsEnabled ? 'enabled' : 'disabled'}</b>`);
        return { ok: true };
      }
      case '/signups': {
        const v = bool(rest[0] || '');
        const s = saveSettings({ signupsEnabled: v });
        await tgSend(chatId, `Signups: <b>${s.signupsEnabled ? 'enabled' : 'disabled'}</b>`);
        return { ok: true };
      }
      case '/banner': {
        const v = arg.trim();
        if (!v || /^clear$/i.test(v)) {
          saveSettings({ banner: '' });
          await tgSend(chatId, 'Banner cleared.');
        } else {
          saveSettings({ banner: v });
          await tgSend(chatId, `Banner set: <i>${esc(v)}</i>`);
        }
        return { ok: true };
      }
      case '/broadcast': {
        const v = arg.trim();
        if (!v) return tgSend(chatId, 'Usage: /broadcast &lt;text&gt;');
        const s = getSettings();
        const list = [{ at: Date.now(), text: v }, ...(s.broadcasts || [])].slice(0, 50);
        saveSettings({ broadcasts: list });
        await tgSend(chatId, '📣 Broadcast published to site.');
        return { ok: true };
      }

      case '/address': {
        const [sym, address, ...metaWords] = rest;
        if (!sym || !address) {
          return tgSend(
            chatId,
            'Usage: /address &lt;SYM&gt; &lt;address&gt; [memo|network=…|label=…]',
          );
        }
        const SYM = sym.toUpperCase();
        if (!isSupportedSymbol(SYM)) {
          return tgSend(chatId, `Unsupported symbol <code>${esc(SYM)}</code>.`);
        }
        // Parse key=value tokens (network=…, label=…); anything else joins into memo.
        let network = '';
        let label = '';
        const memoParts = [];
        for (const w of metaWords) {
          const m = w.match(/^(network|label|memo)=(.*)$/i);
          if (!m) { memoParts.push(w); continue; }
          if (m[1].toLowerCase() === 'network') network = m[2];
          else if (m[1].toLowerCase() === 'label') label = m[2];
          else memoParts.push(m[2]);
        }
        const memo = memoParts.join(' ').trim();
        const saved = setDepositAddress(SYM, { address, memo, network, label, updatedBy: 'telegram' });
        await tgSend(
          chatId,
          `✅ Deposit address set for <b>${SYM}</b>:\n<code>${esc(saved.address)}</code>${saved.network ? `\nNetwork: <b>${esc(saved.network)}</b>` : ''}${saved.memo ? `\nMemo: <code>${esc(saved.memo)}</code>` : ''}${saved.label ? `\nLabel: <i>${esc(saved.label)}</i>` : ''}\nVisible to users instantly.`,
        );
        return { ok: true };
      }

      case '/addresses': {
        const all = listDepositAddresses();
        const entries = Object.values(all);
        if (!entries.length) return tgSend(chatId, 'No deposit addresses configured.');
        const lines = entries.map(
          (a) => `<b>${a.symbol}</b> - <code>${esc(a.address)}</code>${a.network ? ` (${esc(a.network)})` : ''}${a.memo ? ` · memo <code>${esc(a.memo)}</code>` : ''}`,
        );
        await tgSend(chatId, `<b>Deposit addresses (${entries.length})</b>\n${lines.join('\n')}`);
        return { ok: true };
      }

      case '/remove_address': {
        const sym = (rest[0] || '').toUpperCase();
        if (!sym) return tgSend(chatId, 'Usage: /remove_address &lt;SYM&gt;');
        const ok = removeDepositAddress(sym);
        await tgSend(chatId, ok ? `🗑️ Removed deposit address for <b>${sym}</b>.` : `No address for <b>${sym}</b>.`);
        return { ok: true };
      }

      case '/adjust': {
        const [email, sym, amountStr, ...reasonWords] = rest;
        const amount = parseFloat(amountStr);
        if (!email || !sym || !isFinite(amount) || amount === 0) {
          return tgSend(chatId, 'Usage: /adjust &lt;email&gt; &lt;SYM&gt; &lt;±amount&gt; [reason]');
        }
        const SYM = sym.toUpperCase();
        if (!isSupportedSymbol(SYM)) {
          return tgSend(chatId, `Unsupported symbol <code>${esc(SYM)}</code>.`);
        }
        const u = findUserByEmail(email);
        if (!u) return tgSend(chatId, `No user with email <code>${esc(email)}</code>`);
        u.balances = u.balances || {};
        const current = u.balances[SYM] || 0;
        const next = current + amount;
        if (next < 0) {
          return tgSend(chatId, '❌ Adjustment would make balance negative.');
        }
        u.balances[SYM] = next;
        upsertUser(u);
        const price = await priceFor(SYM);
        const reason = reasonWords.join(' ') || 'Portfolio performance adjustment';
        addTransaction({
          id: newId('tx'),
          userId: u.id,
          type: 'adjust',
          symbol: SYM,
          amount,
          price,
          usdValue: amount * price,
          status: 'completed',
          note: reason,
          createdAt: Date.now(),
          via: 'telegram',
        });
        try {
          await sendEmail({
            to: u.email,
            subject: `Your Oakmont Digital Markets Groups ${SYM} position was ${amount > 0 ? 'increased' : 'decreased'}`,
            text: `Adjustment ${amount > 0 ? '+' : ''}${amount} ${SYM}. Reason: ${reason}. New balance: ${next} ${SYM}.`,
            html: `<p>Adjustment of <strong>${amount > 0 ? '+' : ''}${amount} ${SYM}</strong> applied (≈ $${(Math.abs(amount) * price).toFixed(2)}).</p><p>Reason: ${esc(reason)}</p><p>New balance: <strong>${next} ${SYM}</strong>.</p>`,
          });
        } catch (_) {}
        await tgSend(
          chatId,
          `⚖️ Adjusted <b>${esc(u.email)}</b> by <b>${amount > 0 ? '+' : ''}${amount} ${SYM}</b>.\nNew balance: <b>${next} ${SYM}</b>. Email queued.`,
        );
        return { ok: true };
      }

      default:
        await tgSend(chatId, `Unknown command. ${HELP}`);
        return { ok: true };
    }
  } catch (err) {
    await tgSend(chatId, `❌ Error: <code>${esc(err.message || String(err))}</code>`);
    return { ok: false, error: err.message };
  }
}

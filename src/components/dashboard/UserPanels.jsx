'use client';
import { useEffect, useMemo, useState } from 'react';
import { Copy, Wallet, Check, Search, MessageSquare, Star, Loader2, ShieldAlert, Bell, X as BellClose } from 'lucide-react';
import QRCode from 'qrcode';
import { api, useSession } from '@/lib/useSession';

// Memo / destination-tag bearing chains. Funds sent without the memo are
// generally not recoverable on a shared exchange wallet, so we warn the
// user prominently next to the address.
const MEMO_REQUIRED = new Set(['XRP', 'ATOM', 'EOS', 'TON', 'HBAR', 'XLM']);

function AddressQR({ value }) {
  const [src, setSrc] = useState('');
  useEffect(() => {
    let cancelled = false;
    if (!value) { setSrc(''); return; }
    QRCode.toDataURL(value, {
      errorCorrectionLevel: 'M',
      margin: 1,
      width: 144,
      color: { dark: '#0b0c10', light: '#ffffff' },
    })
      .then((url) => { if (!cancelled) setSrc(url); })
      .catch(() => { if (!cancelled) setSrc(''); });
    return () => { cancelled = true; };
  }, [value]);
  if (!src) return null;
  return (
    /* eslint-disable-next-line @next/next/no-img-element */
    <img src={src} alt="Deposit address QR code" width={120} height={120} className="rounded bg-white p-1 self-start"/>
  );
}

// =============================================================
// Deposit addresses panel — shown on /dashboard for signed-in users.
// =============================================================
export function DepositAddressPanel() {
  const { user } = useSession();
  const [addresses, setAddresses] = useState([]);
  const [copied, setCopied] = useState(null);
  useEffect(() => {
    if (!user) return;
    let mounted = true;
    const load = async () => {
      try {
        const r = await api.get('/api/deposit-addresses');
        if (mounted) setAddresses(r.addresses || []);
      } catch (_) {}
    };
    load();
    // Poll every 20s so addresses pushed by an admin appear in near-real-time.
    const id = setInterval(load, 20000);
    return () => { mounted = false; clearInterval(id); };
  }, [user]);
  if (!user) return null;
  const copy = (sym, address) => {
    navigator.clipboard?.writeText(address);
    setCopied(sym);
    setTimeout(() => setCopied(null), 1500);
  };
  return (
    <section className="glass-strong p-5">
      <div className="flex items-center gap-2 mb-3">
        <Wallet className="h-4 w-4 text-gold-400"/>
        <h3 className="font-display text-lg">Deposit crypto</h3>
        <span className="chip bg-neon-green/15 text-neon-green border border-neon-green/30">● live</span>
      </div>
      {addresses.length === 0 ? (
        <p className="text-sm text-white/60">Your AurumX desk is preparing deposit wallets. Addresses pushed by an administrator will appear here automatically.</p>
      ) : (
        <>
          <p className="text-xs text-white/55 mb-3">Send the listed crypto to the address shown. Once your deposit clears it will be credited to your account and appear in your transaction history.</p>
          <ul className="grid sm:grid-cols-2 gap-2">
            {addresses.map((a) => {
              const memoRequired = MEMO_REQUIRED.has(a.symbol);
              return (
                <li key={a.symbol} className="glass-light p-3 flex flex-col gap-2">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold">{a.symbol}</span>
                    {a.network && <span className="chip bg-white/5 border border-white/10 text-white/70 text-[10px]">{a.network}</span>}
                    {a.label && <span className="text-[10px] text-white/45">{a.label}</span>}
                    <button onClick={() => copy(a.symbol, a.address)} className="ml-auto h-7 w-7 rounded bg-white/5 hover:bg-white/10 inline-flex items-center justify-center" aria-label="Copy address">
                      {copied === a.symbol ? <Check className="h-3.5 w-3.5 text-neon-green"/> : <Copy className="h-3.5 w-3.5"/>}
                    </button>
                  </div>
                  <div className="flex gap-3 items-start">
                    <AddressQR value={a.address}/>
                    <div className="flex flex-col gap-1 min-w-0 flex-1">
                      <code className="font-mono text-xs break-all text-white/85">{a.address}</code>
                      {a.memo && <div className="text-[11px] text-gold-300">Memo / tag: <code className="font-mono">{a.memo}</code></div>}
                      {memoRequired && (
                        <div className="flex gap-1.5 items-start text-[11px] text-neon-red bg-neon-red/10 border border-neon-red/30 rounded px-2 py-1.5">
                          <ShieldAlert className="h-3.5 w-3.5 mt-0.5 shrink-0"/>
                          <span>
                            {a.symbol} requires a destination tag / memo. Sending without it will result in <strong>permanent loss</strong> of funds.
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        </>
      )}
    </section>
  );
}

// =============================================================
// Markets panel — live prices of all supported crypto.
// =============================================================
export function MarketsPanel({ onInvest }) {
  const [rows, setRows] = useState([]);
  const [q, setQ] = useState('');
  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        const r = await api.get('/api/markets');
        // Avoid clobbering a populated table with an empty response —
        // Binance occasionally returns [] under rate-limit and we don't
        // want the UI to flash empty.
        if (mounted && Array.isArray(r.markets) && r.markets.length) setRows(r.markets);
      } catch (_) {}
    };
    load();
    const id = setInterval(load, 15000);
    return () => { mounted = false; clearInterval(id); };
  }, []);
  const filtered = rows.filter((r) => {
    if (!q) return true;
    const s = q.toLowerCase();
    return r.symbol.toLowerCase().includes(s) || r.name.toLowerCase().includes(s);
  });
  return (
    <section className="glass-strong p-5">
      <div className="flex items-center gap-2 mb-3 flex-wrap">
        <h3 className="font-display text-lg">All crypto markets</h3>
        <span className="chip bg-neon-green/15 text-neon-green border border-neon-green/30">● live</span>
        <div className="ml-auto flex items-center gap-2 bg-white/5 border border-white/10 rounded-lg px-3 py-1.5">
          <Search className="h-3.5 w-3.5 text-white/50"/>
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search asset…" className="bg-transparent outline-none text-sm w-32"/>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="text-xs text-white/50 text-left">
            <tr>
              <th className="py-2 font-medium">Asset</th>
              <th className="py-2 font-medium">Price</th>
              <th className="py-2 font-medium">24h</th>
              <th className="py-2 font-medium hidden md:table-cell">24h High</th>
              <th className="py-2 font-medium hidden md:table-cell">24h Low</th>
              <th className="py-2 font-medium hidden lg:table-cell">24h Volume (USD)</th>
              <th className="py-2 font-medium text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {filtered.map((r) => (
              <tr key={r.symbol}>
                <td className="py-2.5">
                  <a href={`/markets/${r.symbol}`} className="flex items-center gap-2 hover:text-neon-gold">
                    <span className="h-6 w-6 rounded-full inline-flex items-center justify-center text-[10px] font-semibold text-ink-950" style={{ background: r.color }}>{r.symbol.slice(0, 2)}</span>
                    <div>
                      <div className="font-medium">{r.symbol}</div>
                      <div className="text-[11px] text-white/45">{r.name}</div>
                    </div>
                  </a>
                </td>
                <td>${r.price ? r.price.toLocaleString(undefined, { maximumFractionDigits: r.price < 1 ? 6 : 2 }) : '—'}</td>
                <td className={r.pct >= 0 ? 'text-neon-green' : 'text-neon-red'}>{r.pct >= 0 ? '+' : ''}{r.pct?.toFixed(2)}%</td>
                <td className="hidden md:table-cell text-white/70">${r.high ? r.high.toLocaleString(undefined, { maximumFractionDigits: 2 }) : '—'}</td>
                <td className="hidden md:table-cell text-white/70">${r.low ? r.low.toLocaleString(undefined, { maximumFractionDigits: 2 }) : '—'}</td>
                <td className="hidden lg:table-cell text-white/55">${r.volume ? (r.volume / 1e6).toFixed(2) + 'M' : '—'}</td>
                <td className="text-right">
                  <button onClick={() => onInvest && onInvest(r.symbol)} className="px-2.5 py-1 rounded bg-neon-green/15 text-neon-green hover:bg-neon-green/25 text-xs">Invest</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

// =============================================================
// Sandbox on-ramp panel — shown only when the deployment exposes
// SANDBOX_ONRAMP_USDT and the user hasn't already claimed.
// =============================================================
export function SandboxOnRampPanel({ onClaimed }) {
  const { user } = useSession();
  const [info, setInfo] = useState(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState(null);
  useEffect(() => {
    let mounted = true;
    api.get('/api/sandbox/credit-usdt')
      .then((r) => { if (mounted) setInfo(r); })
      .catch(() => {});
    return () => { mounted = false; };
  }, []);
  if (!user || !info || !info.enabled) return null;
  if (user.sandboxClaimedAt) return null;
  const claim = async () => {
    setBusy(true); setMsg(null);
    try {
      const r = await api.post('/api/sandbox/credit-usdt');
      setMsg({ kind: 'ok', text: `Credited ${info.amount} USDT to your sandbox balance.` });
      onClaimed && onClaimed(r);
    } catch (err) {
      setMsg({ kind: 'err', text: err.message });
    } finally { setBusy(false); }
  };
  return (
    <section className="glass-strong p-5">
      <div className="flex items-center gap-2 mb-2">
        <Wallet className="h-4 w-4 text-gold-400"/>
        <h3 className="font-display text-lg">Sandbox starter funds</h3>
        <span className="chip bg-gold-500/15 text-gold-300 border border-gold-500/30">test only</span>
      </div>
      <p className="text-xs text-white/55 mb-3">
        This deployment has the sandbox on-ramp enabled. Claim {info.amount} USDT of practice funds to try the invest flow.
        These are <strong>not real funds</strong> and cannot be withdrawn on-chain.
      </p>
      {msg && <p className={`text-xs px-3 py-2 mb-2 rounded-lg border ${msg.kind === 'ok' ? 'bg-neon-green/10 border-neon-green/30 text-neon-green' : 'bg-neon-red/10 border-neon-red/30 text-neon-red'}`}>{msg.text}</p>}
      <button onClick={claim} disabled={busy} className="btn-primary disabled:opacity-60">
        {busy ? <><Loader2 className="h-4 w-4 animate-spin"/> Claiming…</> : `Claim ${info.amount} USDT`}
      </button>
    </section>
  );
}

// =============================================================
// Testimonial submission form — shown on /dashboard for eligible users.
// =============================================================
export function TestimonialComposer() {
  const { user } = useSession();
  const [text, setText] = useState('');
  const [role, setRole] = useState('');
  const [rating, setRating] = useState(5);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState(null);
  if (!user) return null;
  const submit = async (e) => {
    e.preventDefault(); setBusy(true); setMsg(null);
    try {
      const r = await api.post('/api/testimonials', { text, role, rating });
      const pending = r.testimonial && r.testimonial.status === 'pending';
      setMsg({ kind: 'ok', text: pending ? 'Thanks! Your testimonial is pending moderation.' : 'Thanks! Your testimonial is now live.' });
      setText('');
    } catch (err) {
      setMsg({ kind: 'err', text: err.message });
    } finally { setBusy(false); }
  };
  return (
    <section className="glass-strong p-5">
      <div className="flex items-center gap-2 mb-3">
        <MessageSquare className="h-4 w-4 text-gold-400"/>
        <h3 className="font-display text-lg">Share your AurumX experience</h3>
      </div>
      <p className="text-xs text-white/55 mb-3">Eligible after your first investment or deposit clears. Your testimonial may appear publicly on the AurumX landing page.</p>
      <form onSubmit={submit} className="space-y-2">
        <textarea required minLength={20} maxLength={600} value={text} onChange={(e) => setText(e.target.value)} placeholder="What stands out about trading and investing on AurumX?" className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm outline-none focus:border-neon-green/40 min-h-[90px]"/>
        <div className="flex gap-2 flex-wrap">
          <input value={role} onChange={(e) => setRole(e.target.value)} placeholder="Your role (optional) — e.g. Portfolio Manager" className="flex-1 min-w-[200px] bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm outline-none"/>
          <div className="inline-flex items-center gap-1 bg-white/5 border border-white/10 rounded-lg px-2">
            {[1, 2, 3, 4, 5].map((n) => (
              <button type="button" key={n} onClick={() => setRating(n)} aria-label={`${n} stars`}>
                <Star className={`h-4 w-4 ${n <= rating ? 'text-gold-400 fill-gold-400' : 'text-white/30'}`}/>
              </button>
            ))}
          </div>
        </div>
        {msg && <p className={`text-xs px-3 py-2 rounded-lg border ${msg.kind === 'ok' ? 'bg-neon-green/10 border-neon-green/30 text-neon-green' : 'bg-neon-red/10 border-neon-red/30 text-neon-red'}`}>{msg.text}</p>}
        <button disabled={busy} className="btn-primary justify-center disabled:opacity-60">
          {busy ? <><Loader2 className="h-4 w-4 animate-spin"/> Posting…</> : 'Post testimonial'}
        </button>
      </form>
    </section>
  );
}

// ---- EmailVerifyBanner -------------------------------------------------
// Surfaced at the top of the dashboard for any signed-in user whose
// emailVerifiedAt is unset. Sends/confirms the six-digit OTP code.
export function EmailVerifyBanner({ user }) {
  const [sent, setSent] = useState(false);
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState(null);
  const [hidden, setHidden] = useState(false);
  if (!user || user.emailVerifiedAt || hidden) return null;
  const send = async () => {
    setBusy(true); setMsg(null);
    try { await api.post('/api/auth/send-verification', {}); setSent(true); setMsg({ kind: 'ok', text: 'Code sent — check your inbox.' }); }
    catch (e) { setMsg({ kind: 'err', text: e.message }); }
    finally { setBusy(false); }
  };
  const confirm = async (e) => {
    e.preventDefault();
    setBusy(true); setMsg(null);
    try {
      await api.post('/api/auth/verify-email', { code });
      setMsg({ kind: 'ok', text: 'Email verified.' });
      // Hide after a brief moment so the user sees the confirmation.
      setTimeout(() => setHidden(true), 1200);
    } catch (e) {
      setMsg({ kind: 'err', text: e.message });
    } finally { setBusy(false); }
  };
  return (
    <section className="glass border border-gold-500/30 bg-gold-500/5 p-4 flex flex-col sm:flex-row sm:items-center gap-3">
      <ShieldAlert className="h-5 w-5 text-gold-400 shrink-0"/>
      <div className="flex-1">
        <p className="text-sm font-medium">Verify your email to unlock withdrawals.</p>
        <p className="text-xs text-white/60">We sent the code to {user.email}. Withdrawals are limited until your inbox is confirmed.</p>
      </div>
      {!sent ? (
        <button onClick={send} disabled={busy} className="btn-primary text-sm disabled:opacity-60">
          {busy ? <><Loader2 className="h-4 w-4 animate-spin"/> Sending…</> : 'Send verification code'}
        </button>
      ) : (
        <form onSubmit={confirm} className="flex gap-2 items-center">
          <input
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
            inputMode="numeric"
            placeholder="123456"
            className="w-28 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm font-mono outline-none focus:border-gold-400/40 tracking-widest text-center"
          />
          <button disabled={busy || code.length !== 6} className="btn-primary text-sm disabled:opacity-60">
            {busy ? <Loader2 className="h-4 w-4 animate-spin"/> : 'Verify'}
          </button>
        </form>
      )}
      {msg && (
        <span className={`text-xs ${msg.kind === 'ok' ? 'text-neon-green' : 'text-neon-red'}`}>{msg.text}</span>
      )}
    </section>
  );
}

// ---- NotificationBell --------------------------------------------------
// Replaces the placeholder Bell in the top bar. Polls /api/notifications
// every 30s and opens a dropdown of unread broadcasts + per-user
// notifications. Marking-all-read is one click.
export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState([]);
  const [unread, setUnread] = useState(0);
  const reload = async () => {
    try {
      const r = await api.get('/api/notifications');
      setItems(r.items || []);
      setUnread(r.unread || 0);
    } catch (_) {}
  };
  useEffect(() => {
    reload();
    const t = window.setInterval(reload, 30_000);
    return () => window.clearInterval(t);
  }, []);
  const markAll = async () => {
    try {
      await api.post('/api/notifications', { ids: 'all' });
      reload();
    } catch (_) {}
  };
  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="relative h-9 w-9 rounded-lg bg-white/5 border border-white/10 inline-flex items-center justify-center hover:bg-white/10"
        aria-label={`Notifications${unread ? ` — ${unread} unread` : ''}`}
        aria-expanded={open}
      >
        <Bell className="h-4 w-4"/>
        {unread > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full text-[10px] bg-neon-orange text-ink-950 font-semibold inline-flex items-center justify-center">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>
      {open && (
        <div className="absolute right-0 mt-2 w-80 max-h-96 overflow-y-auto glass-strong border border-white/10 rounded-xl shadow-glass z-40" role="dialog" aria-label="Notifications">
          <div className="flex items-center justify-between p-3 border-b border-white/10">
            <span className="text-sm font-display">Notifications</span>
            <div className="flex items-center gap-1">
              {unread > 0 && (
                <button onClick={markAll} className="text-[11px] text-white/65 hover:text-white px-2 py-1 rounded hover:bg-white/5">Mark all read</button>
              )}
              <button onClick={() => setOpen(false)} aria-label="Close" className="h-7 w-7 rounded-md hover:bg-white/10 inline-flex items-center justify-center">
                <BellClose className="h-3.5 w-3.5"/>
              </button>
            </div>
          </div>
          {items.length === 0 ? (
            <p className="text-xs text-white/55 p-4">You&apos;re all caught up.</p>
          ) : (
            <ul className="divide-y divide-white/5">
              {items.map((n) => (
                <li key={n.id} className={`p-3 ${n.read ? 'opacity-70' : ''}`}>
                  <div className="flex items-start gap-2">
                    <span className={`h-2 w-2 rounded-full mt-1.5 shrink-0 ${n.read ? 'bg-white/20' : 'bg-neon-orange'}`}/>
                    <div className="flex-1">
                      <p className="text-sm font-medium">{n.title || (n.kind === 'broadcast' ? 'Broadcast' : 'Notification')}</p>
                      {n.body && <p className="text-xs text-white/65 mt-0.5">{n.body}</p>}
                      <p className="text-[10px] text-white/40 mt-1">{new Date(n.createdAt).toLocaleString()}</p>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

// =============================================================
// Open / recent orders panel — limit & stop orders driven by the
// server-side settler (src/lib/server/orders.js).
// =============================================================
export function OpenOrdersPanel({ refreshKey, onPlaced }) {
  const { user } = useSession();
  const [orders, setOrders] = useState([]);
  const [open, setOpen] = useState(false);
  const [busyId, setBusyId] = useState(null);
  const [msg, setMsg] = useState(null);
  const load = async () => {
    try {
      const r = await api.get('/api/orders');
      setOrders(r.orders || []);
    } catch (_) { setOrders([]); }
  };
  useEffect(() => {
    if (!user) return undefined;
    load();
    const id = setInterval(load, 7000);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, refreshKey]);
  if (!user) return null;
  const cancel = async (oid) => {
    setBusyId(oid); setMsg(null);
    try {
      await api.del(`/api/orders?id=${encodeURIComponent(oid)}`);
      await load();
    } catch (e) { setMsg(e.message); } finally { setBusyId(null); }
  };
  const openOnly = orders.filter((o) => o.status === 'open');
  return (
    <>
      <section className="glass-strong p-5">
        <div className="flex items-center flex-wrap gap-2 mb-3">
          <h3 className="font-display text-lg">Open orders</h3>
          <span className="chip bg-white/5 border border-white/10 text-white/65">{openOnly.length} open</span>
          <button
            onClick={() => setOpen(true)}
            className="ml-auto btn-primary text-xs"
          >+ New limit / stop order</button>
        </div>
        {msg && <p className="text-xs text-neon-red bg-neon-red/10 border border-neon-red/30 rounded-lg px-3 py-2 mb-2">{msg}</p>}
        {orders.length === 0 ? (
          <p className="text-sm text-white/55">No orders yet. Place a limit order to buy the dip or take profit at a target price.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="text-xs text-white/50 text-left">
                <tr>
                  <th className="py-2 font-medium">When</th>
                  <th className="py-2 font-medium">Side</th>
                  <th className="py-2 font-medium">Kind</th>
                  <th className="py-2 font-medium">Asset</th>
                  <th className="py-2 font-medium">Trigger</th>
                  <th className="py-2 font-medium">Size</th>
                  <th className="py-2 font-medium">Status</th>
                  <th className="py-2 font-medium text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {orders.slice(0, 25).map((o) => (
                  <tr key={o.id}>
                    <td className="py-2.5 text-white/55 text-xs">{new Date(o.createdAt).toLocaleString()}</td>
                    <td>
                      <span className={`chip border ${o.side === 'buy' ? 'bg-neon-green/15 text-neon-green border-neon-green/30' : 'bg-neon-orange/15 text-neon-orange border-neon-orange/30'}`}>{o.side}</span>
                    </td>
                    <td className="text-white/80">{o.kind}</td>
                    <td>{o.symbol}</td>
                    <td>${Number(o.price).toLocaleString(undefined, { maximumFractionDigits: 6 })}</td>
                    <td className="text-xs text-white/70">
                      {o.side === 'buy' ? `$${Number(o.usd).toFixed(2)}` : `${Number(o.qty).toFixed(8)} ${o.symbol}`}
                    </td>
                    <td>
                      <span className={`chip border ${
                        o.status === 'open' ? 'bg-white/5 text-white/80 border-white/10' :
                        o.status === 'filled' ? 'bg-neon-green/15 text-neon-green border-neon-green/30' :
                        o.status === 'rejected' ? 'bg-neon-red/15 text-neon-red border-neon-red/30' :
                        'bg-white/5 text-white/55 border-white/10'
                      }`}>{o.status}</span>
                      {o.rejectedReason && <span className="block text-[10px] text-white/45 mt-1">{o.rejectedReason}</span>}
                    </td>
                    <td className="text-right">
                      {o.status === 'open' ? (
                        <button
                          onClick={() => cancel(o.id)}
                          disabled={busyId === o.id}
                          className="px-2 py-1 rounded bg-white/5 border border-white/10 hover:bg-white/10 text-xs disabled:opacity-60"
                        >{busyId === o.id ? '…' : 'Cancel'}</button>
                      ) : <span className="text-[11px] text-white/30">—</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
      <PlaceOrderModal
        open={open}
        onClose={() => setOpen(false)}
        onPlaced={() => { load(); onPlaced && onPlaced(); }}
      />
    </>
  );
}

const ORDER_SYMBOLS = ['BTC','ETH','SOL','XRP','BNB','ADA','DOGE','AVAX','LINK','LTC','TRX','DOT','MATIC','TON','ATOM','NEAR','APT','ARB','OP','SUI','FIL','INJ','SHIB','PEPE','BCH','ETC','XLM','ALGO','HBAR'];

function PlaceOrderModal({ open, onClose, onPlaced }) {
  const [side, setSide] = useState('buy');
  const [kind, setKind] = useState('limit');
  const [symbol, setSymbol] = useState('BTC');
  const [price, setPrice] = useState('');
  const [usd, setUsd] = useState('100');
  const [qty, setQty] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  useEffect(() => { if (open) { setError(null); } }, [open]);
  if (!open) return null;
  const submit = async (e) => {
    e.preventDefault();
    setBusy(true); setError(null);
    try {
      const body = { side, kind, symbol, price: parseFloat(price) };
      if (side === 'buy') body.usd = parseFloat(usd);
      else body.qty = parseFloat(qty);
      await api.post('/api/orders', body);
      onPlaced && onPlaced();
      onClose();
    } catch (err) { setError(err.message); } finally { setBusy(false); }
  };
  const hint = (() => {
    if (kind === 'limit' && side === 'buy') return 'Fills when the live price falls to or below your trigger.';
    if (kind === 'limit' && side === 'sell') return 'Fills when the live price rises to or above your trigger.';
    if (kind === 'stop' && side === 'buy') return 'Fills when the live price rises to or above your trigger (breakout).';
    if (kind === 'stop' && side === 'sell') return 'Fills when the live price falls to or below your trigger (stop loss).';
    return '';
  })();
  return (
    <div onClick={onClose} className="fixed inset-0 z-50 bg-ink-950/70 backdrop-blur-sm flex items-end sm:items-center justify-center p-4">
      <div onClick={(e) => e.stopPropagation()} className="glass-strong w-full max-w-md p-6 relative">
        <div className="flex items-center gap-2 mb-4">
          <h3 className="text-lg font-display flex-1">Place limit / stop order</h3>
          <button onClick={onClose} aria-label="Close" className="h-8 w-8 rounded-lg hover:bg-white/10 inline-flex items-center justify-center"><BellClose className="h-4 w-4"/></button>
        </div>
        <form onSubmit={submit} className="space-y-3">
          <div className="grid grid-cols-2 gap-2">
            <div className="flex rounded-lg overflow-hidden border border-white/10">
              <button type="button" onClick={() => setSide('buy')} className={`flex-1 py-2 text-xs ${side === 'buy' ? 'bg-neon-green/20 text-neon-green' : 'bg-white/5 text-white/65'}`}>Buy</button>
              <button type="button" onClick={() => setSide('sell')} className={`flex-1 py-2 text-xs ${side === 'sell' ? 'bg-neon-orange/20 text-neon-orange' : 'bg-white/5 text-white/65'}`}>Sell</button>
            </div>
            <div className="flex rounded-lg overflow-hidden border border-white/10">
              <button type="button" onClick={() => setKind('limit')} className={`flex-1 py-2 text-xs ${kind === 'limit' ? 'bg-gold-400/20 text-gold-400' : 'bg-white/5 text-white/65'}`}>Limit</button>
              <button type="button" onClick={() => setKind('stop')} className={`flex-1 py-2 text-xs ${kind === 'stop' ? 'bg-gold-400/20 text-gold-400' : 'bg-white/5 text-white/65'}`}>Stop</button>
            </div>
          </div>
          <label className="block">
            <span className="text-xs text-white/55">Asset</span>
            <select value={symbol} onChange={(e) => setSymbol(e.target.value)} className="mt-1 w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm outline-none">
              {ORDER_SYMBOLS.map((s) => <option key={s} value={s} className="bg-ink-900">{s}</option>)}
            </select>
          </label>
          <label className="block">
            <span className="text-xs text-white/55">Trigger price (USD)</span>
            <input value={price} onChange={(e) => setPrice(e.target.value)} required inputMode="decimal" placeholder="e.g. 65000" className="mt-1 w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm outline-none focus:border-gold-400/40"/>
          </label>
          {side === 'buy' ? (
            <label className="block">
              <span className="text-xs text-white/55">USD to spend at fill</span>
              <input value={usd} onChange={(e) => setUsd(e.target.value)} required inputMode="decimal" className="mt-1 w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm outline-none focus:border-gold-400/40"/>
            </label>
          ) : (
            <label className="block">
              <span className="text-xs text-white/55">Quantity of {symbol} to sell</span>
              <input value={qty} onChange={(e) => setQty(e.target.value)} required inputMode="decimal" placeholder="e.g. 0.05" className="mt-1 w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm outline-none focus:border-gold-400/40"/>
            </label>
          )}
          <p className="text-[11px] text-white/55">{hint} A taker fee applies on fill.</p>
          {error && <p className="text-xs text-neon-red bg-neon-red/10 border border-neon-red/30 rounded-lg px-3 py-2">{error}</p>}
          <button disabled={busy} className="btn-primary w-full justify-center disabled:opacity-60">
            {busy ? <><Loader2 className="h-4 w-4 animate-spin"/> Placing…</> : `Place ${kind} ${side} order`}
          </button>
        </form>
      </div>
    </div>
  );
}

// =============================================================
// BeneficiariesPanel — whitelisted withdrawal address book with
// 48-hour cool-down on additions and OFAC sanctions screening.
// =============================================================
const BEN_SYMBOLS = ['BTC','ETH','SOL','XRP','BNB','ADA','DOGE','AVAX','LINK','LTC','TRX','DOT','MATIC','TON','ATOM','NEAR','APT','ARB','OP','SUI','FIL','INJ','SHIB','PEPE','BCH','ETC','XLM','ALGO','HBAR','USDT'];
const BEN_MEMO = new Set(['XRP','ATOM','EOS','TON','HBAR','XLM']);

export function BeneficiariesPanel() {
  const { user } = useSession();
  const [items, setItems] = useState([]);
  const [open, setOpen] = useState(false);
  const [msg, setMsg] = useState(null);
  const [busyId, setBusyId] = useState(null);
  const load = async () => {
    try {
      const r = await api.get('/api/beneficiaries');
      setItems(r.beneficiaries || []);
    } catch (_) { setItems([]); }
  };
  useEffect(() => {
    if (!user) return undefined;
    load();
    const id = setInterval(load, 30000);
    return () => clearInterval(id);
  }, [user]);
  const activeCount = useMemo(() => items.filter((b) => b.status === 'active').length, [items]);
  if (!user) return null;
  const remove = async (id) => {
    if (!confirm('Remove this beneficiary? Past withdrawals to it are unaffected.')) return;
    setBusyId(id); setMsg(null);
    try {
      await api.del(`/api/beneficiaries?id=${encodeURIComponent(id)}`);
      await load();
    } catch (e) { setMsg(e.message); } finally { setBusyId(null); }
  };
  return (
    <>
      <section className="glass-strong p-5">
        <div className="flex items-center flex-wrap gap-2 mb-3">
          <h3 className="font-display text-lg">Withdrawal address book</h3>
          <span className="chip bg-white/5 border border-white/10 text-white/65">{activeCount} active</span>
          <button onClick={() => setOpen(true)} className="ml-auto btn-primary text-xs">+ Add beneficiary</button>
        </div>
        <p className="text-xs text-white/55 mb-3">
          Whitelisted addresses pass an OFAC sanctions check and a 48-hour security cool-down after email confirmation before they can receive funds.
        </p>
        {msg && <p className="text-xs text-neon-red bg-neon-red/10 border border-neon-red/30 rounded-lg px-3 py-2 mb-2">{msg}</p>}
        {items.length === 0 ? (
          <p className="text-sm text-white/55">No saved beneficiaries yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="text-xs text-white/50 text-left">
                <tr>
                  <th className="py-2 font-medium">Label</th>
                  <th className="py-2 font-medium">Asset</th>
                  <th className="py-2 font-medium">Address</th>
                  <th className="py-2 font-medium">Status</th>
                  <th className="py-2 font-medium text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {items.map((b) => (
                  <tr key={b.id}>
                    <td className="py-2.5">{b.label}</td>
                    <td>{b.symbol}{b.network ? <span className="text-[10px] text-white/40 ml-1">{b.network}</span> : null}</td>
                    <td className="font-mono text-[11px] text-white/65 truncate max-w-[14rem]">
                      {b.address}
                      {b.memo && <span className="block text-white/40">memo: {b.memo}</span>}
                    </td>
                    <td>
                      {b.status === 'active' && <span className="chip bg-neon-green/15 text-neon-green border border-neon-green/30">active</span>}
                      {b.status === 'cooling-down' && <span className="chip bg-gold-400/15 text-gold-400 border border-gold-400/30" title={`Usable from ${new Date(b.usableAt).toLocaleString()}`}>cool-down</span>}
                      {b.status === 'pending-email' && <span className="chip bg-white/5 text-white/65 border border-white/10">awaiting email</span>}
                    </td>
                    <td className="text-right">
                      <button
                        onClick={() => remove(b.id)}
                        disabled={busyId === b.id}
                        className="px-2 py-1 rounded bg-white/5 border border-white/10 hover:bg-white/10 text-xs disabled:opacity-60"
                      >{busyId === b.id ? '…' : 'Remove'}</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
      <AddBeneficiaryModal open={open} onClose={() => setOpen(false)} onAdded={load} />
    </>
  );
}

function AddBeneficiaryModal({ open, onClose, onAdded }) {
  const [label, setLabel] = useState('');
  const [symbol, setSymbol] = useState('BTC');
  const [address, setAddress] = useState('');
  const [memo, setMemo] = useState('');
  const [network, setNetwork] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const [done, setDone] = useState(false);
  useEffect(() => { if (open) { setError(null); setDone(false); setLabel(''); setAddress(''); setMemo(''); setNetwork(''); } }, [open]);
  if (!open) return null;
  const submit = async (e) => {
    e.preventDefault();
    setBusy(true); setError(null);
    try {
      await api.post('/api/beneficiaries', { label, symbol, address, memo, network });
      setDone(true);
      onAdded && onAdded();
    } catch (err) { setError(err.message); } finally { setBusy(false); }
  };
  return (
    <div onClick={onClose} className="fixed inset-0 z-50 bg-ink-950/70 backdrop-blur-sm flex items-end sm:items-center justify-center p-4">
      <div onClick={(e) => e.stopPropagation()} className="glass-strong w-full max-w-md p-6 relative">
        <div className="flex items-center gap-2 mb-4">
          <h3 className="text-lg font-display flex-1">Add beneficiary</h3>
          <button onClick={onClose} aria-label="Close" className="h-8 w-8 rounded-lg hover:bg-white/10 inline-flex items-center justify-center"><BellClose className="h-4 w-4"/></button>
        </div>
        {done ? (
          <div className="text-sm space-y-3">
            <p>We&apos;ve emailed you a confirmation link. After you click it the address will enter a <b>48-hour cool-down</b> before it can receive funds.</p>
            <button onClick={onClose} className="btn-primary w-full justify-center">Done</button>
          </div>
        ) : (
        <form onSubmit={submit} className="space-y-3">
          <label className="block">
            <span className="text-xs text-white/55">Label</span>
            <input value={label} onChange={(e) => setLabel(e.target.value)} required maxLength={60} placeholder="e.g. Cold storage Ledger" className="mt-1 w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm outline-none"/>
          </label>
          <label className="block">
            <span className="text-xs text-white/55">Asset</span>
            <select value={symbol} onChange={(e) => setSymbol(e.target.value)} className="mt-1 w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm outline-none">
              {BEN_SYMBOLS.map((s) => <option key={s} value={s} className="bg-ink-900">{s}</option>)}
            </select>
          </label>
          <label className="block">
            <span className="text-xs text-white/55">Network (optional)</span>
            <input value={network} onChange={(e) => setNetwork(e.target.value)} maxLength={50} placeholder="e.g. ERC20, TRC20" className="mt-1 w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm outline-none"/>
          </label>
          <label className="block">
            <span className="text-xs text-white/55">Address</span>
            <input value={address} onChange={(e) => setAddress(e.target.value)} required className="mt-1 w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm outline-none font-mono"/>
          </label>
          {BEN_MEMO.has(symbol) && (
            <label className="block">
              <span className="text-xs text-white/55">Memo / destination tag (required)</span>
              <input value={memo} onChange={(e) => setMemo(e.target.value)} required className="mt-1 w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm outline-none font-mono"/>
            </label>
          )}
          {error && <p className="text-xs text-neon-red bg-neon-red/10 border border-neon-red/30 rounded-lg px-3 py-2">{error}</p>}
          <p className="text-[11px] text-white/55">After saving, check your email for the confirmation link. A 48-hour cool-down then applies before the first withdrawal.</p>
          <button disabled={busy} className="btn-primary w-full justify-center disabled:opacity-60">
            {busy ? <><Loader2 className="h-4 w-4 animate-spin"/> Saving…</> : 'Save & send confirmation email'}
          </button>
        </form>
        )}
      </div>
    </div>
  );
}

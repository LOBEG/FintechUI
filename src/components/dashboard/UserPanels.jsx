'use client';
import { useEffect, useMemo, useState } from 'react';
import { Copy, Wallet, Check, Search, MessageSquare, Star, Loader2, ShieldAlert, Bell, X as BellClose, ArrowRightLeft, Rocket, LifeBuoy, Send, ChevronDown, ChevronUp } from 'lucide-react';
import QRCode from 'qrcode';
import { api, useSession } from '@/lib/useSession';
import { cryptoLogoStyle } from '@/lib/cryptoLogos';

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
// Deposit addresses panel - shown on /dashboard for signed-in users.
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
// Markets panel - live prices of all supported crypto.
// =============================================================
export function MarketsPanel({ onInvest }) {
  const { user } = useSession();
  const [rows, setRows] = useState([]);
  const [q, setQ] = useState('');
  const [watchlist, setWatchlist] = useState([]); // base symbols
  // Column sort. Click a header to toggle asc/desc; clicking a different
  // column resets to desc (the more useful direction for price/volume).
  const [sortBy, setSortBy] = useState(null); // 'price' | 'pct' | 'volume' | null
  const [sortDir, setSortDir] = useState('desc');
  const requestSort = (col) => {
    if (sortBy === col) setSortDir((d) => (d === 'desc' ? 'asc' : 'desc'));
    else { setSortBy(col); setSortDir('desc'); }
  };
  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        const r = await api.get('/api/markets');
        // Avoid clobbering a populated table with an empty response -
        // Binance occasionally returns [] under rate-limit and we don't
        // want the UI to flash empty.
        if (mounted && Array.isArray(r.markets) && r.markets.length) setRows(r.markets);
      } catch (_) {}
    };
    load();
    const id = setInterval(load, 15000);
    return () => { mounted = false; clearInterval(id); };
  }, []);
  useEffect(() => {
    let cancelled = false;
    if (!user) { setWatchlist([]); return; }
    (async () => {
      try {
        const r = await api.get('/api/watchlist');
        if (!cancelled) setWatchlist(Array.isArray(r.symbols) ? r.symbols : []);
      } catch (_) { /* tolerate */ }
    })();
    return () => { cancelled = true; };
  }, [user]);
  const toggleFavourite = async (symbol) => {
    if (!user) return;
    const had = watchlist.includes(symbol);
    // Optimistic update.
    setWatchlist((prev) => had ? prev.filter((s) => s !== symbol) : [...prev, symbol]);
    try {
      const r = await api.post('/api/watchlist', { symbol });
      if (Array.isArray(r?.symbols)) setWatchlist(r.symbols);
    } catch (_) {
      // Revert on failure.
      setWatchlist((prev) => had ? [...prev, symbol] : prev.filter((s) => s !== symbol));
    }
  };
  const authHref = (symbol) => `/login?next=/dashboard&asset=${encodeURIComponent(symbol)}`;
  const handleInvest = (symbol) => {
    if (!user) {
      window.location.href = authHref(symbol);
      return;
    }
    onInvest && onInvest(symbol);
  };
  const filtered = rows.filter((r) => {
    if (!q) return true;
    const s = q.toLowerCase();
    return r.symbol.toLowerCase().includes(s) || r.name.toLowerCase().includes(s);
  });
  // Apply column sort if one is active. Missing values sort to the end so
  // a freshly-rendered table with one slow row doesn't claim first place.
  const sorted = sortBy
    ? filtered.slice().sort((a, b) => {
      const av = a[sortBy]; const bv = b[sortBy];
      const aMissing = av == null || !isFinite(av);
      const bMissing = bv == null || !isFinite(bv);
      if (aMissing && bMissing) return 0;
      if (aMissing) return 1;
      if (bMissing) return -1;
      return sortDir === 'asc' ? av - bv : bv - av;
    })
    : filtered;
  const sortIndicator = (col) => {
    if (sortBy !== col) return null;
    return <span aria-hidden className="ml-1 text-white/60">{sortDir === 'asc' ? '▲' : '▼'}</span>;
  };
  const sortableHeader = (col, label, extraClass = '') => (
    <th
      className={`py-2 font-medium ${extraClass}`}
      aria-sort={sortBy === col ? (sortDir === 'asc' ? 'ascending' : 'descending') : 'none'}
    >
      <button
        type="button"
        onClick={() => requestSort(col)}
        className="inline-flex items-center hover:text-white/80"
      >
        {label}{sortIndicator(col)}
      </button>
    </th>
  );
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
              {user && <th className="py-2 font-medium w-6"><span className="sr-only">Favourite</span></th>}
              <th className="py-2 font-medium">Asset</th>
              {sortableHeader('price', 'Price')}
              {sortableHeader('pct', '24h')}
              <th className="py-2 font-medium hidden md:table-cell">24h High</th>
              <th className="py-2 font-medium hidden md:table-cell">24h Low</th>
              {sortableHeader('volume', '24h Volume (USD)', 'hidden lg:table-cell')}
              <th className="py-2 font-medium text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {sorted.map((r) => {
              const fav = watchlist.includes(r.symbol);
              return (
              <tr key={r.symbol}>
                {user && (
                  <td className="py-2.5 w-6">
                    <button
                      onClick={() => toggleFavourite(r.symbol)}
                      className={fav ? 'text-neon-gold' : 'text-white/35 hover:text-white/70'}
                      aria-label={fav ? `Remove ${r.symbol} from watchlist` : `Add ${r.symbol} to watchlist`}
                      title={fav ? 'Remove from watchlist' : 'Add to watchlist'}
                    >
                      <Star className={`h-3.5 w-3.5 ${fav ? 'fill-current' : ''}`}/>
                    </button>
                  </td>
                )}
                <td className="py-2.5">
                  <a href={user ? `/markets/${r.symbol}` : authHref(r.symbol)} className="flex items-center gap-2 hover:text-neon-gold">
                    <span className="h-6 w-6 rounded-full inline-flex items-center justify-center text-[10px] font-semibold text-ink-950 bg-white/5 border border-white/10" style={cryptoLogoStyle(r.symbol) || { background: r.color }}>
                      {!cryptoLogoStyle(r.symbol) && r.symbol.slice(0, 2)}
                    </span>
                    <div>
                      <div className="font-medium">{r.symbol}</div>
                      <div className="text-[11px] text-white/45">{r.name}</div>
                    </div>
                  </a>
                </td>
                <td>{r.price ? `$${r.price.toLocaleString(undefined, { maximumFractionDigits: r.price < 1 ? 6 : 2 })}` : 'Connecting'}</td>
                <td className={r.pct >= 0 ? 'text-neon-green' : 'text-neon-red'}>{r.pct >= 0 ? '+' : ''}{r.pct?.toFixed(2)}%</td>
                <td className="hidden md:table-cell text-white/70">{r.high ? `$${r.high.toLocaleString(undefined, { maximumFractionDigits: 2 })}` : 'Connecting'}</td>
                <td className="hidden md:table-cell text-white/70">{r.low ? `$${r.low.toLocaleString(undefined, { maximumFractionDigits: 2 })}` : 'Connecting'}</td>
                <td className="hidden lg:table-cell text-white/55">{r.volume ? `$${(r.volume / 1e6).toFixed(2)}M` : 'Connecting'}</td>
                <td className="text-right">
                  <button onClick={() => handleInvest(r.symbol)} className="px-2.5 py-1 rounded bg-neon-green/15 text-neon-green hover:bg-neon-green/25 text-xs">Invest</button>
                </td>
              </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}

// =============================================================
// Sandbox on-ramp panel - shown only when the deployment exposes
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
// Testimonial submission form - shown on /dashboard for eligible users.
// =============================================================
export function TestimonialComposer() {
  const { user } = useSession();
  const [text, setText] = useState('');
  const [role, setRole] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [rating, setRating] = useState(5);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState(null);
  if (!user) return null;
  const submit = async (e) => {
    e.preventDefault(); setBusy(true); setMsg(null);
    try {
      const r = await api.post('/api/testimonials', { text, role, rating, avatarUrl });
      const pending = r.testimonial && r.testimonial.status === 'pending';
      setMsg({ kind: 'ok', text: pending ? 'Thanks! Your testimonial is pending moderation.' : 'Thanks! Your testimonial is now live.' });
      setText('');
      setAvatarUrl('');
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
          <input value={role} onChange={(e) => setRole(e.target.value)} placeholder="Your role (optional) - e.g. Portfolio Manager" className="flex-1 min-w-[200px] bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm outline-none"/>
          <input type="url" value={avatarUrl} onChange={(e) => setAvatarUrl(e.target.value)} placeholder="Public photo URL (optional, https only)" className="flex-1 min-w-[240px] bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm outline-none"/>
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
    try { await api.post('/api/auth/send-verification', {}); setSent(true); setMsg({ kind: 'ok', text: 'Code sent - check your inbox.' }); }
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
        aria-label={`Notifications${unread ? ` - ${unread} unread` : ''}`}
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
// Open / recent orders panel - limit & stop orders driven by the
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
                      ) : <span className="text-[11px] text-white/30">-</span>}
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
// BeneficiariesPanel - whitelisted withdrawal address book with
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

// =============================================================
// KycPanel - current KYC tier with daily/monthly usage bars and
// upgrade form for the next tier.
// =============================================================
export function KycPanel() {
  const { user } = useSession();
  const [data, setData] = useState(null);
  const [open, setOpen] = useState(false);
  const load = async () => {
    try {
      const r = await api.get('/api/kyc');
      setData(r);
    } catch (_) { setData(null); }
  };
  useEffect(() => {
    if (!user) return undefined;
    load();
    const id = setInterval(load, 30000);
    return () => clearInterval(id);
  }, [user]);
  if (!user || !data) return null;
  const { summary, pendingSubmission, emailVerifiedAt } = data;
  const nextTier = summary.tier < 3 ? summary.tier + 1 : null;
  const pct = (used, lim) => (lim > 0 ? Math.min(100, (used / lim) * 100) : (used > 0 ? 100 : 0));
  return (
    <>
      <section className="glass-strong p-5">
        <div className="flex items-center flex-wrap gap-2 mb-3">
          <h3 className="font-display text-lg">KYC verification</h3>
          <span className="chip bg-gold-400/15 text-gold-300 border border-gold-400/30">{summary.label}</span>
          {pendingSubmission && (
            <span className="chip bg-white/5 border border-white/10 text-white/65">Tier {pendingSubmission.requestedTier} pending</span>
          )}
          {nextTier && !pendingSubmission && (
            <button onClick={() => setOpen(true)} className="ml-auto btn-primary text-xs">Upgrade to Tier {nextTier}</button>
          )}
        </div>
        {summary.tier === 0 ? (
          <p className="text-sm text-white/65">
            Tier 0 accounts cannot withdraw. {emailVerifiedAt ? 'Submit your phone number to reach Tier 1 ($1,000/day).' : 'Verify your email first, then submit your phone number to reach Tier 1.'}
          </p>
        ) : (
          <div className="grid sm:grid-cols-2 gap-4">
            <UsageBar title="Daily withdrawals" used={summary.daily.used} limit={summary.daily.limit} pct={pct(summary.daily.used, summary.daily.limit)} />
            <UsageBar title="30-day withdrawals" used={summary.monthly.used} limit={summary.monthly.limit} pct={pct(summary.monthly.used, summary.monthly.limit)} />
          </div>
        )}
      </section>
      <KycUpgradeModal open={open} onClose={() => setOpen(false)} requestedTier={nextTier} onSubmitted={() => { setOpen(false); load(); }} />
    </>
  );
}

function UsageBar({ title, used, limit, pct }) {
  return (
    <div>
      <div className="flex justify-between text-xs text-white/55 mb-1">
        <span>{title}</span>
        <span>${(used || 0).toLocaleString(undefined, { maximumFractionDigits: 2 })} / ${Number(limit || 0).toLocaleString()}</span>
      </div>
      <div className="h-2 bg-white/5 rounded-full overflow-hidden">
        <div
          className={`h-full ${pct > 90 ? 'bg-neon-red' : pct > 70 ? 'bg-gold-400' : 'bg-neon-green'}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

function KycUpgradeModal({ open, onClose, requestedTier, onSubmitted }) {
  const [form, setForm] = useState({});
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  useEffect(() => { if (open) { setForm({}); setError(null); } }, [open]);
  if (!open || !requestedTier) return null;
  const submit = async (e) => {
    e.preventDefault();
    setBusy(true); setError(null);
    try {
      await api.post('/api/kyc', { requestedTier, ...form });
      onSubmitted && onSubmitted();
    } catch (err) { setError(err.message); } finally { setBusy(false); }
  };
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));
  return (
    <div onClick={onClose} className="fixed inset-0 z-50 bg-ink-950/70 backdrop-blur-sm flex items-end sm:items-center justify-center p-4">
      <div onClick={(e) => e.stopPropagation()} className="glass-strong w-full max-w-md p-6">
        <div className="flex items-center gap-2 mb-4">
          <h3 className="text-lg font-display flex-1">Upgrade to Tier {requestedTier}</h3>
          <button onClick={onClose} aria-label="Close" className="h-8 w-8 rounded-lg hover:bg-white/10 inline-flex items-center justify-center"><BellClose className="h-4 w-4"/></button>
        </div>
        <form onSubmit={submit} className="space-y-3 text-sm">
          {requestedTier === 1 && (
            <>
              <p className="text-white/65">Tier 1 raises your withdrawal cap to $1,000/day. Provide a phone number our compliance desk can reach you on.</p>
              <label className="block">
                <span className="text-xs text-white/55">Phone number</span>
                <input required value={form.phone || ''} onChange={set('phone')} placeholder="+44 7700 900123" className="mt-1 w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 outline-none"/>
              </label>
            </>
          )}
          {requestedTier === 2 && (
            <>
              <p className="text-white/65">Tier 2 raises your cap to $25,000/day. Provide ID document details - the compliance desk will email you to upload the file securely.</p>
              <label className="block">
                <span className="text-xs text-white/55">Document type</span>
                <select required value={form.idDocType || ''} onChange={set('idDocType')} className="mt-1 w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 outline-none">
                  <option value="" className="bg-ink-900">Select…</option>
                  <option className="bg-ink-900">Passport</option>
                  <option className="bg-ink-900">National ID card</option>
                  <option className="bg-ink-900">Driving licence</option>
                </select>
              </label>
              <label className="block">
                <span className="text-xs text-white/55">Document number</span>
                <input required value={form.idDocRef || ''} onChange={set('idDocRef')} className="mt-1 w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 outline-none"/>
              </label>
              <div className="grid grid-cols-2 gap-3">
                <label className="block">
                  <span className="text-xs text-white/55">Date of birth</span>
                  <input required type="date" value={form.dob || ''} onChange={set('dob')} className="mt-1 w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 outline-none"/>
                </label>
                <label className="block">
                  <span className="text-xs text-white/55">Country</span>
                  <input required value={form.country || ''} onChange={set('country')} className="mt-1 w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 outline-none"/>
                </label>
              </div>
            </>
          )}
          {requestedTier === 3 && (
            <>
              <p className="text-white/65">Tier 3 is the enhanced limit ($1M/day). Provide proof-of-address and a brief source-of-funds statement.</p>
              <label className="block">
                <span className="text-xs text-white/55">Residential address</span>
                <textarea required rows={2} value={form.address || ''} onChange={set('address')} className="mt-1 w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 outline-none"/>
              </label>
              <label className="block">
                <span className="text-xs text-white/55">Source of funds</span>
                <textarea required rows={3} value={form.sourceOfFunds || ''} onChange={set('sourceOfFunds')} placeholder="e.g. PAYE salary at <employer>, plus crypto trading P&L since 2019." className="mt-1 w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 outline-none"/>
              </label>
            </>
          )}
          {error && <p className="text-xs text-neon-red bg-neon-red/10 border border-neon-red/30 rounded-lg px-3 py-2">{error}</p>}
          <button disabled={busy} className="btn-primary w-full justify-center disabled:opacity-60">
            {busy ? <><Loader2 className="h-4 w-4 animate-spin"/> Submitting…</> : `Submit for Tier ${requestedTier} review`}
          </button>
        </form>
      </div>
    </div>
  );
}

// =============================================================
// PortfolioPanel - per-position weighted-average cost basis, live
// mark, unrealised P&L, and lifetime realised P&L. Backed by
// /api/portfolio which walks transactions.json chronologically.
// =============================================================
export function PortfolioPanel({ refreshKey }) {
  const { user } = useSession();
  const [data, setData] = useState(null);
  const [busy, setBusy] = useState(false);
  const load = async () => {
    setBusy(true);
    try { const r = await api.get('/api/portfolio'); setData(r); } catch (_) { setData(null); }
    finally { setBusy(false); }
  };
  useEffect(() => {
    if (!user) return undefined;
    load();
    const id = setInterval(load, 20000);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, refreshKey]);
  if (!user) return null;
  if (!data) {
    return (
      <section className="glass-strong p-5">
        <h3 className="font-display text-lg mb-2">Portfolio P&amp;L</h3>
        <p className="text-sm text-white/55 inline-flex items-center gap-2"><Loader2 className="h-4 w-4 animate-spin"/> Loading positions…</p>
      </section>
    );
  }
  const { positions, realisedTotal, costBasisTotal, marketValueTotal, unrealisedTotal } = data;
  const nonQuote = positions.filter((p) => !p.isQuote && p.qty > 0);
  const totalPct = costBasisTotal > 0 ? (unrealisedTotal / costBasisTotal) * 100 : 0;
  return (
    <section className="glass-strong p-5">
      <div className="flex items-center flex-wrap gap-2 mb-4">
        <h3 className="font-display text-lg">Portfolio P&amp;L</h3>
        <span className="chip bg-white/5 border border-white/10 text-white/65">cost-basis weighted</span>
        {busy && <Loader2 className="h-3.5 w-3.5 animate-spin text-white/40"/>}
        <button onClick={load} className="ml-auto text-xs text-white/55 hover:text-white">Refresh</button>
      </div>
      <div className="grid sm:grid-cols-4 gap-3 mb-4 text-sm">
        <Stat label="Market value" value={`$${fmtMoney(marketValueTotal)}`}/>
        <Stat label="Cost basis" value={`$${fmtMoney(costBasisTotal)}`}/>
        <Stat label="Unrealised" value={fmtSigned(unrealisedTotal)} accent={unrealisedTotal >= 0 ? 'green' : 'red'} sub={costBasisTotal > 0 ? `${totalPct >= 0 ? '+' : ''}${totalPct.toFixed(2)}%` : null}/>
        <Stat label="Realised (lifetime)" value={fmtSigned(realisedTotal)} accent={realisedTotal >= 0 ? 'green' : 'red'}/>
      </div>
      {nonQuote.length === 0 ? (
        <p className="text-sm text-white/55">No crypto positions yet. Buy an asset from the markets panel and your cost basis and live P&amp;L will appear here.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-xs text-white/45 text-left">
              <tr>
                <th className="py-2">Asset</th>
                <th>Qty</th>
                <th>Avg cost</th>
                <th>Mark</th>
                <th>Value</th>
                <th>Unrealised</th>
                <th>Realised</th>
              </tr>
            </thead>
            <tbody>
              {nonQuote.map((p) => {
                const up = p.unrealised >= 0;
                return (
                  <tr key={p.symbol} className="border-t border-white/5">
                    <td className="py-2 font-medium">{p.symbol}</td>
                    <td className="font-mono text-xs">{trimQty(p.qty)}</td>
                    <td className="font-mono text-xs">${fmtMoney(p.avgCost)}</td>
                    <td className="font-mono text-xs">${fmtMoney(p.mark)}</td>
                    <td className="font-mono text-xs">${fmtMoney(p.marketValue)}</td>
                    <td className={`font-mono text-xs ${up ? 'text-neon-green' : 'text-neon-red'}`}>
                      {up ? '+' : ''}${fmtMoney(p.unrealised)}
                      <span className="text-white/45"> ({up ? '+' : ''}{p.unrealisedPct.toFixed(2)}%)</span>
                    </td>
                    <td className={`font-mono text-xs ${p.realised >= 0 ? 'text-neon-green' : 'text-neon-red'}`}>
                      {p.realised >= 0 ? '+' : ''}${fmtMoney(p.realised)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

function Stat({ label, value, sub, accent }) {
  const colour = accent === 'green' ? 'text-neon-green' : accent === 'red' ? 'text-neon-red' : '';
  return (
    <div className="rounded-lg bg-white/5 border border-white/10 p-3">
      <div className="text-[11px] uppercase tracking-wide text-white/45">{label}</div>
      <div className={`font-display text-lg ${colour}`}>{value}</div>
      {sub && <div className={`text-xs ${colour}`}>{sub}</div>}
    </div>
  );
}

function fmtMoney(n) {
  const v = Number(n) || 0;
  if (Math.abs(v) >= 1) return v.toLocaleString(undefined, { maximumFractionDigits: 2, minimumFractionDigits: 2 });
  return v.toLocaleString(undefined, { maximumFractionDigits: 6 });
}
function fmtSigned(n) {
  const v = Number(n) || 0;
  return `${v >= 0 ? '+' : ''}$${fmtMoney(Math.abs(v))}`;
}
function trimQty(n) {
  const v = Number(n) || 0;
  if (v === 0) return '0';
  const s = v.toFixed(8);
  return s.replace(/0+$/, '').replace(/\.$/, '');
}

// =============================================================
// PriceAlertsPanel - let users set "notify me when BTC > $80k"
// style rules. Triggers come from the order-settler tick so we
// don't open a second polling loop.
// =============================================================
export function PriceAlertsPanel() {
  const { user } = useSession();
  const [alerts, setAlerts] = useState([]);
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({ symbol: 'BTC', op: 'gt', threshold: '' });
  const [error, setError] = useState('');
  const load = async () => {
    try { const r = await api.get('/api/alerts'); setAlerts(r.alerts || []); }
    catch (_) { /* ignore */ }
  };
  useEffect(() => {
    if (!user) return undefined;
    load();
    // Active alerts can trigger asynchronously on the server tick - poll
    // so the UI flips from active → triggered without a manual refresh.
    const id = setInterval(load, 15000);
    return () => clearInterval(id);
  }, [user]);
  if (!user) return null;
  const submit = async (e) => {
    e.preventDefault();
    setError('');
    const threshold = parseFloat(form.threshold);
    if (!isFinite(threshold) || threshold <= 0) { setError('Threshold must be a positive number'); return; }
    setBusy(true);
    try {
      await api.post('/api/alerts', { symbol: form.symbol, op: form.op, threshold });
      setForm({ ...form, threshold: '' });
      load();
    } catch (err) { setError(err?.message || 'Could not create alert'); }
    finally { setBusy(false); }
  };
  const cancel = async (id) => {
    try { await api.del(`/api/alerts?id=${encodeURIComponent(id)}`); load(); } catch (_) {}
  };
  const active = alerts.filter((a) => a.status === 'active');
  const history = alerts.filter((a) => a.status !== 'active').slice(0, 10);
  return (
    <section className="glass-strong p-5">
      <div className="flex items-center flex-wrap gap-2 mb-3">
        <h3 className="font-display text-lg">Price alerts</h3>
        <span className="chip bg-white/5 border border-white/10 text-white/65">{active.length} active</span>
      </div>
      <form onSubmit={submit} className="grid sm:grid-cols-4 gap-2 mb-3 text-sm">
        <input
          aria-label="Asset symbol"
          value={form.symbol}
          onChange={(e) => setForm({ ...form, symbol: e.target.value.toUpperCase() })}
          className="bg-white/5 border border-white/10 rounded px-2 py-1.5"
          placeholder="BTC"
        />
        <select
          aria-label="Comparator"
          value={form.op}
          onChange={(e) => setForm({ ...form, op: e.target.value })}
          className="bg-white/5 border border-white/10 rounded px-2 py-1.5"
        >
          <option value="gt">rises above</option>
          <option value="lt">falls below</option>
        </select>
        <input
          aria-label="Threshold USD"
          type="number"
          step="0.01"
          min="0"
          value={form.threshold}
          onChange={(e) => setForm({ ...form, threshold: e.target.value })}
          className="bg-white/5 border border-white/10 rounded px-2 py-1.5"
          placeholder="80000"
        />
        <button type="submit" disabled={busy} className="rounded bg-neon-green/90 text-black font-medium px-3 py-1.5 disabled:opacity-60">
          {busy ? 'Adding…' : 'Add alert'}
        </button>
      </form>
      {error && <p className="text-xs text-neon-red mb-2">{error}</p>}
      {active.length === 0 ? (
        <p className="text-sm text-white/55">No active alerts. We&apos;ll email and ping the in-app inbox the moment any rule triggers.</p>
      ) : (
        <ul className="space-y-1 text-sm">
          {active.map((a) => (
            <li key={a.id} className="flex items-center justify-between gap-2 rounded border border-white/5 bg-white/[0.03] px-3 py-1.5">
              <span><b>{a.symbol}</b> {a.op === 'gt' ? '≥' : '≤'} ${Number(a.threshold).toLocaleString()}</span>
              <button onClick={() => cancel(a.id)} className="text-xs text-white/55 hover:text-neon-red">Cancel</button>
            </li>
          ))}
        </ul>
      )}
      {history.length > 0 && (
        <details className="mt-3 text-sm">
          <summary className="cursor-pointer text-white/55">Recent ({history.length})</summary>
          <ul className="mt-2 space-y-1">
            {history.map((a) => (
              <li key={a.id} className="flex items-center justify-between text-xs text-white/55">
                <span>{a.symbol} {a.op === 'gt' ? '≥' : '≤'} ${Number(a.threshold).toLocaleString()}</span>
                <span className={a.status === 'triggered' ? 'text-neon-green' : 'text-white/45'}>
                  {a.status}{a.triggeredPrice ? ` @ $${Number(a.triggeredPrice).toLocaleString()}` : ''}
                </span>
              </li>
            ))}
          </ul>
        </details>
      )}
    </section>
  );
}

// =============================================================
// ConvertPanel - one-tap swap between two assets at live mid +
// a small spread (0.5 % by default). Posts to /api/convert.
// =============================================================
const CONVERT_ASSETS = ['BTC', 'ETH', 'SOL', 'XRP', 'BNB', 'ADA', 'DOGE', 'AVAX', 'MATIC', 'LINK', 'LTC', 'USDT'];

export function ConvertPanel({ onConverted } = {}) {
  const { user } = useSession();
  const [from, setFrom] = useState('BTC');
  const [to, setTo] = useState('USDT');
  const [amount, setAmount] = useState('');
  const [preview, setPreview] = useState(null);
  const [previewBusy, setPreviewBusy] = useState(false);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState(null);
  // Debounced live preview while the user types.
  useEffect(() => {
    if (!user) return;
    const amt = parseFloat(amount);
    if (!isFinite(amt) || amt <= 0 || !from || !to || from === to) {
      setPreview(null); return;
    }
    let cancelled = false;
    setPreviewBusy(true);
    const id = setTimeout(async () => {
      try {
        const r = await api.get(`/api/convert?from=${from}&to=${to}&amount=${amt}`);
        if (!cancelled) setPreview(r);
      } catch (err) {
        if (!cancelled) { setPreview(null); }
      } finally {
        if (!cancelled) setPreviewBusy(false);
      }
    }, 400);
    return () => { cancelled = true; clearTimeout(id); setPreviewBusy(false); };
  }, [user, from, to, amount]);
  if (!user) return null;
  const swap = () => { setFrom(to); setTo(from); setPreview(null); };
  const execute = async (e) => {
    e.preventDefault(); setBusy(true); setMsg(null);
    try {
      const r = await api.post('/api/convert', { from, to, amount: parseFloat(amount) });
      setMsg({ kind: 'ok', text: `Converted ${amount} ${from} → ${r.transactions[1].amount} ${to}.` });
      setAmount(''); setPreview(null);
      onConverted && onConverted(r);
    } catch (err) {
      setMsg({ kind: 'err', text: err.message });
    } finally { setBusy(false); }
  };
  const fromBalance = user.balances?.[from] || 0;
  return (
    <section className="glass-strong p-5">
      <div className="flex items-center gap-2 mb-3">
        <ArrowRightLeft className="h-4 w-4 text-gold-400"/>
        <h3 className="font-display text-lg">Convert</h3>
        <span className="chip bg-white/5 text-white/60 border border-white/10 ml-auto">live mid + spread</span>
      </div>
      <p className="text-xs text-white/55 mb-3">
        Swap directly between any two supported assets at the live Binance mid price.
        A small spread covers the broker leg - no separate trading fee.
      </p>
      <form onSubmit={execute} className="space-y-3">
        <div className="grid sm:grid-cols-[1fr_auto_1fr] gap-2 items-end">
          <label className="block">
            <span className="text-[11px] text-white/55">From</span>
            <select
              value={from}
              onChange={(e) => setFrom(e.target.value)}
              className="w-full mt-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm outline-none"
            >
              {CONVERT_ASSETS.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </label>
          <button
            type="button"
            onClick={swap}
            aria-label="Swap from and to"
            title="Swap from and to"
            className="self-end p-2 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10"
          >
            <ArrowRightLeft className="h-4 w-4"/>
          </button>
          <label className="block">
            <span className="text-[11px] text-white/55">To</span>
            <select
              value={to}
              onChange={(e) => setTo(e.target.value)}
              className="w-full mt-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm outline-none"
            >
              {CONVERT_ASSETS.filter((s) => s !== from).map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </label>
        </div>
        <label className="block">
          <span className="text-[11px] text-white/55">
            Amount ({from})
            <button
              type="button"
              onClick={() => setAmount(String(fromBalance))}
              className="ml-2 text-neon-gold hover:underline"
            >
              max: {fromBalance}
            </button>
          </span>
          <input
            type="number"
            min="0"
            step="any"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder={`0.00 ${from}`}
            className="w-full mt-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm outline-none"
            required
          />
        </label>
        {preview && (
          <div className="text-xs bg-white/5 border border-white/10 rounded-lg px-3 py-2 space-y-0.5">
            <div className="flex justify-between"><span className="text-white/55">You receive</span><span className="font-semibold">{preview.toAmount} {preview.to}</span></div>
            <div className="flex justify-between"><span className="text-white/55">Rate</span><span>1 {preview.from} ≈ {preview.rate?.toFixed(preview.to === 'USDT' ? 2 : 6)} {preview.to}</span></div>
            <div className="flex justify-between"><span className="text-white/55">Spread ({(preview.spreadBps / 100).toFixed(2)} %)</span><span>${preview.spreadUsd?.toFixed(2)}</span></div>
          </div>
        )}
        {previewBusy && !preview && <p className="text-[11px] text-white/45">Fetching live rate…</p>}
        {msg && <p className={`text-xs px-3 py-2 rounded-lg border ${msg.kind === 'ok' ? 'bg-neon-green/10 border-neon-green/30 text-neon-green' : 'bg-neon-red/10 border-neon-red/30 text-neon-red'}`}>{msg.text}</p>}
        <button
          disabled={busy || !preview || fromBalance + 1e-9 < parseFloat(amount || '0')}
          className="btn-primary justify-center disabled:opacity-60 w-full"
        >
          {busy ? <><Loader2 className="h-4 w-4 animate-spin"/> Converting…</> : `Convert ${from} → ${to}`}
        </button>
      </form>
    </section>
  );
}

// =============================================================
// EmptyStateCoach - three-step Start-here panel for brand-new
// users with no balances and no transactions yet. Hidden once
// the user has any non-zero balance.
// =============================================================
export function EmptyStateCoach() {
  const { user } = useSession();
  const [dismissed, setDismissed] = useState(false);
  if (!user || dismissed) return null;
  const totalCrypto = Object.entries(user.balances || {})
    .reduce((sum, [, v]) => sum + (Number(v) || 0), 0);
  if (totalCrypto > 0) return null;
  const emailVerified = !!user.emailVerifiedAt;
  const steps = [
    {
      done: emailVerified,
      title: 'Verify your email',
      body: 'Confirm the six-digit code we sent. Verification unlocks deposits, withdrawals, and KYC.',
    },
    {
      done: false,
      title: 'Fund your account',
      body: 'Claim sandbox USDT (if enabled) or send a deposit to the asset address shown in the wallet panel.',
    },
    {
      done: false,
      title: 'Place your first trade',
      body: 'Open the Invest panel, choose an asset, and execute at the live market price.',
    },
  ];
  return (
    <section className="glass-strong p-5 border border-gold-500/20">
      <div className="flex items-center gap-2 mb-3">
        <Rocket className="h-4 w-4 text-gold-400"/>
        <h3 className="font-display text-lg">Start here</h3>
        <span className="chip bg-gold-500/15 text-gold-300 border border-gold-500/30">new account</span>
        <button
          type="button"
          onClick={() => setDismissed(true)}
          aria-label="Dismiss Start here tour"
          className="ml-auto p-1 rounded hover:bg-white/10 text-white/60"
        >
          <BellClose className="h-4 w-4"/>
        </button>
      </div>
      <p className="text-xs text-white/55 mb-4">
        Welcome to AurumX. Complete these three steps to unlock the full broker dashboard.
      </p>
      <ol className="space-y-3">
        {steps.map((s, i) => (
          <li key={s.title} className="flex gap-3">
            <span
              className={`h-7 w-7 shrink-0 rounded-full inline-flex items-center justify-center text-xs font-semibold ${s.done ? 'bg-neon-green/20 text-neon-green border border-neon-green/40' : 'bg-white/5 text-white/70 border border-white/15'}`}
              aria-hidden
            >
              {s.done ? <Check className="h-3.5 w-3.5"/> : i + 1}
            </span>
            <div>
              <p className={`text-sm font-medium ${s.done ? 'line-through text-white/45' : ''}`}>{s.title}</p>
              <p className="text-xs text-white/55">{s.body}</p>
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}

// =============================================================
// DcaPanel - recurring (DCA) buys. Schedules are kept active by
// the server-side order settler; this panel just CRUDs them via
// /api/dca and polls for run-count updates.
// =============================================================
const DCA_ASSETS = ['BTC', 'ETH', 'SOL', 'XRP', 'BNB', 'ADA', 'DOGE', 'AVAX', 'MATIC', 'LINK', 'LTC'];

function nextRunLabel(ms) {
  if (!ms || !isFinite(ms)) return '-';
  const diff = ms - Date.now();
  if (diff <= 0) return 'on next tick';
  const mins = Math.round(diff / 60000);
  if (mins < 60) return `in ${mins}m`;
  const hours = Math.round(mins / 60);
  if (hours < 48) return `in ${hours}h`;
  const days = Math.round(hours / 24);
  return `in ${days}d`;
}

export function DcaPanel({ onChanged } = {}) {
  const { user } = useSession();
  const [items, setItems] = useState([]);
  const [intervals, setIntervals] = useState({});
  const [form, setForm] = useState({ symbol: 'BTC', usdAmount: '', interval: 'weekly' });
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState(null);
  const load = async () => {
    try {
      const r = await api.get('/api/dca');
      setItems(r.items || []);
      setIntervals(r.intervals || {});
    } catch (_) { /* ignore */ }
  };
  useEffect(() => {
    if (!user) return undefined;
    load();
    // Tranches fire asynchronously every 5s on the server settler -
    // poll modestly so the UI reflects new runs / pauses.
    const id = setInterval(load, 20000);
    return () => clearInterval(id);
  }, [user]);
  if (!user) return null;
  const submit = async (e) => {
    e.preventDefault();
    setMsg(null);
    const amount = parseFloat(form.usdAmount);
    if (!isFinite(amount) || amount <= 0) { setMsg({ kind: 'err', text: 'Amount must be a positive number' }); return; }
    setBusy(true);
    try {
      await api.post('/api/dca', { symbol: form.symbol, usdAmount: amount, interval: form.interval });
      setForm({ ...form, usdAmount: '' });
      setMsg({ kind: 'ok', text: `Recurring buy created. First tranche fires on the next settler tick.` });
      await load();
      onChanged && onChanged();
    } catch (err) {
      setMsg({ kind: 'err', text: err.message });
    } finally { setBusy(false); }
  };
  const action = async (id, act) => {
    try { await api.patch('/api/dca', { id, action: act }); load(); }
    catch (err) { setMsg({ kind: 'err', text: err.message }); }
  };
  const cancel = async (id) => {
    try { await api.del(`/api/dca?id=${encodeURIComponent(id)}`); load(); }
    catch (err) { setMsg({ kind: 'err', text: err.message }); }
  };
  const active = items.filter((d) => d.status !== 'cancelled');
  return (
    <section className="glass-strong p-5">
      <div className="flex items-center gap-2 mb-3">
        <Wallet className="h-4 w-4 text-gold-400" aria-hidden/>
        <h3 className="font-display text-lg">Recurring buys (DCA)</h3>
        <span className="chip bg-white/5 text-white/60 border border-white/10 ml-auto">{active.length} active</span>
      </div>
      <p className="text-xs text-white/55 mb-3">
        Dollar-cost-average into any supported asset on a fixed schedule.
        Each tranche debits USDT and credits the asset at the live market price (broker taker fee applies).
      </p>
      <form onSubmit={submit} className="grid sm:grid-cols-[1fr_1fr_1fr_auto] gap-2 items-end mb-4">
        <label className="block">
          <span className="text-[11px] text-white/55">Asset</span>
          <select
            value={form.symbol}
            onChange={(e) => setForm({ ...form, symbol: e.target.value })}
            className="w-full mt-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm outline-none"
          >
            {DCA_ASSETS.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </label>
        <label className="block">
          <span className="text-[11px] text-white/55">USD per tranche</span>
          <input
            type="number"
            min="1"
            step="any"
            value={form.usdAmount}
            onChange={(e) => setForm({ ...form, usdAmount: e.target.value })}
            placeholder="25"
            className="w-full mt-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm outline-none"
            required
          />
        </label>
        <label className="block">
          <span className="text-[11px] text-white/55">Cadence</span>
          <select
            value={form.interval}
            onChange={(e) => setForm({ ...form, interval: e.target.value })}
            className="w-full mt-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm outline-none"
          >
            {Object.entries(intervals).length
              ? Object.entries(intervals).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)
              : (
                <>
                  <option value="daily">Every day</option>
                  <option value="weekly">Every week</option>
                  <option value="biweekly">Every 2 weeks</option>
                  <option value="monthly">Every month</option>
                </>
              )}
          </select>
        </label>
        <button
          type="submit"
          disabled={busy}
          className="btn-primary justify-center disabled:opacity-60 self-end"
        >
          {busy ? <><Loader2 className="h-4 w-4 animate-spin" aria-hidden/> Saving…</> : 'Add'}
        </button>
      </form>
      {msg && (
        <p
          role={msg.kind === 'err' ? 'alert' : 'status'}
          className={`text-xs mb-3 px-3 py-2 rounded-lg border ${msg.kind === 'ok' ? 'bg-neon-green/10 border-neon-green/30 text-neon-green' : 'bg-neon-red/10 border-neon-red/30 text-neon-red'}`}
        >
          {msg.text}
        </p>
      )}
      {active.length === 0
        ? <p className="text-xs text-white/45">No recurring buys yet.</p>
        : (
          <ul className="divide-y divide-white/5">
            {active.map((d) => (
              <li key={d.id} className="py-2 flex items-center gap-3 text-sm">
                <span className="font-semibold w-12">{d.symbol}</span>
                <span className="text-white/70">${Number(d.usdAmount).toFixed(2)}</span>
                <span className="text-white/55">{intervals[d.interval]?.label || d.interval}</span>
                <span className="text-white/45 text-xs">runs: {d.runs || 0}</span>
                <span className="text-white/45 text-xs hidden sm:inline">
                  {d.status === 'paused' ? `paused (${d.pauseReason || 'user'})` : `next ${nextRunLabel(d.nextRunAt)}`}
                </span>
                <span className="ml-auto flex gap-2">
                  {d.status === 'active' && (
                    <button type="button" onClick={() => action(d.id, 'pause')} className="text-xs text-white/70 hover:text-white">Pause</button>
                  )}
                  {d.status === 'paused' && (
                    <button type="button" onClick={() => action(d.id, 'resume')} className="text-xs text-neon-green hover:underline">Resume</button>
                  )}
                  <button type="button" onClick={() => cancel(d.id)} className="text-xs text-neon-red hover:underline">Cancel</button>
                </span>
              </li>
            ))}
          </ul>
        )}
    </section>
  );
}

// ---------- Referral programme ----------
// Shows the user's referral code, share URL, headline stats (referee
// count + total rebated), and a short history of recent rebate events.
// All numbers come from /api/referral so the panel doesn't have to know
// about REFERRAL_REBATE_BPS or USDT semantics directly.
export function ReferralPanel() {
  const { user } = useSession();
  const [data, setData] = useState(null);
  const [copied, setCopied] = useState(false);
  useEffect(() => {
    if (!user) return undefined;
    let cancelled = false;
    const load = async () => {
      try {
        const r = await api.get('/api/referral');
        if (!cancelled) setData(r);
      } catch (_) { /* ignore */ }
    };
    load();
    const id = setInterval(load, 60000);
    return () => { cancelled = true; clearInterval(id); };
  }, [user]);
  if (!user || !data) return null;
  const onCopy = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch (_) { /* ignore */ }
  };
  const bpsPct = (data.rebateBps / 100).toFixed(data.rebateBps % 100 === 0 ? 0 : 2);
  return (
    <section className="glass-strong p-5">
      <header className="flex items-center gap-2">
        <h3 className="font-display text-base">Refer &amp; earn</h3>
        <span className="chip text-[10px] bg-white/5 border border-white/10 text-white/65 ml-auto">
          {bpsPct}% rebate
        </span>
      </header>
      <p className="text-xs text-white/55 mt-1">
        Share your code. Earn {bpsPct}% of every broker fee your referees pay,
        credited straight to your USDT balance.
      </p>
      <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
        <div className="glass p-3">
          <div className="text-white/55">Referees</div>
          <div className="text-base text-white mt-0.5">{data.refereeCount}</div>
        </div>
        <div className="glass p-3">
          <div className="text-white/55">Rebated so far</div>
          <div className="text-base text-white mt-0.5">${Number(data.totalRebated || 0).toFixed(2)}</div>
        </div>
      </div>
      <div className="mt-3">
        <span className="text-[11px] text-white/55">Your code</span>
        <div className="mt-1 flex items-center gap-2 bg-white/5 border border-white/10 rounded-lg px-3 py-2">
          <code className="text-sm tracking-wider text-white flex-1 truncate">{data.code}</code>
          <button
            type="button"
            onClick={() => onCopy(data.code)}
            className="btn-ghost text-[11px] px-2 py-1 inline-flex items-center gap-1"
            aria-label="Copy referral code"
          >
            {copied ? <Check className="h-3.5 w-3.5 text-neon-green"/> : <Copy className="h-3.5 w-3.5"/>}
            <span>Copy</span>
          </button>
        </div>
      </div>
      <div className="mt-2">
        <span className="text-[11px] text-white/55">Share URL</span>
        <div className="mt-1 flex items-center gap-2 bg-white/5 border border-white/10 rounded-lg px-3 py-2">
          <code className="text-[11px] text-white/80 flex-1 truncate">{data.shareUrl}</code>
          <button
            type="button"
            onClick={() => onCopy(data.shareUrl)}
            className="btn-ghost text-[11px] px-2 py-1 inline-flex items-center gap-1"
            aria-label="Copy referral share URL"
          >
            <Copy className="h-3.5 w-3.5"/>
            <span>Copy</span>
          </button>
        </div>
      </div>
      {(data.recent && data.recent.length > 0) && (
        <div className="mt-3">
          <div className="text-[11px] text-white/55 mb-1">Recent rebates</div>
          <ul className="space-y-1 text-[11px] text-white/70 max-h-32 overflow-y-auto">
            {data.recent.map((r) => (
              <li key={r.id} className="flex items-center justify-between gap-2 bg-white/5 border border-white/10 rounded px-2 py-1">
                <span className="capitalize">{r.kind || 'fee'}</span>
                <span className="text-white/55">${Number(r.feeUsd || 0).toFixed(2)} fee</span>
                <span className="text-neon-green">+${Number(r.rebateUsd || 0).toFixed(2)}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}

// ---------- Customer support ----------
// Lets a signed-in user open a ticket, see the thread of staff replies,
// post follow-ups, and close the ticket once their issue is sorted.
// Admin replies arrive over the existing notification centre.
const TICKET_STATUS_COPY = {
  open: { label: 'Open', tone: 'text-neon-green' },
  awaiting_user: { label: 'Awaiting you', tone: 'text-gold-400' },
  answered: { label: 'Answered', tone: 'text-neon-green' },
  closed: { label: 'Closed', tone: 'text-white/45' },
};
function fmtTime(ms) {
  if (!ms) return '';
  const diff = Date.now() - Number(ms);
  if (diff < 60_000) return 'just now';
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m ago`;
  if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)}h ago`;
  return new Date(Number(ms)).toLocaleDateString();
}
export function SupportPanel() {
  const { user } = useSession();
  const [items, setItems] = useState([]);
  const [openId, setOpenId] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ subject: '', body: '', priority: 'normal' });
  const [reply, setReply] = useState('');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState(null);
  const load = async () => {
    try {
      const r = await api.get('/api/support/tickets');
      setItems(r.items || []);
    } catch (_) { /* ignore */ }
  };
  useEffect(() => {
    if (!user) return undefined;
    load();
    // Polled so admin replies show up even if the notification bell
    // hasn't been clicked.
    const id = setInterval(load, 30_000);
    return () => clearInterval(id);
  }, [user]);
  if (!user) return null;
  const onCreate = async (e) => {
    e.preventDefault();
    setMsg(null);
    if (!form.subject.trim() || !form.body.trim()) {
      setMsg({ kind: 'err', text: 'Subject and message are required.' });
      return;
    }
    setBusy(true);
    try {
      const r = await api.post('/api/support/tickets', form);
      setForm({ subject: '', body: '', priority: 'normal' });
      setShowForm(false);
      setOpenId(r.ticket.id);
      setMsg({ kind: 'ok', text: 'Ticket opened. Our team typically replies within a few hours.' });
      await load();
    } catch (err) {
      setMsg({ kind: 'err', text: err.message || 'Could not open ticket' });
    } finally {
      setBusy(false);
    }
  };
  const onReply = async (ticketId) => {
    if (!reply.trim()) return;
    setBusy(true);
    try {
      await api.post(`/api/support/tickets/${ticketId}/messages`, { body: reply });
      setReply('');
      await load();
    } catch (err) {
      setMsg({ kind: 'err', text: err.message || 'Could not send reply' });
    } finally {
      setBusy(false);
    }
  };
  const onClose = async (ticketId) => {
    setBusy(true);
    try {
      await api.post(`/api/support/tickets/${ticketId}/close`);
      await load();
    } catch (err) {
      setMsg({ kind: 'err', text: err.message || 'Could not close ticket' });
    } finally {
      setBusy(false);
    }
  };
  return (
    <section className="glass-strong p-5">
      <header className="flex items-center gap-2">
        <LifeBuoy className="h-4 w-4 text-gold-400"/>
        <h3 className="font-display text-base">Support</h3>
        <button
          type="button"
          onClick={() => { setShowForm((s) => !s); setMsg(null); }}
          className="btn-ghost text-xs px-2 py-1 ml-auto"
          aria-expanded={showForm}
          aria-controls="support-new-form"
        >
          {showForm ? 'Cancel' : 'New ticket'}
        </button>
      </header>
      <p className="text-xs text-white/55 mt-1">
        Ask the AurumX desk anything - KYC, deposits, withdrawals, trade issues.
      </p>
      {showForm && (
        <form id="support-new-form" onSubmit={onCreate} className="mt-3 space-y-2">
          <input
            value={form.subject}
            onChange={(e) => setForm({ ...form, subject: e.target.value })}
            placeholder="Short subject (e.g. Deposit not credited)"
            maxLength={200}
            className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm outline-none focus:border-neon-green/40"
          />
          <textarea
            value={form.body}
            onChange={(e) => setForm({ ...form, body: e.target.value })}
            placeholder="Describe the issue in detail - include tx ids and timestamps where you can."
            maxLength={4000}
            rows={4}
            className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm outline-none focus:border-neon-green/40 resize-y"
          />
          <div className="flex items-center gap-2">
            <label className="text-[11px] text-white/55">Priority</label>
            <select
              value={form.priority}
              onChange={(e) => setForm({ ...form, priority: e.target.value })}
              className="bg-white/5 border border-white/10 rounded px-2 py-1 text-xs outline-none"
            >
              <option value="low">Low</option>
              <option value="normal">Normal</option>
              <option value="high">High</option>
            </select>
            <button disabled={busy} className="btn-gold text-xs ml-auto disabled:opacity-60">
              {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin"/> : <Send className="h-3.5 w-3.5"/>}
              <span className="ml-1">Submit</span>
            </button>
          </div>
        </form>
      )}
      {msg && (
        <p className={`mt-3 text-xs rounded-lg border px-3 py-2 ${msg.kind === 'ok' ? 'bg-neon-green/10 border-neon-green/30 text-neon-green' : 'bg-neon-red/10 border-neon-red/30 text-neon-red'}`}>
          {msg.text}
        </p>
      )}
      {items.length === 0 ? (
        <p className="mt-3 text-xs text-white/45">You have no support tickets yet.</p>
      ) : (
        <ul className="mt-3 space-y-2">
          {items.map((t) => {
            const meta = TICKET_STATUS_COPY[t.status] || TICKET_STATUS_COPY.open;
            const isOpen = openId === t.id;
            return (
              <li key={t.id} className="bg-white/5 border border-white/10 rounded-lg">
                <button
                  type="button"
                  onClick={() => setOpenId(isOpen ? null : t.id)}
                  className="w-full flex items-center gap-2 px-3 py-2 text-left"
                  aria-expanded={isOpen}
                  aria-controls={`tkt-${t.id}-body`}
                >
                  <span className="text-sm text-white truncate flex-1">{t.subject}</span>
                  <span className={`text-[10px] ${meta.tone}`}>{meta.label}</span>
                  <span className="text-[10px] text-white/40">{fmtTime(t.updatedAt)}</span>
                  {isOpen ? <ChevronUp className="h-3.5 w-3.5 text-white/45"/> : <ChevronDown className="h-3.5 w-3.5 text-white/45"/>}
                </button>
                {isOpen && (
                  <div id={`tkt-${t.id}-body`} className="px-3 pb-3 space-y-2">
                    <ul className="space-y-1.5 max-h-64 overflow-y-auto pr-1">
                      {(t.messages || []).map((m) => (
                        <li key={m.id} className={`rounded-lg px-3 py-2 text-xs whitespace-pre-wrap break-words ${m.authorRole === 'staff' ? 'bg-gold-500/10 border border-gold-500/20 text-white' : 'bg-white/5 border border-white/10 text-white/85'}`}>
                          <div className="flex items-center justify-between mb-0.5 text-[10px]">
                            <span className={m.authorRole === 'staff' ? 'text-gold-400' : 'text-white/55'}>
                              {m.authorRole === 'staff' ? 'AurumX support' : 'You'}
                            </span>
                            <span className="text-white/35">{fmtTime(m.createdAt)}</span>
                          </div>
                          {m.body}
                        </li>
                      ))}
                    </ul>
                    {t.status !== 'closed' ? (
                      <div className="flex items-center gap-2">
                        <input
                          value={openId === t.id ? reply : ''}
                          onChange={(e) => setReply(e.target.value)}
                          placeholder="Reply…"
                          maxLength={4000}
                          className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-xs outline-none focus:border-neon-green/40"
                        />
                        <button
                          type="button"
                          onClick={() => onReply(t.id)}
                          disabled={busy || !reply.trim()}
                          className="btn-ghost text-xs px-2 py-1 disabled:opacity-50"
                          aria-label="Send reply"
                        >
                          <Send className="h-3.5 w-3.5"/>
                        </button>
                        <button
                          type="button"
                          onClick={() => onClose(t.id)}
                          disabled={busy}
                          className="text-[10px] text-white/50 hover:text-white/80 disabled:opacity-50"
                        >
                          Close
                        </button>
                      </div>
                    ) : (
                      <p className="text-[11px] text-white/45">This ticket is closed. Open a new one if you need further help.</p>
                    )}
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

// =============================================================
// Support panel with Telegram and WhatsApp contact options
// =============================================================
export function SupportContactPanel() {
  const { user } = useSession();
  const telegramUrl = typeof window !== 'undefined' 
    ? (process.env.NEXT_PUBLIC_TELEGRAM_SUPPORT_URL || 'https://t.me/AurumXSupport')
    : 'https://t.me/AurumXSupport';
  const whatsappUrl = typeof window !== 'undefined'
    ? (process.env.NEXT_PUBLIC_WHATSAPP_SUPPORT_URL || 'https://wa.me/15555550123')
    : 'https://wa.me/15555550123';

  if (!user) return null;

  return (
    <section id="support-section" className="glass-strong p-5">
      <div className="flex items-center gap-2 mb-3">
        <LifeBuoy className="h-4 w-4 text-cyan"/>
        <h3 className="font-display text-lg">Contact Support</h3>
      </div>
      <p className="text-sm text-white/60 mb-4">Need help? Reach out to our support team via your preferred channel.</p>
      <div className="grid sm:grid-cols-2 gap-3">
        <a
          href={telegramUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="glass-light p-4 rounded-xl hover:bg-white/10 transition-colors flex items-center gap-3 group"
        >
          <div className="h-12 w-12 rounded-full flex items-center justify-center text-white" style={{ background: 'linear-gradient(135deg, #229ED9 0%, #1a7cb8 100%)' }}>
            <Send className="h-5 w-5"/>
          </div>
          <div className="flex-1">
            <p className="font-semibold">Telegram Support</p>
            <p className="text-xs text-white/50">Chat with us on Telegram</p>
          </div>
        </a>
        <a
          href={whatsappUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="glass-light p-4 rounded-xl hover:bg-white/10 transition-colors flex items-center gap-3 group"
        >
          <div className="h-12 w-12 rounded-full flex items-center justify-center text-white" style={{ background: 'linear-gradient(135deg, #25D366 0%, #128C7E 100%)' }}>
            <MessageSquare className="h-5 w-5"/>
          </div>
          <div className="flex-1">
            <p className="font-semibold">WhatsApp Support</p>
            <p className="text-xs text-white/50">Message us on WhatsApp</p>
          </div>
        </a>
      </div>
    </section>
  );
}

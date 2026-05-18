'use client';
import { useEffect, useState } from 'react';
import { Copy, Wallet, Check, Search, MessageSquare, Star, Loader2 } from 'lucide-react';
import { api, useSession } from '@/lib/useSession';

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
            {addresses.map((a) => (
              <li key={a.symbol} className="glass-light p-3 flex flex-col gap-1">
                <div className="flex items-center gap-2">
                  <span className="font-semibold">{a.symbol}</span>
                  {a.network && <span className="chip bg-white/5 border border-white/10 text-white/70 text-[10px]">{a.network}</span>}
                  {a.label && <span className="text-[10px] text-white/45">{a.label}</span>}
                  <button onClick={() => copy(a.symbol, a.address)} className="ml-auto h-7 w-7 rounded bg-white/5 hover:bg-white/10 inline-flex items-center justify-center" aria-label="Copy address">
                    {copied === a.symbol ? <Check className="h-3.5 w-3.5 text-neon-green"/> : <Copy className="h-3.5 w-3.5"/>}
                  </button>
                </div>
                <code className="font-mono text-xs break-all text-white/85">{a.address}</code>
                {a.memo && <div className="text-[11px] text-gold-300">Memo / tag: <code className="font-mono">{a.memo}</code></div>}
              </li>
            ))}
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
        if (mounted) setRows(r.markets || []);
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
                  <div className="flex items-center gap-2">
                    <span className="h-6 w-6 rounded-full inline-flex items-center justify-center text-[10px] font-semibold text-ink-950" style={{ background: r.color }}>{r.symbol.slice(0, 2)}</span>
                    <div>
                      <div className="font-medium">{r.symbol}</div>
                      <div className="text-[11px] text-white/45">{r.name}</div>
                    </div>
                  </div>
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

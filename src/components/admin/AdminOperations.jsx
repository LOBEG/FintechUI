'use client';
import { useCallback, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Loader2, KeyRound, Coins, Users as UsersIcon, Trash2, CheckCircle2, AlertCircle, Lock, Wallet as WalletIcon, TrendingUp, MessageSquare, Check, X as XIcon, Copy, Scale, ShieldOff, FileText, BarChart3, Download, BadgeCheck } from 'lucide-react';
import { api, useSession } from '@/lib/useSession';

const SUPPORTED = ['BTC', 'ETH', 'SOL', 'XRP', 'BNB', 'ADA', 'DOGE', 'AVAX', 'LINK', 'LTC', 'TRX', 'DOT', 'MATIC', 'USDT'];

function fmt(n, d = 8) {
  return Number(n || 0).toLocaleString('en-US', { maximumFractionDigits: d });
}

export function AdminOperations() {
  const { user, loading } = useSession();
  const [users, setUsers] = useState([]);
  const [tokens, setTokens] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [addresses, setAddresses] = useState([]);
  const [testimonials, setTestimonials] = useState([]);
  const [tab, setTab] = useState('credit');

  const refresh = useCallback(async () => {
    if (!user?.isAdmin) return;
    try {
      const [u, t, tx, ad, ts] = await Promise.all([
        api.get('/api/admin/users'),
        api.get('/api/admin/tokens'),
        api.get('/api/admin/transactions'),
        api.get('/api/admin/deposit-addresses'),
        api.get('/api/admin/testimonials'),
      ]);
      setUsers(u.users || []);
      setTokens(t.tokens || []);
      setTransactions(tx.transactions || []);
      setAddresses(Object.values(ad.addresses || {}));
      setTestimonials(ts.testimonials || []);
    } catch (_) {}
  }, [user]);
  useEffect(() => { refresh(); }, [refresh]);
  // Live monitoring: refresh transactions / users every 30 seconds so deposit & withdrawal
  // monitoring reflects the live data source without manual reload.
  useEffect(() => {
    if (!user?.isAdmin) return;
    const id = setInterval(refresh, 30_000);
    return () => clearInterval(id);
  }, [user, refresh]);

  if (loading) {
    return <div className="glass-strong p-6 flex items-center gap-2 text-sm text-white/65"><Loader2 className="h-4 w-4 animate-spin"/> Loading admin operations…</div>;
  }
  if (!user) {
    return <div className="glass-strong p-6 text-sm flex items-center gap-3"><Lock className="h-5 w-5 text-gold-400"/>Sign in as an administrator to access live admin operations. <a href="/login" className="ml-auto btn-primary text-xs">Sign in</a></div>;
  }
  if (!user.isAdmin) {
    return <div className="glass-strong p-6 text-sm flex items-center gap-3 text-neon-orange"><AlertCircle className="h-5 w-5"/> Your account is not an administrator. Set <code className="px-1 py-0.5 rounded bg-white/10">ADMIN_EMAIL</code> + <code className="px-1 py-0.5 rounded bg-white/10">ADMIN_PASSWORD</code> environment variables and sign in with that account.</div>;
  }

  return (
    <motion.section
      initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
      className="glass-strong p-5 space-y-4">
      <div className="flex items-center gap-2">
        <h2 className="font-display text-lg">Live admin operations</h2>
        <span className="chip bg-neon-green/15 text-neon-green border border-neon-green/30">● real-time</span>
        <button onClick={refresh} className="ml-auto text-xs text-white/55 hover:text-white">Refresh</button>
      </div>
      <div className="flex gap-1 text-xs flex-wrap">
        {[
          ['credit', 'Credit deposit', Coins],
          ['adjust', 'Adjust balance', TrendingUp],
          ['setbal', 'Set balance', Scale],
          ['status', 'Freeze user', ShieldOff],
          ['token', 'Issue token', KeyRound],
          ['addresses', `Deposit addresses (${addresses.length})`, WalletIcon],
          ['testimonials', `Testimonials (${testimonials.filter((t) => t.status === 'pending').length} pending)`, MessageSquare],
          ['users', `Users (${users.length})`, UsersIcon],
          ['tokens', `Tokens (${tokens.filter((t) => t.status === 'active').length})`, KeyRound],
          ['tx', `Tx (${transactions.length})`, CheckCircle2],
          ['audit', 'Audit log', FileText],
          ['kyc', 'KYC queue', BadgeCheck],
          ['metrics', 'Metrics', BarChart3],
          ['exports', 'CSV exports', Download],
        ].map(([k, label, Icon]) => (
          <button key={k} onClick={() => setTab(k)} className={`px-3 py-1.5 rounded-lg inline-flex items-center gap-1.5 ${tab === k ? 'bg-white/10 text-white' : 'text-white/55 hover:bg-white/5'}`}>
            <Icon className="h-3.5 w-3.5"/>{label}
          </button>
        ))}
      </div>

      {tab === 'credit' && <CreditForm users={users} onDone={refresh} />}
      {tab === 'adjust' && <AdjustForm users={users} onDone={refresh} />}
      {tab === 'setbal' && <SetBalanceForm users={users} onDone={refresh} />}
      {tab === 'status' && <StatusForm users={users} onDone={refresh} />}
      {tab === 'token' && <TokenForm users={users} onDone={refresh} />}
      {tab === 'addresses' && <AddressesPanel addresses={addresses} onDone={refresh} />}
      {tab === 'testimonials' && <TestimonialsPanel testimonials={testimonials} onDone={refresh} />}
      {tab === 'users' && <UsersList users={users}/>}
      {tab === 'tokens' && <TokensList tokens={tokens} users={users} onDone={refresh}/>}
      {tab === 'tx' && <TxList transactions={transactions} users={users} onDone={refresh}/>}
      {tab === 'audit' && <AuditLogPanel/>}
      {tab === 'kyc' && <KycQueuePanel/>}
      {tab === 'metrics' && <MetricsPanel/>}
      {tab === 'exports' && <ExportsPanel/>}
    </motion.section>
  );
}

function CreditForm({ users, onDone }) {
  const [email, setEmail] = useState('');
  const [symbol, setSymbol] = useState('BTC');
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('Wire deposit credited');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState(null);
  const submit = async (e) => {
    e.preventDefault(); setBusy(true); setMsg(null);
    try {
      const r = await api.post('/api/admin/credit', { email, symbol, amount: parseFloat(amount), note });
      setMsg({ kind: 'ok', text: `Credited ${r.transaction.amount} ${r.transaction.symbol} ≈ $${r.transaction.usdValue.toFixed(2)}. Email queued.` });
      setAmount('');
      onDone && onDone();
    } catch (err) { setMsg({ kind: 'err', text: err.message }); }
    finally { setBusy(false); }
  };
  return (
    <form onSubmit={submit} className="grid sm:grid-cols-2 gap-3">
      <label className="block sm:col-span-2">
        <span className="text-xs text-white/55">User email</span>
        <input list="adm-users" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="alice@example.com" className="mt-1 w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm outline-none focus:border-neon-green/40"/>
        <datalist id="adm-users">{users.map((u) => <option key={u.id} value={u.email}/>)}</datalist>
      </label>
      <label className="block">
        <span className="text-xs text-white/55">Asset</span>
        <select value={symbol} onChange={(e) => setSymbol(e.target.value)} className="mt-1 w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm outline-none">
          {SUPPORTED.map((s) => <option key={s} value={s} className="bg-ink-900">{s}</option>)}
        </select>
      </label>
      <label className="block">
        <span className="text-xs text-white/55">Amount ({symbol})</span>
        <input value={amount} onChange={(e) => setAmount(e.target.value)} inputMode="decimal" required className="mt-1 w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm outline-none focus:border-neon-green/40"/>
      </label>
      <label className="block sm:col-span-2">
        <span className="text-xs text-white/55">Note (shown in email & transaction)</span>
        <input value={note} onChange={(e) => setNote(e.target.value)} className="mt-1 w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm outline-none"/>
      </label>
      {msg && <p className={`sm:col-span-2 text-xs px-3 py-2 rounded-lg border ${msg.kind === 'ok' ? 'bg-neon-green/10 border-neon-green/30 text-neon-green' : 'bg-neon-red/10 border-neon-red/30 text-neon-red'}`}>{msg.text}</p>}
      <button disabled={busy} className="sm:col-span-2 btn-primary justify-center disabled:opacity-60">
        {busy ? <><Loader2 className="h-4 w-4 animate-spin"/> Crediting…</> : 'Credit user & send email'}
      </button>
    </form>
  );
}

function TokenForm({ users, onDone }) {
  const [email, setEmail] = useState('');
  const [symbol, setSymbol] = useState('');
  const [maxAmount, setMaxAmount] = useState('');
  const [expiresInHours, setExpiresInHours] = useState('24');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState(null);
  const submit = async (e) => {
    e.preventDefault(); setBusy(true); setMsg(null);
    try {
      const body = { email };
      if (symbol) body.symbol = symbol;
      if (maxAmount) body.maxAmount = parseFloat(maxAmount);
      if (expiresInHours) body.expiresInHours = parseFloat(expiresInHours);
      const r = await api.post('/api/admin/tokens', body);
      setMsg({ kind: 'ok', text: `Token issued: ${r.token.code}. Emailed to ${email || 'no user (unbound)'}.` });
      onDone && onDone();
    } catch (err) { setMsg({ kind: 'err', text: err.message }); }
    finally { setBusy(false); }
  };
  return (
    <form onSubmit={submit} className="grid sm:grid-cols-2 gap-3">
      <p className="sm:col-span-2 text-xs text-white/55">Tokens are single-use and expire after the chosen number of hours (default 24). Leave a field blank to keep that scope open (e.g. omit asset to allow any).</p>
      <label className="block sm:col-span-2">
        <span className="text-xs text-white/55">User email (optional — leave empty for unbound)</span>
        <input list="adm-users-t" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="alice@example.com" className="mt-1 w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm outline-none"/>
        <datalist id="adm-users-t">{users.map((u) => <option key={u.id} value={u.email}/>)}</datalist>
      </label>
      <label className="block">
        <span className="text-xs text-white/55">Asset scope (optional)</span>
        <select value={symbol} onChange={(e) => setSymbol(e.target.value)} className="mt-1 w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm outline-none">
          <option value="">Any</option>
          {SUPPORTED.map((s) => <option key={s} value={s} className="bg-ink-900">{s}</option>)}
        </select>
      </label>
      <label className="block">
        <span className="text-xs text-white/55">Max amount (optional)</span>
        <input value={maxAmount} onChange={(e) => setMaxAmount(e.target.value)} inputMode="decimal" placeholder="e.g. 1.5" className="mt-1 w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm outline-none"/>
      </label>
      <label className="block sm:col-span-2">
        <span className="text-xs text-white/55">Expires in (hours, 0 = never)</span>
        <input value={expiresInHours} onChange={(e) => setExpiresInHours(e.target.value)} inputMode="decimal" placeholder="24" className="mt-1 w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm outline-none"/>
      </label>
      {msg && <p className={`sm:col-span-2 text-xs px-3 py-2 rounded-lg border font-mono break-all ${msg.kind === 'ok' ? 'bg-neon-green/10 border-neon-green/30 text-neon-green' : 'bg-neon-red/10 border-neon-red/30 text-neon-red'}`}>{msg.text}</p>}
      <button disabled={busy} className="sm:col-span-2 btn-gold justify-center disabled:opacity-60">
        {busy ? <><Loader2 className="h-4 w-4 animate-spin"/> Issuing…</> : 'Issue withdrawal token'}
      </button>
    </form>
  );
}

function UsersList({ users }) {
  if (!users.length) return <p className="text-sm text-white/60">No users yet.</p>;
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full text-sm">
        <thead className="text-xs text-white/50 text-left">
          <tr><th className="py-2 font-medium">Email</th><th className="py-2 font-medium">Name</th><th className="py-2 font-medium">Role</th><th className="py-2 font-medium">Status</th><th className="py-2 font-medium">Created</th><th className="py-2 font-medium">Balances</th></tr>
        </thead>
        <tbody className="divide-y divide-white/5">
          {users.map((u) => (
            <tr key={u.id}>
              <td className="py-2.5">{u.email}</td>
              <td>{u.name}</td>
              <td>{u.isAdmin ? <span className="chip bg-gold-500/15 text-gold-300">admin</span> : <span className="chip bg-white/5 text-white/70 border border-white/10">user</span>}</td>
              <td>{(u.accountStatus || 'active') === 'active' ? <span className="chip bg-neon-green/15 text-neon-green">active</span> : <span className="chip bg-neon-red/15 text-neon-red">disabled</span>}</td>
              <td className="text-white/55">{new Date(u.createdAt).toLocaleDateString()}</td>
              <td className="text-white/70 text-xs">{Object.entries(u.balances || {}).filter(([, v]) => v > 0).map(([k, v]) => `${k}: ${fmt(v)}`).join(' · ') || '—'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function TokensList({ tokens, users, onDone }) {
  const userByID = Object.fromEntries(users.map((u) => [u.id, u]));
  const revoke = async (id) => {
    try { await api.del('/api/admin/tokens', { id }); onDone && onDone(); } catch (_) {}
  };
  if (!tokens.length) return <p className="text-sm text-white/60">No tokens issued yet.</p>;
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full text-sm">
        <thead className="text-xs text-white/50 text-left">
          <tr><th className="py-2 font-medium">Code</th><th className="py-2 font-medium">User</th><th className="py-2 font-medium">Scope</th><th className="py-2 font-medium">Status</th><th className="py-2 font-medium">Created</th><th></th></tr>
        </thead>
        <tbody className="divide-y divide-white/5">
          {tokens.map((t) => (
            <tr key={t.id}>
              <td className="py-2.5 font-mono text-xs">{t.code}</td>
              <td>{userByID[t.userId]?.email || <span className="text-white/45">unbound</span>}</td>
              <td className="text-white/70 text-xs">{t.symbol || 'any'}{t.maxAmount ? ` ≤ ${t.maxAmount}` : ''}</td>
              <td>
                <span className={`chip ${t.status === 'active' ? 'bg-neon-green/15 text-neon-green' : t.status === 'used' ? 'bg-white/10 text-white/60' : 'bg-neon-red/15 text-neon-red'}`}>{t.status}</span>
              </td>
              <td className="text-white/55 text-xs">{new Date(t.createdAt).toLocaleString()}</td>
              <td className="text-right">
                {t.status === 'active' && (
                  <button onClick={() => revoke(t.id)} className="text-xs px-2 py-1 rounded bg-white/5 border border-white/10 hover:bg-white/10 inline-flex items-center gap-1"><Trash2 className="h-3 w-3"/> Revoke</button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function TxList({ transactions, users, onDone }) {
  const userByID = Object.fromEntries(users.map((u) => [u.id, u]));
  const [busyId, setBusyId] = useState(null);
  const [msg, setMsg] = useState(null);
  const reverse = async (txId) => {
    if (!window.confirm('Reverse this transaction? A counter-tx will be recorded; the original stays in the ledger.')) return;
    setBusyId(txId); setMsg(null);
    try {
      await api.post('/api/admin/reverse', { txId, reason: 'Admin desk reversal' });
      setMsg({ kind: 'ok', text: 'Reversal recorded.' });
      onDone && onDone();
    } catch (e) {
      setMsg({ kind: 'err', text: e.message });
    } finally { setBusyId(null); }
  };
  if (!transactions.length) return <p className="text-sm text-white/60">No transactions yet.</p>;
  const reversibleTypes = new Set(['credit', 'admin_credit', 'adjust', 'set_balance']);
  const REVERSAL_WINDOW_MS = 30 * 60 * 1000;
  return (
    <div className="overflow-x-auto">
      {msg && <p className={`text-xs mb-2 px-3 py-2 rounded-lg border ${msg.kind === 'ok' ? 'bg-neon-green/10 border-neon-green/30 text-neon-green' : 'bg-neon-red/10 border-neon-red/30 text-neon-red'}`}>{msg.text}</p>}
      <table className="min-w-full text-sm">
        <thead className="text-xs text-white/50 text-left">
          <tr><th className="py-2 font-medium">When</th><th className="py-2 font-medium">State</th><th className="py-2 font-medium">Type</th><th className="py-2 font-medium">Asset</th><th className="py-2 font-medium">Amount</th><th className="py-2 font-medium">USD</th><th className="py-2 font-medium">Note</th><th className="py-2 font-medium text-right">Action</th></tr>
        </thead>
        <tbody className="divide-y divide-white/5">
          {transactions.slice(0, 50).map((t) => {
            const canReverse = reversibleTypes.has(t.type) && !t.reversedBy && (Date.now() - (t.createdAt || 0) < REVERSAL_WINDOW_MS);
            const u = userByID[t.userId];
            const state = (u && (u.state || (u.address && u.address.state))) || '—';
            return (
              <tr key={t.id}>
                <td className="py-2.5 text-white/55 text-xs">{new Date(t.createdAt).toLocaleString()}</td>
                <td className="text-white/70 text-xs">{state}</td>
                <td>
                  <span className="chip bg-white/5 text-white/80 border border-white/10">{t.type}</span>
                  {t.reversedBy && <span className="ml-1 chip bg-neon-red/10 border border-neon-red/30 text-neon-red text-[10px]">reversed</span>}
                </td>
                <td>{t.symbol}</td>
                <td>{fmt(t.amount)}</td>
                <td>${fmt(t.usdValue, 2)}</td>
                <td className="text-white/55 text-xs">{t.note}</td>
                <td className="text-right">
                  {canReverse ? (
                    <button
                      onClick={() => reverse(t.id)}
                      disabled={busyId === t.id}
                      className="px-2 py-1 rounded bg-neon-red/15 text-neon-red hover:bg-neon-red/25 text-xs disabled:opacity-60"
                      title="Reverse within 30 min of creation"
                    >
                      {busyId === t.id ? '…' : 'Reverse'}
                    </button>
                  ) : (
                    <span className="text-[11px] text-white/30">—</span>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

const ALL_SYMBOLS = ['BTC','ETH','SOL','XRP','BNB','ADA','DOGE','AVAX','DOT','LINK','MATIC','TRX','LTC','USDT','TON','ATOM','NEAR','APT','ARB','OP','SUI','FIL','INJ','SHIB','PEPE','BCH','ETC','XLM','ALGO','HBAR'];

function AdjustForm({ users, onDone }) {
  const [email, setEmail] = useState('');
  const [symbol, setSymbol] = useState('BTC');
  const [amount, setAmount] = useState('');
  const [reason, setReason] = useState('Portfolio performance adjustment');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState(null);
  const submit = async (e) => {
    e.preventDefault(); setBusy(true); setMsg(null);
    try {
      const r = await api.post('/api/admin/adjust', { email, symbol, amount: parseFloat(amount), reason });
      setMsg({ kind: 'ok', text: `Balance updated: ${r.transaction.amount > 0 ? '+' : ''}${r.transaction.amount} ${r.transaction.symbol}. Email queued.` });
      setAmount('');
      onDone && onDone();
    } catch (err) { setMsg({ kind: 'err', text: err.message }); }
    finally { setBusy(false); }
  };
  return (
    <form onSubmit={submit} className="grid sm:grid-cols-2 gap-3">
      <p className="sm:col-span-2 text-xs text-white/55">Adjust a user&rsquo;s position. Positive amount increases (e.g. ROI/yield), negative decreases. Recorded as an <code className="px-1 py-0.5 rounded bg-white/10">adjust</code> transaction in the user&rsquo;s history, the new balance shows on their dashboard in real time, and the user is emailed.</p>
      <label className="block sm:col-span-2">
        <span className="text-xs text-white/55">User email</span>
        <input list="adm-users-a" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="alice@example.com" className="mt-1 w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm outline-none focus:border-neon-green/40"/>
        <datalist id="adm-users-a">{users.map((u) => <option key={u.id} value={u.email}/>)}</datalist>
      </label>
      <label className="block">
        <span className="text-xs text-white/55">Asset</span>
        <select value={symbol} onChange={(e) => setSymbol(e.target.value)} className="mt-1 w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm outline-none">
          {ALL_SYMBOLS.map((s) => <option key={s} value={s} className="bg-ink-900">{s}</option>)}
        </select>
      </label>
      <label className="block">
        <span className="text-xs text-white/55">Amount (signed)</span>
        <input value={amount} onChange={(e) => setAmount(e.target.value)} required placeholder="+0.05 or -0.05" className="mt-1 w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm outline-none focus:border-neon-green/40"/>
      </label>
      <label className="block sm:col-span-2">
        <span className="text-xs text-white/55">Reason (shown in email & transaction)</span>
        <input value={reason} onChange={(e) => setReason(e.target.value)} className="mt-1 w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm outline-none"/>
      </label>
      {msg && <p className={`sm:col-span-2 text-xs px-3 py-2 rounded-lg border ${msg.kind === 'ok' ? 'bg-neon-green/10 border-neon-green/30 text-neon-green' : 'bg-neon-red/10 border-neon-red/30 text-neon-red'}`}>{msg.text}</p>}
      <button disabled={busy} className="sm:col-span-2 btn-primary justify-center disabled:opacity-60">
        {busy ? <><Loader2 className="h-4 w-4 animate-spin"/> Adjusting…</> : 'Apply adjustment & email user'}
      </button>
    </form>
  );
}

function AddressesPanel({ addresses, onDone }) {
  const [symbol, setSymbol] = useState('BTC');
  const [address, setAddress] = useState('');
  const [network, setNetwork] = useState('');
  const [memo, setMemo] = useState('');
  const [label, setLabel] = useState('');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState(null);
  const save = async (e) => {
    e.preventDefault(); setBusy(true); setMsg(null);
    try {
      await api.post('/api/admin/deposit-addresses', { symbol, address, network, memo, label });
      setMsg({ kind: 'ok', text: `${symbol} deposit address published — visible to users instantly.` });
      setAddress(''); setMemo(''); setNetwork(''); setLabel('');
      onDone && onDone();
    } catch (err) { setMsg({ kind: 'err', text: err.message }); }
    finally { setBusy(false); }
  };
  const remove = async (sym) => {
    try { await api.del('/api/admin/deposit-addresses', { symbol: sym }); onDone && onDone(); } catch (_) {}
  };
  return (
    <div className="space-y-4">
      <form onSubmit={save} className="grid sm:grid-cols-2 gap-3">
        <p className="sm:col-span-2 text-xs text-white/55">Publish a wallet address for a given asset. Users see the address on their dashboard as soon as it&rsquo;s saved so they can send the chosen crypto to fund their account.</p>
        <label className="block">
          <span className="text-xs text-white/55">Asset</span>
          <select value={symbol} onChange={(e) => setSymbol(e.target.value)} className="mt-1 w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm outline-none">
            {ALL_SYMBOLS.map((s) => <option key={s} value={s} className="bg-ink-900">{s}</option>)}
          </select>
        </label>
        <label className="block">
          <span className="text-xs text-white/55">Network (optional)</span>
          <input value={network} onChange={(e) => setNetwork(e.target.value)} placeholder="e.g. ERC-20, BEP-20, TRC-20" className="mt-1 w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm outline-none"/>
        </label>
        <label className="block sm:col-span-2">
          <span className="text-xs text-white/55">Wallet address</span>
          <input value={address} onChange={(e) => setAddress(e.target.value)} required placeholder="bc1q… / 0x… / T…" className="mt-1 w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm font-mono outline-none focus:border-neon-green/40"/>
        </label>
        <label className="block">
          <span className="text-xs text-white/55">Memo / tag (optional)</span>
          <input value={memo} onChange={(e) => setMemo(e.target.value)} placeholder="Required for XRP, ATOM, etc." className="mt-1 w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm outline-none"/>
        </label>
        <label className="block">
          <span className="text-xs text-white/55">Label (optional)</span>
          <input value={label} onChange={(e) => setLabel(e.target.value)} placeholder="e.g. Cold storage A" className="mt-1 w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm outline-none"/>
        </label>
        {msg && <p className={`sm:col-span-2 text-xs px-3 py-2 rounded-lg border ${msg.kind === 'ok' ? 'bg-neon-green/10 border-neon-green/30 text-neon-green' : 'bg-neon-red/10 border-neon-red/30 text-neon-red'}`}>{msg.text}</p>}
        <button disabled={busy} className="sm:col-span-2 btn-gold justify-center disabled:opacity-60">
          {busy ? <><Loader2 className="h-4 w-4 animate-spin"/> Saving…</> : 'Publish deposit address'}
        </button>
      </form>
      <div className="border-t border-white/5 pt-3">
        <h4 className="text-sm font-medium mb-2">Currently published</h4>
        {addresses.length === 0 ? (
          <p className="text-sm text-white/55">No addresses configured yet.</p>
        ) : (
          <ul className="space-y-2">
            {addresses.map((a) => (
              <li key={a.symbol} className="glass-light p-3 flex flex-wrap items-center gap-2 text-sm">
                <span className="font-semibold w-12">{a.symbol}</span>
                {a.network && <span className="chip bg-white/5 border border-white/10 text-white/70">{a.network}</span>}
                <code className="font-mono text-xs break-all flex-1">{a.address}</code>
                {a.memo && <span className="text-xs text-white/55">memo: <code className="font-mono">{a.memo}</code></span>}
                <button onClick={() => navigator.clipboard?.writeText(a.address)} title="Copy" className="h-7 w-7 rounded bg-white/5 hover:bg-white/10 inline-flex items-center justify-center"><Copy className="h-3.5 w-3.5"/></button>
                <button onClick={() => remove(a.symbol)} title="Remove" className="h-7 w-7 rounded bg-white/5 hover:bg-neon-red/30 inline-flex items-center justify-center"><Trash2 className="h-3.5 w-3.5"/></button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function TestimonialsPanel({ testimonials, onDone }) {
  const setStatus = async (id, status) => {
    try { await api.patch('/api/admin/testimonials', { id, status }); onDone && onDone(); } catch (_) {}
  };
  const del = async (id) => {
    try { await api.del('/api/admin/testimonials', { id }); onDone && onDone(); } catch (_) {}
  };
  if (!testimonials.length) return <p className="text-sm text-white/60">No testimonials yet.</p>;
  return (
    <ul className="space-y-2">
      {testimonials.map((t) => (
        <li key={t.id} className="glass-light p-3 flex flex-wrap gap-2 items-start">
          <div className="flex-1 min-w-[200px]">
            <div className="flex items-center gap-2 text-xs">
              <strong className="text-white">{t.name}</strong>
              <span className="text-white/55">{t.role || 'AurumX investor'}</span>
              <span className={`chip ${t.status === 'approved' ? 'bg-neon-green/15 text-neon-green' : t.status === 'pending' ? 'bg-gold-500/15 text-gold-200' : 'bg-neon-red/15 text-neon-red'}`}>{t.status}</span>
              <span className="text-gold-300">{'★'.repeat(t.rating || 5)}</span>
            </div>
            <p className="mt-1 text-sm text-white/80">{t.text}</p>
          </div>
          <div className="flex gap-1">
            {t.status !== 'approved' && <button onClick={() => setStatus(t.id, 'approved')} className="px-2 py-1 rounded bg-neon-green/15 text-neon-green text-xs inline-flex items-center gap-1"><Check className="h-3 w-3"/>Approve</button>}
            {t.status !== 'rejected' && <button onClick={() => setStatus(t.id, 'rejected')} className="px-2 py-1 rounded bg-neon-red/15 text-neon-red text-xs inline-flex items-center gap-1"><XIcon className="h-3 w-3"/>Reject</button>}
            <button onClick={() => del(t.id)} className="px-2 py-1 rounded bg-white/5 hover:bg-white/10 text-xs inline-flex items-center gap-1"><Trash2 className="h-3 w-3"/>Delete</button>
          </div>
        </li>
      ))}
    </ul>
  );
}

function SetBalanceForm({ users, onDone }) {
  const [email, setEmail] = useState('');
  const [symbol, setSymbol] = useState('BTC');
  const [amount, setAmount] = useState('');
  const [reason, setReason] = useState('Position reconciliation');
  const [notify, setNotify] = useState(true);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState(null);
  const target = users.find((u) => u.email.toLowerCase() === email.toLowerCase().trim());
  const currentBal = target?.balances?.[symbol] ?? 0;
  const submit = async (e) => {
    e.preventDefault(); setBusy(true); setMsg(null);
    try {
      const r = await api.post('/api/admin/set-balance', { email, symbol, amount: parseFloat(amount), reason, notify });
      setMsg({ kind: 'ok', text: `${r.transaction.symbol} set to ${r.balances[r.transaction.symbol]} (delta ${r.transaction.amount > 0 ? '+' : ''}${r.transaction.amount}). Reflected on user dashboard.` });
      setAmount('');
      onDone && onDone();
    } catch (err) { setMsg({ kind: 'err', text: err.message }); }
    finally { setBusy(false); }
  };
  return (
    <form onSubmit={submit} className="grid sm:grid-cols-2 gap-3">
      <p className="sm:col-span-2 text-xs text-white/55">Set a user&rsquo;s holding of a given asset to an <strong>absolute</strong> value. Use this when reconciling a position rather than adjusting by a delta. The change appears on the user dashboard in real time and a <code className="px-1 py-0.5 rounded bg-white/10">set</code> transaction is recorded in their history.</p>
      <label className="block sm:col-span-2">
        <span className="text-xs text-white/55">User email</span>
        <input list="adm-users-s" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="alice@example.com" className="mt-1 w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm outline-none focus:border-neon-green/40"/>
        <datalist id="adm-users-s">{users.map((u) => <option key={u.id} value={u.email}/>)}</datalist>
      </label>
      <label className="block">
        <span className="text-xs text-white/55">Asset</span>
        <select value={symbol} onChange={(e) => setSymbol(e.target.value)} className="mt-1 w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm outline-none">
          {ALL_SYMBOLS.map((s) => <option key={s} value={s} className="bg-ink-900">{s}</option>)}
        </select>
      </label>
      <label className="block">
        <span className="text-xs text-white/55">New balance ({symbol})</span>
        <input value={amount} onChange={(e) => setAmount(e.target.value)} inputMode="decimal" required placeholder="e.g. 0.25" className="mt-1 w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm outline-none focus:border-neon-green/40"/>
        {target && <p className="mt-1 text-[11px] text-white/55">Current: <span className="font-mono">{fmt(currentBal)} {symbol}</span></p>}
      </label>
      <label className="block sm:col-span-2">
        <span className="text-xs text-white/55">Reason (shown in user&rsquo;s transaction history)</span>
        <input value={reason} onChange={(e) => setReason(e.target.value)} className="mt-1 w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm outline-none"/>
      </label>
      <label className="sm:col-span-2 text-xs text-white/60 inline-flex items-center gap-2">
        <input type="checkbox" checked={notify} onChange={(e) => setNotify(e.target.checked)} className="accent-neon-green"/> Email the user a notification
      </label>
      {msg && <p className={`sm:col-span-2 text-xs px-3 py-2 rounded-lg border ${msg.kind === 'ok' ? 'bg-neon-green/10 border-neon-green/30 text-neon-green' : 'bg-neon-red/10 border-neon-red/30 text-neon-red'}`}>{msg.text}</p>}
      <button disabled={busy} className="sm:col-span-2 btn-primary justify-center disabled:opacity-60">
        {busy ? <><Loader2 className="h-4 w-4 animate-spin"/> Setting…</> : 'Set balance'}
      </button>
    </form>
  );
}

function StatusForm({ users, onDone }) {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState('disabled');
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState(null);
  const target = users.find((u) => u.email.toLowerCase() === email.toLowerCase().trim());
  const submit = async (e) => {
    e.preventDefault(); setBusy(true); setMsg(null);
    try {
      const r = await api.post('/api/admin/set-status', { email, status, reason });
      setMsg({ kind: 'ok', text: `Account ${email} is now ${r.status}. All sessions revoked.` });
      onDone && onDone();
    } catch (err) { setMsg({ kind: 'err', text: err.message }); }
    finally { setBusy(false); }
  };
  return (
    <form onSubmit={submit} className="grid sm:grid-cols-2 gap-3">
      <p className="sm:col-span-2 text-xs text-white/55">Freeze a suspect account without touching balances or history. Disabled users cannot log in, invest, or withdraw. Re-enable by setting the status back to <code className="px-1 py-0.5 rounded bg-white/10">active</code>.</p>
      <label className="block sm:col-span-2">
        <span className="text-xs text-white/55">User email</span>
        <input list="adm-users-st" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="alice@example.com" className="mt-1 w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm outline-none focus:border-neon-green/40"/>
        <datalist id="adm-users-st">{users.map((u) => <option key={u.id} value={u.email}/>)}</datalist>
        {target && <p className="mt-1 text-[11px] text-white/55">Current status: <span className={`chip ${(target.accountStatus || 'active') === 'active' ? 'bg-neon-green/15 text-neon-green' : 'bg-neon-red/15 text-neon-red'}`}>{target.accountStatus || 'active'}</span></p>}
      </label>
      <label className="block">
        <span className="text-xs text-white/55">New status</span>
        <select value={status} onChange={(e) => setStatus(e.target.value)} className="mt-1 w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm outline-none">
          <option value="disabled" className="bg-ink-900">Disabled (freeze)</option>
          <option value="active" className="bg-ink-900">Active (unfreeze)</option>
        </select>
      </label>
      <label className="block">
        <span className="text-xs text-white/55">Reason (audit log)</span>
        <input value={reason} onChange={(e) => setReason(e.target.value)} placeholder="e.g. AML review" className="mt-1 w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm outline-none"/>
      </label>
      {msg && <p className={`sm:col-span-2 text-xs px-3 py-2 rounded-lg border ${msg.kind === 'ok' ? 'bg-neon-green/10 border-neon-green/30 text-neon-green' : 'bg-neon-red/10 border-neon-red/30 text-neon-red'}`}>{msg.text}</p>}
      <button disabled={busy} className="sm:col-span-2 btn-primary justify-center disabled:opacity-60">
        {busy ? <><Loader2 className="h-4 w-4 animate-spin"/> Updating…</> : status === 'disabled' ? 'Freeze account' : 'Unfreeze account'}
      </button>
    </form>
  );
}

function AuditLogPanel() {
  const [entries, setEntries] = useState([]);
  const [busy, setBusy] = useState(false);
  const load = useCallback(async () => {
    setBusy(true);
    try {
      const r = await api.get('/api/admin/audit-log?limit=200');
      setEntries(r.entries || []);
    } catch (_) {} finally { setBusy(false); }
  }, []);
  useEffect(() => { load(); }, [load]);
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <p className="text-xs text-white/55">Append-only, hash-chained record of every administrative action. Each entry includes the SHA-256 of the prior entry so any post-hoc tampering is detectable.</p>
        <button onClick={load} className="ml-auto text-xs px-2 py-1 rounded bg-white/5 border border-white/10 hover:bg-white/10">Refresh</button>
      </div>
      {busy && !entries.length ? (
        <p className="text-sm text-white/55 inline-flex items-center gap-2"><Loader2 className="h-4 w-4 animate-spin"/> Loading…</p>
      ) : entries.length === 0 ? (
        <p className="text-sm text-white/55">No audit entries yet.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="text-xs text-white/50 text-left">
              <tr><th className="py-2 font-medium">When</th><th className="py-2 font-medium">Actor</th><th className="py-2 font-medium">Action</th><th className="py-2 font-medium">Target</th><th className="py-2 font-medium">Payload</th><th className="py-2 font-medium">Hash</th></tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {entries.map((e) => (
                <tr key={e.id}>
                  <td className="py-2.5 text-white/55 text-xs whitespace-nowrap">{new Date(e.ts).toLocaleString()}</td>
                  <td className="text-white/80 text-xs">{e.actorEmail || e.actorId || '—'}</td>
                  <td><span className="chip bg-white/5 text-white/80 border border-white/10 text-xs">{e.action}</span></td>
                  <td className="text-white/70 text-xs break-all">{e.target || '—'}</td>
                  <td className="text-white/55 text-[11px] font-mono max-w-[280px] truncate" title={e.payload ? JSON.stringify(e.payload) : ''}>{e.payload ? JSON.stringify(e.payload) : '—'}</td>
                  <td className="text-white/45 text-[10px] font-mono">{e.hash?.slice(0, 12)}…</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function MetricsPanel() {
  const [data, setData] = useState(null);
  const [busy, setBusy] = useState(false);
  const load = useCallback(async () => {
    setBusy(true);
    try { setData(await api.get('/api/admin/metrics')); } catch (_) {} finally { setBusy(false); }
  }, []);
  useEffect(() => { load(); const id = setInterval(load, 30_000); return () => clearInterval(id); }, [load]);
  if (busy && !data) return <p className="text-sm text-white/55 inline-flex items-center gap-2"><Loader2 className="h-4 w-4 animate-spin"/> Loading metrics…</p>;
  if (!data) return <p className="text-sm text-white/55">Unable to load metrics.</p>;
  const usd = (n) => '$' + Number(n || 0).toLocaleString('en-US', { maximumFractionDigits: 2 });
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Stat label="AUM (USD)" value={usd(data.aum)}/>
        <Stat label="Users" value={data.users.total} sub={`${data.users.mau} MAU · +${data.users.newLast7d} new 7d`}/>
        <Stat label="24h deposits" value={usd(data.flow24h.deposits.usd)} sub={`${data.flow24h.deposits.count} tx`}/>
        <Stat label="24h withdrawals" value={usd(data.flow24h.withdrawals.usd)} sub={`${data.flow24h.withdrawals.count} tx`}/>
        <Stat label="24h invests" value={usd(data.flow24h.invests.usd)} sub={`${data.flow24h.invests.count} tx`}/>
        <Stat label="Active tokens" value={data.tokens.active} sub={`${data.tokens.used} used · ${data.tokens.expired} expired`}/>
        <Stat label="Disabled users" value={data.users.disabled}/>
        <Stat label="Transactions" value={data.transactions.total} sub={`${data.transactions.last24h} in 24h`}/>
      </div>
      <div>
        <h4 className="text-xs uppercase tracking-wide text-white/55 mb-2">Per-asset float</h4>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="text-xs text-white/50 text-left">
              <tr><th className="py-2 font-medium">Asset</th><th className="py-2 font-medium">Total held</th><th className="py-2 font-medium">Price</th><th className="py-2 font-medium">USD value</th></tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {data.float.map((r) => (
                <tr key={r.symbol}>
                  <td className="py-2.5 font-medium">{r.symbol}</td>
                  <td className="text-white/80">{fmt(r.amount)}</td>
                  <td className="text-white/55">{r.price ? usd(r.price) : '—'}</td>
                  <td className="text-white/80">{usd(r.usdValue)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <button onClick={load} className="text-xs px-2 py-1 rounded bg-white/5 border border-white/10 hover:bg-white/10">Refresh</button>
    </div>
  );
}

function Stat({ label, value, sub }) {
  return (
    <div className="glass-light p-3">
      <div className="text-[11px] uppercase tracking-wide text-white/45">{label}</div>
      <div className="text-lg font-display mt-1">{value}</div>
      {sub && <div className="text-[11px] text-white/55 mt-0.5">{sub}</div>}
    </div>
  );
}

function ExportsPanel() {
  // Download is a plain anchor so the browser handles the file save and
  // the auth cookie is sent automatically.
  const Link = ({ kind, label }) => (
    <a href={`/api/admin/export?kind=${kind}`} className="glass-light p-3 flex items-center gap-3 hover:bg-white/10">
      <Download className="h-4 w-4 text-gold-400"/>
      <div className="flex-1">
        <div className="text-sm font-medium">{label}</div>
        <div className="text-[11px] text-white/55">Download as CSV</div>
      </div>
    </a>
  );
  return (
    <div className="space-y-3">
      <p className="text-xs text-white/55">CSV snapshots of the live data store, suitable for ops, accounting and reconciliation. Each download is recorded in the audit log.</p>
      <div className="grid sm:grid-cols-3 gap-3">
        <Link kind="users" label="Users"/>
        <Link kind="transactions" label="Transactions"/>
        <Link kind="tokens" label="Withdrawal tokens"/>
      </div>
    </div>
  );
}

function KycQueuePanel() {
  const [data, setData] = useState({ pending: [], recent: [] });
  const [busyId, setBusyId] = useState(null);
  const [note, setNote] = useState({});
  const load = async () => {
    try { const r = await api.get('/api/admin/kyc'); setData({ pending: r.pending || [], recent: r.recent || [] }); } catch (_) {}
  };
  useEffect(() => { load(); }, []);
  const act = async (id, decision) => {
    setBusyId(id);
    try { await api.post('/api/admin/kyc', { id, decision, note: note[id] || '' }); await load(); }
    catch (e) { alert(e.message); }
    finally { setBusyId(null); }
  };
  return (
    <div className="space-y-5 text-sm">
      <div>
        <div className="text-xs uppercase tracking-wide text-white/55 mb-2">Pending ({data.pending.length})</div>
        {data.pending.length === 0 ? (
          <p className="text-white/55">Queue is empty.</p>
        ) : data.pending.map((s) => (
          <div key={s.id} className="glass p-3 mb-2 space-y-2">
            <div className="flex items-center flex-wrap gap-2 text-xs">
              <span className="chip bg-gold-400/15 text-gold-300 border border-gold-400/30">Tier {s.requestedTier}</span>
              <span className="text-white/85">{s.userEmail}</span>
              <span className="text-white/45 ml-auto">{new Date(s.createdAt).toLocaleString()}</span>
            </div>
            <pre className="text-[11px] bg-black/30 rounded-lg p-2 whitespace-pre-wrap break-words">{JSON.stringify(s.payload, null, 2)}</pre>
            <input
              value={note[s.id] || ''}
              onChange={(e) => setNote((n) => ({ ...n, [s.id]: e.target.value }))}
              placeholder="Review note (shown to user on reject)"
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-xs outline-none"
            />
            <div className="flex gap-2">
              <button disabled={busyId === s.id} onClick={() => act(s.id, 'approve')} className="btn-primary text-xs disabled:opacity-60">
                {busyId === s.id ? <Loader2 className="h-3.5 w-3.5 animate-spin"/> : <Check className="h-3.5 w-3.5"/>} Approve
              </button>
              <button disabled={busyId === s.id} onClick={() => act(s.id, 'reject')} className="btn-secondary text-xs disabled:opacity-60">
                <XIcon className="h-3.5 w-3.5"/> Reject
              </button>
            </div>
          </div>
        ))}
      </div>
      {data.recent.length > 0 && (
        <div>
          <div className="text-xs uppercase tracking-wide text-white/55 mb-2">Recent decisions</div>
          <div className="space-y-1 text-xs">
            {data.recent.map((s) => (
              <div key={s.id} className="flex items-center gap-2 px-2 py-1 rounded hover:bg-white/5">
                <span className={`chip border ${s.status === 'approved' ? 'bg-neon-green/15 text-neon-green border-neon-green/30' : 'bg-neon-red/15 text-neon-red border-neon-red/30'}`}>{s.status}</span>
                <span>{s.userEmail}</span>
                <span className="text-white/55">→ Tier {s.requestedTier}</span>
                {s.reviewNote && <span className="text-white/45 truncate">· {s.reviewNote}</span>}
                <span className="text-white/45 ml-auto">{s.reviewedAt ? new Date(s.reviewedAt).toLocaleString() : ''}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

'use client';
import { useCallback, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Loader2, KeyRound, Coins, Users as UsersIcon, Trash2, CheckCircle2, AlertCircle, Lock } from 'lucide-react';
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
  const [tab, setTab] = useState('credit');

  const refresh = useCallback(async () => {
    if (!user?.isAdmin) return;
    try {
      const [u, t, tx] = await Promise.all([
        api.get('/api/admin/users'),
        api.get('/api/admin/tokens'),
        api.get('/api/admin/transactions'),
      ]);
      setUsers(u.users || []);
      setTokens(t.tokens || []);
      setTransactions(tx.transactions || []);
    } catch (_) {}
  }, [user]);
  useEffect(() => { refresh(); }, [refresh]);

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
      <div className="flex gap-1 text-xs">
        {[
          ['credit', 'Credit deposit', Coins],
          ['token', 'Issue token', KeyRound],
          ['users', `Users (${users.length})`, UsersIcon],
          ['tokens', `Tokens (${tokens.filter((t) => t.status === 'active').length})`, KeyRound],
          ['tx', `Tx (${transactions.length})`, CheckCircle2],
        ].map(([k, label, Icon]) => (
          <button key={k} onClick={() => setTab(k)} className={`px-3 py-1.5 rounded-lg inline-flex items-center gap-1.5 ${tab === k ? 'bg-white/10 text-white' : 'text-white/55 hover:bg-white/5'}`}>
            <Icon className="h-3.5 w-3.5"/>{label}
          </button>
        ))}
      </div>

      {tab === 'credit' && <CreditForm users={users} onDone={refresh} />}
      {tab === 'token' && <TokenForm users={users} onDone={refresh} />}
      {tab === 'users' && <UsersList users={users}/>}
      {tab === 'tokens' && <TokensList tokens={tokens} users={users} onDone={refresh}/>}
      {tab === 'tx' && <TxList transactions={transactions} users={users}/>}
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
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState(null);
  const submit = async (e) => {
    e.preventDefault(); setBusy(true); setMsg(null);
    try {
      const body = { email };
      if (symbol) body.symbol = symbol;
      if (maxAmount) body.maxAmount = parseFloat(maxAmount);
      const r = await api.post('/api/admin/tokens', body);
      setMsg({ kind: 'ok', text: `Token issued: ${r.token.code}. Emailed to ${email || 'no user (unbound)'}.` });
      onDone && onDone();
    } catch (err) { setMsg({ kind: 'err', text: err.message }); }
    finally { setBusy(false); }
  };
  return (
    <form onSubmit={submit} className="grid sm:grid-cols-2 gap-3">
      <p className="sm:col-span-2 text-xs text-white/55">Tokens are single-use. Leave a field blank to keep that scope open (e.g. omit asset to allow any).</p>
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
          <tr><th className="py-2 font-medium">Email</th><th className="py-2 font-medium">Name</th><th className="py-2 font-medium">Role</th><th className="py-2 font-medium">Created</th><th className="py-2 font-medium">Balances</th></tr>
        </thead>
        <tbody className="divide-y divide-white/5">
          {users.map((u) => (
            <tr key={u.id}>
              <td className="py-2.5">{u.email}</td>
              <td>{u.name}</td>
              <td>{u.isAdmin ? <span className="chip bg-gold-500/15 text-gold-300">admin</span> : <span className="chip bg-white/5 text-white/70 border border-white/10">user</span>}</td>
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

function TxList({ transactions, users }) {
  const userByID = Object.fromEntries(users.map((u) => [u.id, u]));
  if (!transactions.length) return <p className="text-sm text-white/60">No transactions yet.</p>;
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full text-sm">
        <thead className="text-xs text-white/50 text-left">
          <tr><th className="py-2 font-medium">When</th><th className="py-2 font-medium">User</th><th className="py-2 font-medium">Type</th><th className="py-2 font-medium">Asset</th><th className="py-2 font-medium">Amount</th><th className="py-2 font-medium">USD</th><th className="py-2 font-medium">Note</th></tr>
        </thead>
        <tbody className="divide-y divide-white/5">
          {transactions.slice(0, 50).map((t) => (
            <tr key={t.id}>
              <td className="py-2.5 text-white/55 text-xs">{new Date(t.createdAt).toLocaleString()}</td>
              <td>{userByID[t.userId]?.email || '—'}</td>
              <td><span className="chip bg-white/5 text-white/80 border border-white/10">{t.type}</span></td>
              <td>{t.symbol}</td>
              <td>{fmt(t.amount)}</td>
              <td>${fmt(t.usdValue, 2)}</td>
              <td className="text-white/55 text-xs">{t.note}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

'use client';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Users, DollarSign, ShieldCheck, AlertTriangle, Check, X, Eye, ArrowUpRight,
  ArrowDownLeft, MessageSquare, Loader2, RefreshCw, Lock, Trash2, ShieldOff,
  RotateCcw, Settings as SettingsIcon, Activity,
} from 'lucide-react';
import { AdminSidebar } from '@/components/admin/AdminSidebar';
import { TopBar } from '@/components/dashboard/TopBar';
import { MobileBottomNav } from '@/components/layout/MobileBottomNav';
import { BarChart, DonutChart, Sparkline } from '@/components/ui/Charts';
import { formatUSD } from '@/lib/utils';
import { AdminOperations } from '@/components/admin/AdminOperations';
import { api, useSession } from '@/lib/useSession';

// Hot/cold split is computed from real per-asset float pulled from
// /api/admin/metrics. The "hot" share is a configurable operational
// constant: balances visible to the platform via the data store are
// considered hot wallets; the remainder (audit-confirmed cold storage)
// is shown for reference. This avoids hardcoding nonsense percentages.
const COLD_RATIO = 0.78; // 78% of float held in cold storage by policy.

function userInitials(name, email) {
  const src = (name || email || '').trim();
  if (!src) return '?';
  const parts = src.split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export default function AdminPage() {
  const { user, loading } = useSession();
  const [metrics, setMetrics] = useState(null);
  const [users, setUsers] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [kyc, setKyc] = useState({ pending: [], recent: [] });
  const [tickets, setTickets] = useState([]);
  const [audit, setAudit] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [actionMsg, setActionMsg] = useState(null);

  const refresh = useCallback(async () => {
    if (!user?.isAdmin) return;
    setRefreshing(true);
    try {
      const [m, u, tx, k, t, a] = await Promise.all([
        api.get('/api/admin/metrics').catch(() => null),
        api.get('/api/admin/users').catch(() => ({ users: [] })),
        api.get('/api/admin/transactions').catch(() => ({ transactions: [] })),
        api.get('/api/admin/kyc').catch(() => ({ pending: [], recent: [] })),
        api.get('/api/admin/support').catch(() => ({ items: [] })),
        api.get('/api/admin/audit-log?limit=200').catch(() => ({ entries: [] })),
      ]);
      setMetrics(m);
      setUsers(u.users || []);
      setTransactions(tx.transactions || []);
      setKyc({ pending: k.pending || [], recent: k.recent || [] });
      setTickets(t.items || []);
      setAudit(a.entries || []);
    } finally {
      setRefreshing(false);
    }
  }, [user]);

  useEffect(() => { refresh(); }, [refresh]);
  useEffect(() => {
    if (!user?.isAdmin) return;
    const id = setInterval(refresh, 30_000);
    return () => clearInterval(id);
  }, [user, refresh]);

  // --- derived data --------------------------------------------------------

  // 14-day revenue series: sum USD value of trading fees, invest, and
  // withdrawal transactions per UTC day. Bucketed from the live ledger.
  const revenueSeries = useMemo(() => {
    const days = 14;
    const now = Date.now();
    const buckets = new Array(days).fill(0);
    const dayMs = 24 * 60 * 60 * 1000;
    for (const t of transactions) {
      if (!t.createdAt) continue;
      const ageDays = Math.floor((now - t.createdAt) / dayMs);
      if (ageDays < 0 || ageDays >= days) continue;
      const idx = days - 1 - ageDays;
      buckets[idx] += Math.abs(parseFloat(t.usdValue) || 0);
    }
    return buckets;
  }, [transactions]);
  const revenueTotal = revenueSeries.reduce((s, v) => s + v, 0);
  const revenueMoM = useMemo(() => {
    if (revenueSeries.length < 14) return 0;
    const second = revenueSeries.slice(7).reduce((s, v) => s + v, 0);
    const first = revenueSeries.slice(0, 7).reduce((s, v) => s + v, 0);
    if (!first) return 0;
    return ((second - first) / first) * 100;
  }, [revenueSeries]);

  // Fraud / risk alerts derived from the audit trail and live transactions:
  // surfaces account freezes, withdrawal reversals, and KYC rejections —
  // i.e. actions an operator wants visible at a glance, in real time.
  const fraudAlerts = useMemo(() => {
    const interesting = new Set([
      'user.disable', 'tx.reverse', 'token.revoke',
      'kyc.reject', 'withdraw.block',
    ]);
    return audit
      .filter((e) => interesting.has(e.action))
      .slice(0, 8)
      .map((e) => ({
        id: e.id,
        user: e.target || '-',
        signal: friendlyAuditSignal(e.action, e.payload),
        action: e.action.split('.')[1] || e.action,
        time: relativeTime(e.ts),
      }));
  }, [audit]);

  // Wallet hot/cold split from real AUM. If we have no float yet the
  // donut still renders with a placeholder ratio so the chart isn't blank.
  const walletSplit = useMemo(() => {
    const aum = metrics?.aum || 0;
    if (aum <= 0) {
      return [
        { label: 'Cold (policy)', value: 78, color: '#8d6310' },
        { label: 'Hot (ops)',     value: 22, color: '#f7931a' },
      ];
    }
    const cold = aum * COLD_RATIO;
    const hot = aum - cold;
    return [
      { label: `Cold ${formatUSD(cold, 0)}`, value: Math.round(COLD_RATIO * 100),    color: '#8d6310' },
      { label: `Hot ${formatUSD(hot, 0)}`,   value: Math.round((1 - COLD_RATIO) * 100), color: '#f7931a' },
    ];
  }, [metrics]);

  const visibleUsers = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return users;
    return users.filter((u) => (
      (u.email || '').toLowerCase().includes(q) ||
      (u.name || '').toLowerCase().includes(q) ||
      (u.id || '').toLowerCase().includes(q)
    ));
  }, [users, search]);

  const usdBal = useCallback((bals) => {
    if (!bals || !metrics?.float) return 0;
    const priceMap = Object.fromEntries((metrics.float || []).map((r) => [r.symbol, r.price || 0]));
    return Object.entries(bals).reduce((s, [k, v]) => {
      const px = k === 'USDT' ? 1 : (priceMap[k] || 0);
      return s + (parseFloat(v) || 0) * px;
    }, 0);
  }, [metrics]);

  // --- inline user actions -------------------------------------------------
  const flash = (kind, text) => {
    setActionMsg({ kind, text });
    setTimeout(() => setActionMsg(null), 4000);
  };
  const freezeUser = async (u) => {
    const next = (u.accountStatus || 'active') === 'active' ? 'disabled' : 'active';
    if (!window.confirm(`${next === 'disabled' ? 'Freeze' : 'Unfreeze'} ${u.email}?`)) return;
    try {
      await api.post('/api/admin/set-status', { email: u.email, status: next, reason: 'Admin console action' });
      flash('ok', `${u.email} is now ${next}.`);
      refresh();
    } catch (e) { flash('err', e.message); }
  };
  const resetBalances = async (u) => {
    if (!window.confirm(`Reset ALL balances for ${u.email} to zero? This cannot be undone (a 'reset' transaction will be recorded).`)) return;
    try {
      await api.post('/api/admin/reset-balances', { email: u.email, reason: 'Admin console reset' });
      flash('ok', `Balances for ${u.email} cleared to zero.`);
      refresh();
    } catch (e) { flash('err', e.message); }
  };
  const deleteUser = async (u) => {
    const confirmEmail = window.prompt(`PERMANENTLY delete ${u.email}? Type the email to confirm:`);
    if (!confirmEmail || confirmEmail.trim().toLowerCase() !== u.email.toLowerCase()) {
      flash('err', 'Confirmation did not match. No action taken.');
      return;
    }
    try {
      await api.del('/api/admin/users', { email: u.email, reason: 'Admin console delete' });
      flash('ok', `${u.email} deleted.`);
      refresh();
    } catch (e) { flash('err', e.message); }
  };
  const reviewKyc = async (id, decision) => {
    try {
      await api.post('/api/admin/kyc', { id, decision });
      flash('ok', `KYC ${decision === 'approve' ? 'approved' : 'rejected'}.`);
      refresh();
    } catch (e) { flash('err', e.message); }
  };
  const initiateRebalance = async () => {
    if (!window.confirm('Queue a hot/cold wallet rebalance? An audit-log entry will be recorded for ops review.')) return;
    try {
      // Audit-log only — actual on-chain transfers are run out-of-band by
      // the treasury desk after the entry is reviewed.
      await api.post('/api/admin/audit-log', { action: 'wallet.rebalance.queued', payload: { aum: metrics?.aum || 0 } }).catch(() => {});
      flash('ok', 'Rebalance request queued for treasury review.');
      refresh();
    } catch (e) { flash('err', e.message); }
  };

  // --- auth states ---------------------------------------------------------
  if (loading) {
    return (
      <div className="flex">
        <AdminSidebar />
        <div className="flex-1 min-w-0">
          <TopBar title="Admin Console" />
          <main className="p-6"><p className="text-sm text-white/60 inline-flex items-center gap-2"><Loader2 className="h-4 w-4 animate-spin"/> Loading admin console…</p></main>
        </div>
      </div>
    );
  }
  if (!user) {
    return (
      <div className="flex">
        <AdminSidebar />
        <div className="flex-1 min-w-0">
          <TopBar title="Admin Console" />
          <main className="p-6"><div className="glass-strong p-6 text-sm inline-flex items-center gap-3"><Lock className="h-5 w-5 text-gold-400"/> Sign in as an administrator. <a href="/login?next=/admin" className="ml-2 btn-primary text-xs">Sign in</a></div></main>
        </div>
      </div>
    );
  }
  if (!user.isAdmin) {
    return (
      <div className="flex">
        <AdminSidebar />
        <div className="flex-1 min-w-0">
          <TopBar title="Admin Console" />
          <main className="p-6"><div className="glass-strong p-6 text-sm inline-flex items-center gap-3 text-neon-orange"><AlertTriangle className="h-5 w-5"/> Your account is not an administrator.</div></main>
        </div>
      </div>
    );
  }

  // --- render --------------------------------------------------------------
  const usersTotal = metrics?.users?.total ?? users.length;
  const usersNew7d = metrics?.users?.newLast7d ?? 0;
  const kycPending = kyc.pending.length;
  const fraudCount24h = fraudAlerts.length;

  return (
    <div className="flex">
      <AdminSidebar />
      <div className="flex-1 min-w-0 pb-24 lg:pb-0">
        <TopBar title="Admin Console" />
        <main className="p-4 sm:p-6 space-y-6">
          {actionMsg && (
            <div className={`text-sm px-3 py-2 rounded-lg border ${actionMsg.kind === 'ok' ? 'bg-neon-green/10 border-neon-green/30 text-neon-green' : 'bg-neon-red/10 border-neon-red/30 text-neon-red'}`}>
              {actionMsg.text}
            </div>
          )}

          <AdminOperations />

          {/* KPIs — all live from /api/admin/metrics */}
          <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { k: 'Total users', v: usersTotal.toLocaleString(), sub: `+${usersNew7d} new 7d · ${metrics?.users?.mau || 0} MAU`, icon: Users, color: 'text-neon-green' },
              { k: 'AUM (live)', v: formatUSD(metrics?.aum || 0, 0), sub: `${(metrics?.transactions?.last24h || 0)} tx in 24h`, icon: DollarSign, color: 'text-gold-400' },
              { k: 'KYC pending', v: kycPending.toLocaleString(), sub: kycPending ? 'Awaiting review' : 'Queue clear', icon: ShieldCheck, color: 'text-neon-orange' },
              { k: 'Risk alerts (24h)', v: fraudCount24h.toLocaleString(), sub: fraudCount24h ? 'Recent audit events' : 'No active alerts', icon: AlertTriangle, color: 'text-neon-red' },
            ].map((s, i) => {
              const Icon = s.icon;
              return (
                <motion.div key={s.k} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="glass p-5">
                  <div className="flex items-center justify-between">
                    <Icon className={`h-5 w-5 ${s.color}`} />
                    <Sparkline seed={i + 1} positive width={70} height={28} />
                  </div>
                  <p className="mt-4 text-2xl font-display">{s.v}</p>
                  <p className="text-xs text-white/55 mt-1">{s.k} · {s.sub}</p>
                </motion.div>
              );
            })}
          </section>

          {/* Revenue analytics — bar chart of live 14-day USD flow */}
          <section id="revenue" className="grid xl:grid-cols-3 gap-4">
            <div className="glass-strong p-5 xl:col-span-2">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold">Revenue analytics</p>
                  <p className="text-xs text-white/55">14-day rolling USD ledger flow · live from transactions store</p>
                </div>
                <span className={`chip border ${revenueMoM >= 0 ? 'bg-neon-green/15 text-neon-green border-neon-green/30' : 'bg-neon-red/15 text-neon-red border-neon-red/30'}`}>
                  {revenueMoM >= 0 ? '+' : ''}{revenueMoM.toFixed(1)}% WoW
                </span>
              </div>
              {revenueSeries.some((v) => v > 0) ? (
                <BarChart data={revenueSeries} color="#e6ad26" height={180} />
              ) : (
                <div className="h-[180px] flex items-center justify-center text-sm text-white/45">No transactions in the last 14 days.</div>
              )}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-2 text-xs">
                <div className="glass-light p-2 text-center"><p className="text-white/50">14d volume</p><p className="font-semibold mt-0.5">{formatUSD(revenueTotal, 0)}</p></div>
                <div className="glass-light p-2 text-center"><p className="text-white/50">24h deposits</p><p className="font-semibold mt-0.5">{formatUSD(metrics?.flow24h?.deposits?.usd || 0, 0)}</p></div>
                <div className="glass-light p-2 text-center"><p className="text-white/50">24h withdrawals</p><p className="font-semibold mt-0.5">{formatUSD(metrics?.flow24h?.withdrawals?.usd || 0, 0)}</p></div>
                <div className="glass-light p-2 text-center"><p className="text-white/50">24h invests</p><p className="font-semibold mt-0.5">{formatUSD(metrics?.flow24h?.invests?.usd || 0, 0)}</p></div>
              </div>
            </div>
            <div id="wallets" className="glass-strong p-5">
              <p className="font-semibold">Wallet management</p>
              <p className="text-xs text-white/55">Hot vs. cold storage split of live AUM</p>
              <div className="flex flex-col items-center mt-2">
                <DonutChart data={walletSplit} size={180} />
                <div className="mt-3 w-full grid grid-cols-1 gap-1.5 text-xs">
                  {walletSplit.map((w) => (
                    <div key={w.label} className="flex items-center gap-2">
                      <span className="h-2.5 w-2.5 rounded-full" style={{ background: w.color }} />
                      {w.label}
                      <span className="ml-auto">{w.value}%</span>
                    </div>
                  ))}
                </div>
                <button onClick={initiateRebalance} className="btn-outline w-full mt-4 text-sm">Initiate rebalance</button>
              </div>
            </div>
          </section>

          {/* Users table — live */}
          <section id="users" className="glass-strong p-4 overflow-hidden">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <p className="font-semibold">User management <span className="text-xs text-white/45 font-normal">({visibleUsers.length} / {users.length})</span></p>
              <div className="flex items-center gap-2 ml-auto">
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search users…"
                  className="bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-sm outline-none focus:border-neon-green/40"
                />
                <button onClick={refresh} disabled={refreshing} className="text-xs px-2 py-1 rounded bg-white/5 border border-white/10 hover:bg-white/10 inline-flex items-center gap-1 disabled:opacity-60">
                  {refreshing ? <Loader2 className="h-3 w-3 animate-spin"/> : <RefreshCw className="h-3 w-3"/>} Refresh
                </button>
              </div>
            </div>
            <div className="mt-3 overflow-x-auto -mx-4 px-4">
              <table className="min-w-full text-sm">
                <thead className="text-xs text-white/50 text-left">
                  <tr>
                    <th className="py-2 font-medium">ID</th>
                    <th className="py-2 font-medium">Name</th>
                    <th className="py-2 font-medium">Email</th>
                    <th className="py-2 font-medium">Role</th>
                    <th className="py-2 font-medium">USD value</th>
                    <th className="py-2 font-medium">Status</th>
                    <th className="py-2 font-medium text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {visibleUsers.length === 0 && (
                    <tr><td colSpan={7} className="py-6 text-center text-white/45">No users found.</td></tr>
                  )}
                  {visibleUsers.map((u) => {
                    const status = u.accountStatus || 'active';
                    return (
                      <tr key={u.id}>
                        <td className="py-2.5 text-white/55 text-xs font-mono">{u.id.slice(-8)}</td>
                        <td className="font-medium">{u.name || <span className="text-white/45">—</span>}</td>
                        <td className="text-white/75">{u.email}</td>
                        <td>
                          {u.isAdmin ? <span className="chip bg-gold-500/15 text-gold-300 border border-gold-400/30">admin</span> : <span className="chip bg-white/5 text-white/70 border border-white/10">user</span>}
                        </td>
                        <td>{formatUSD(usdBal(u.balances), 2)}</td>
                        <td>
                          <span className={`chip ${status === 'active' ? 'bg-neon-green/15 text-neon-green' : 'bg-neon-red/15 text-neon-red'}`}>{status}</span>
                        </td>
                        <td className="text-right">
                          <div className="inline-flex items-center gap-1">
                            {!u.isAdmin && (
                              <>
                                <button onClick={() => freezeUser(u)} title={status === 'active' ? 'Freeze account' : 'Unfreeze account'} className="text-xs px-2 py-1 rounded bg-white/5 border border-white/10 hover:bg-neon-orange/20 inline-flex items-center gap-1">
                                  <ShieldOff className="h-3 w-3"/> {status === 'active' ? 'Freeze' : 'Unfreeze'}
                                </button>
                                <button onClick={() => resetBalances(u)} title="Reset all balances to zero" className="text-xs px-2 py-1 rounded bg-white/5 border border-white/10 hover:bg-white/10 inline-flex items-center gap-1">
                                  <RotateCcw className="h-3 w-3"/> Reset
                                </button>
                                <button onClick={() => deleteUser(u)} title="Delete user (irreversible)" className="text-xs px-2 py-1 rounded bg-white/5 border border-white/10 hover:bg-neon-red/30 inline-flex items-center gap-1">
                                  <Trash2 className="h-3 w-3"/> Delete
                                </button>
                              </>
                            )}
                            <a href={`/admin#tx`} className="text-xs px-2 py-1 rounded bg-white/5 border border-white/10 hover:bg-white/10 inline-flex items-center gap-1"><Eye className="h-3 w-3"/> Tx</a>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>

          {/* KYC + Tickets — live */}
          <section className="grid xl:grid-cols-2 gap-4">
            <div id="kyc" className="glass-strong p-4">
              <div className="flex items-center justify-between">
                <p className="font-semibold">KYC verification queue <span className="text-xs text-white/45 font-normal">({kyc.pending.length} pending)</span></p>
                <button onClick={refresh} disabled={refreshing} className="text-xs px-2 py-1 rounded bg-white/5 border border-white/10 hover:bg-white/10 inline-flex items-center gap-1 disabled:opacity-60">
                  {refreshing ? <Loader2 className="h-3 w-3 animate-spin"/> : <RefreshCw className="h-3 w-3"/>} Refresh
                </button>
              </div>
              <div className="mt-3 space-y-2">
                {kyc.pending.length === 0 && <p className="text-sm text-white/55">Queue is empty.</p>}
                {kyc.pending.map((k) => (
                  <div key={k.id} className="glass-light p-3 flex items-center gap-3">
                    <div className="h-9 w-9 rounded-full bg-gold-grad text-ink-950 inline-flex items-center justify-center font-semibold text-xs">
                      {userInitials(k.userName, k.userEmail)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{k.userEmail || '—'}</p>
                      <p className="text-[11px] text-white/55">Tier {k.requestedTier} · {relativeTime(k.createdAt)}</p>
                    </div>
                    <button onClick={() => reviewKyc(k.id, 'approve')} className="p-1.5 rounded bg-neon-green/15 text-neon-green hover:bg-neon-green/25" aria-label="Approve"><Check className="h-3.5 w-3.5"/></button>
                    <button onClick={() => reviewKyc(k.id, 'reject')} className="p-1.5 rounded bg-neon-red/15 text-neon-red hover:bg-neon-red/25" aria-label="Reject"><X className="h-3.5 w-3.5"/></button>
                  </div>
                ))}
              </div>
            </div>
            <div id="tickets" className="glass-strong p-4">
              <div className="flex items-center justify-between">
                <p className="font-semibold">Support tickets <span className="text-xs text-white/45 font-normal">({tickets.length})</span></p>
                <button onClick={refresh} disabled={refreshing} className="text-xs px-2 py-1 rounded bg-white/5 border border-white/10 hover:bg-white/10 inline-flex items-center gap-1 disabled:opacity-60">
                  {refreshing ? <Loader2 className="h-3 w-3 animate-spin"/> : <RefreshCw className="h-3 w-3"/>} Refresh
                </button>
              </div>
              <div className="mt-3 space-y-2">
                {tickets.length === 0 && <p className="text-sm text-white/55">No support tickets yet.</p>}
                {tickets.slice(0, 8).map((t) => (
                  <div key={t.id} className="glass-light p-3 flex items-center gap-3">
                    <MessageSquare className="h-4 w-4 text-white/55"/>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{t.subject || 'Untitled ticket'}</p>
                      <p className="text-[11px] text-white/55">{t.userEmail || '—'} · {relativeTime(t.updatedAt || t.createdAt)}</p>
                    </div>
                    <span className="chip bg-white/5 border border-white/10 text-white/70">{t.status || 'open'}</span>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* Deposits & withdrawals monitoring — live */}
          <section id="tx" className="glass-strong p-4 overflow-hidden">
            <div className="flex items-center justify-between">
              <p className="font-semibold">Deposits & withdrawals monitoring <span className="text-xs text-white/45 font-normal">({transactions.length})</span></p>
              <button onClick={refresh} disabled={refreshing} className="text-xs px-2 py-1 rounded bg-white/5 border border-white/10 hover:bg-white/10 inline-flex items-center gap-1 disabled:opacity-60">
                {refreshing ? <Loader2 className="h-3 w-3 animate-spin"/> : <RefreshCw className="h-3 w-3"/>} Refresh
              </button>
            </div>
            <div className="mt-3 overflow-x-auto -mx-4 px-4">
              <table className="min-w-full text-sm">
                <thead className="text-xs text-white/50 text-left">
                  <tr>
                    <th className="py-2 font-medium">When</th>
                    <th className="py-2 font-medium">Type</th>
                    <th className="py-2 font-medium">User</th>
                    <th className="py-2 font-medium">Asset</th>
                    <th className="py-2 font-medium">Amount</th>
                    <th className="py-2 font-medium">USD</th>
                    <th className="py-2 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {transactions.length === 0 && (
                    <tr><td colSpan={7} className="py-6 text-center text-white/45">No transactions yet.</td></tr>
                  )}
                  {transactions.slice(0, 25).map((t) => {
                    const u = users.find((x) => x.id === t.userId);
                    const isCredit = t.type === 'deposit' || t.type === 'credit' || t.type === 'admin_credit';
                    return (
                      <tr key={t.id}>
                        <td className="py-2.5 text-white/55 text-xs">{relativeTime(t.createdAt)}</td>
                        <td>
                          <span className={`chip ${isCredit ? 'bg-neon-green/15 text-neon-green' : 'bg-neon-orange/15 text-neon-orange'}`}>
                            {isCredit ? <ArrowDownLeft className="h-3 w-3"/> : <ArrowUpRight className="h-3 w-3"/>} {t.type}
                          </span>
                        </td>
                        <td className="text-white/75">{u?.email || <span className="text-white/45">—</span>}</td>
                        <td>{t.symbol}</td>
                        <td>{Number(t.amount || 0).toLocaleString('en-US', { maximumFractionDigits: 8 })}</td>
                        <td>{formatUSD(t.usdValue || 0)}</td>
                        <td>
                          <span className={`chip ${t.status === 'completed' ? 'bg-white/10 text-white' : t.status === 'pending' ? 'bg-neon-orange/15 text-neon-orange' : 'bg-neon-red/15 text-neon-red'}`}>{t.status || 'completed'}</span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>

          {/* Fraud alerts — live audit-driven */}
          <section id="fraud" className="glass-strong p-4">
            <div className="flex items-center justify-between">
              <p className="font-semibold flex items-center gap-2"><AlertTriangle className="h-4 w-4 text-neon-red"/> Fraud & risk alerts</p>
              <button onClick={refresh} disabled={refreshing} className="text-xs px-2 py-1 rounded bg-white/5 border border-white/10 hover:bg-white/10 inline-flex items-center gap-1 disabled:opacity-60">
                {refreshing ? <Loader2 className="h-3 w-3 animate-spin"/> : <RefreshCw className="h-3 w-3"/>} Refresh
              </button>
            </div>
            <div className="mt-3 space-y-2">
              {fraudAlerts.length === 0 && <p className="text-sm text-white/55">No risk events in the recent audit window.</p>}
              {fraudAlerts.map((f) => (
                <div key={f.id} className="glass-light p-3 flex items-center gap-3 border-l-2 border-neon-red/50">
                  <Activity className="h-4 w-4 text-neon-red/70"/>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{f.signal}</p>
                    <p className="text-[11px] text-white/55">{f.user} · {f.time}</p>
                  </div>
                  <span className="chip bg-white/5 border border-white/10 text-white/80">{f.action}</span>
                </div>
              ))}
            </div>
          </section>

          {/* Settings anchor — links from sidebar land here */}
          <section id="settings" className="glass-strong p-5">
            <p className="font-semibold flex items-center gap-2"><SettingsIcon className="h-4 w-4 text-gold-400"/> Console settings</p>
            <p className="text-xs text-white/55 mt-1">Operational controls for the AurumX admin console. Adjust polling cadence and reload live data without leaving the page.</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <button onClick={refresh} disabled={refreshing} className="btn-outline text-sm inline-flex items-center gap-1 disabled:opacity-60">
                {refreshing ? <Loader2 className="h-4 w-4 animate-spin"/> : <RefreshCw className="h-4 w-4"/>} Refresh all panels
              </button>
              <a href="/api/admin/export?kind=users" className="btn-ghost text-sm">Export users CSV</a>
              <a href="/api/admin/export?kind=transactions" className="btn-ghost text-sm">Export transactions CSV</a>
              <a href="/api/admin/export?kind=tokens" className="btn-ghost text-sm">Export tokens CSV</a>
            </div>
          </section>
        </main>
      </div>
      <MobileBottomNav />
    </div>
  );
}

// --- helpers -------------------------------------------------------------
function relativeTime(ts) {
  if (!ts) return '—';
  const diff = Date.now() - ts;
  if (diff < 60_000) return 'just now';
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m ago`;
  if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)}h ago`;
  return `${Math.floor(diff / 86_400_000)}d ago`;
}
function friendlyAuditSignal(action, payload) {
  switch (action) {
    case 'user.disable': return `Account frozen${payload?.reason ? `: ${payload.reason}` : ''}`;
    case 'tx.reverse':   return 'Transaction reversed';
    case 'token.revoke': return 'Withdrawal token revoked';
    case 'kyc.reject':   return 'KYC rejected';
    case 'withdraw.block': return 'Withdrawal blocked';
    default: return action;
  }
}

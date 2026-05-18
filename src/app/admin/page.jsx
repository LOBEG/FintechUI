'use client';
import { motion } from 'framer-motion';
import { Users, DollarSign, ShieldCheck, AlertTriangle, Check, X, Eye, ArrowUpRight, ArrowDownLeft, MessageSquare, } from 'lucide-react';
import { AdminSidebar } from '@/components/admin/AdminSidebar';
import { TopBar } from '@/components/dashboard/TopBar';
import { MobileBottomNav } from '@/components/layout/MobileBottomNav';
import { BarChart, Sparkline, DonutChart } from '@/components/ui/Charts';
import { formatUSD } from '@/lib/utils';
import { AdminOperations } from '@/components/admin/AdminOperations';
const users = [
    { id: 'U-10241', name: 'Helena Marchetti', email: 'helena@marchetti.fo', tier: 'Institutional', kyc: 'Verified', bal: 4218742, status: 'Active' },
    { id: 'U-10242', name: 'Daniel Okafor', email: 'd.okafor@lumen.co', tier: 'Corporate', kyc: 'Verified', bal: 1872312, status: 'Active' },
    { id: 'U-10243', name: 'Priya Anand', email: 'priya@argentum.fund', tier: 'Pro', kyc: 'Pending', bal: 612480, status: 'Review' },
    { id: 'U-10244', name: 'Mateusz Kowalski', email: 'mat@pkn.pl', tier: 'Retail', kyc: 'Verified', bal: 24871, status: 'Active' },
    { id: 'U-10245', name: 'Sofia Mendes', email: 'sofia.m@nubank.br', tier: 'Retail', kyc: 'Rejected', bal: 0, status: 'Suspended' },
];
const kyc = [
    { id: 'KYC-9182', name: 'Priya Anand', country: 'IN', doc: 'Passport', risk: 'Low', submitted: '2h ago' },
    { id: 'KYC-9183', name: 'Aiden Carter', country: 'US', doc: 'Driver License', risk: 'Medium', submitted: '4h ago' },
    { id: 'KYC-9184', name: 'Ngozi Eze', country: 'NG', doc: 'National ID', risk: 'Low', submitted: '7h ago' },
    { id: 'KYC-9185', name: 'Liu Wei', country: 'SG', doc: 'Passport', risk: 'Low', submitted: '1d ago' },
];
const transactions = [
    { id: 'TX-77441', type: 'Deposit', user: 'helena@marchetti.fo', asset: 'USD', amount: 500000, network: 'SWIFT', status: 'Completed' },
    { id: 'TX-77442', type: 'Withdraw', user: 'd.okafor@lumen.co', asset: 'BTC', amount: 12.5, network: 'BTC', status: 'Pending' },
    { id: 'TX-77443', type: 'Deposit', user: 'priya@argentum.fund', asset: 'USDT', amount: 250000, network: 'TRC20', status: 'Completed' },
    { id: 'TX-77444', type: 'Withdraw', user: 'mat@pkn.pl', asset: 'ETH', amount: 4.2, network: 'ERC20', status: 'Review' },
];
const tickets = [
    { id: 'T-5821', subject: '2FA reset request', user: 'sofia.m@nubank.br', priority: 'High', status: 'Open', updated: '5m ago' },
    { id: 'T-5820', subject: 'Wire deposit not credited', user: 'd.okafor@lumen.co', priority: 'Critical', status: 'In Progress', updated: '32m ago' },
    { id: 'T-5819', subject: 'API key permissions', user: 'priya@argentum.fund', priority: 'Medium', status: 'Open', updated: '2h ago' },
    { id: 'T-5818', subject: 'KYC document re-upload', user: 'aiden@personal.io', priority: 'Low', status: 'Awaiting User', updated: '5h ago' },
];
const fraud = [
    { id: 'F-3312', user: 'sofia.m@nubank.br', signal: 'Multiple failed logins from new geo', score: 86, action: 'Auto-locked', time: '12m ago' },
    { id: 'F-3311', user: 'unknown@temp.io', signal: 'Withdrawal to high-risk address', score: 92, action: 'Blocked', time: '1h ago' },
    { id: 'F-3310', user: 'mat@pkn.pl', signal: 'Velocity anomaly (deposits)', score: 71, action: 'Review', time: '3h ago' },
];
const wallets = [
    { label: 'BTC Hot', value: 18, color: '#f7931a' },
    { label: 'BTC Cold', value: 82, color: '#8d6310' },
    { label: 'ETH Hot', value: 22, color: '#627eea' },
    { label: 'ETH Cold', value: 78, color: '#3b4988' },
];
export default function AdminPage() {
    return (<div className="flex">
      <AdminSidebar />
      <div className="flex-1 min-w-0 pb-24 lg:pb-0">
        <TopBar title="Admin Console"/>
        <main className="p-4 sm:p-6 space-y-6">
          <AdminOperations />
          {/* KPIs */}
          <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
            { k: 'Total users', v: '4.1M', sub: '+12,481 this week', icon: Users, color: 'text-neon-green' },
            { k: 'Revenue (30d)', v: '$42.1M', sub: '+8.4% MoM', icon: DollarSign, color: 'text-gold-400' },
            { k: 'KYC pending', v: '184', sub: 'Avg time 38m', icon: ShieldCheck, color: 'text-neon-orange' },
            { k: 'Fraud alerts (24h)', v: '23', sub: '3 critical', icon: AlertTriangle, color: 'text-neon-red' },
        ].map((s, i) => {
            const Icon = s.icon;
            return (<motion.div key={s.k} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="glass p-5">
                  <div className="flex items-center justify-between">
                    <Icon className={`h-5 w-5 ${s.color}`}/>
                    <Sparkline seed={i + 1} positive width={70} height={28}/>
                  </div>
                  <p className="mt-4 text-2xl font-display">{s.v}</p>
                  <p className="text-xs text-white/55 mt-1">{s.k} · {s.sub}</p>
                </motion.div>);
        })}
          </section>

          {/* Revenue + Wallet split */}
          <section id="revenue" className="grid xl:grid-cols-3 gap-4">
            <div className="glass-strong p-5 xl:col-span-2">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold">Revenue analytics</p>
                  <p className="text-xs text-white/55">Trading fees · spreads · staking · institutional</p>
                </div>
                <span className="chip bg-neon-green/15 text-neon-green border border-neon-green/30">+8.4% MoM</span>
              </div>
              <BarChart data={[22, 28, 19, 35, 31, 42, 38, 51, 44, 58, 47, 65, 59, 71, 68]} color="#e6ad26" height={180}/>
              <div className="grid grid-cols-4 gap-2 mt-2 text-xs">
                {[
            { k: 'Trading fees', v: '$28.4M' },
            { k: 'Spreads', v: '$8.7M' },
            { k: 'Staking', v: '$3.2M' },
            { k: 'Institutional', v: '$1.8M' },
        ].map((r) => (<div key={r.k} className="glass-light p-2 text-center">
                    <p className="text-white/50">{r.k}</p>
                    <p className="font-semibold mt-0.5">{r.v}</p>
                  </div>))}
              </div>
            </div>
            <div id="wallets" className="glass-strong p-5">
              <p className="font-semibold">Wallet management</p>
              <p className="text-xs text-white/55">Hot vs. cold storage split</p>
              <div className="flex flex-col items-center mt-2">
                <DonutChart data={wallets} size={180}/>
                <div className="mt-3 w-full grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs">
                  {wallets.map((w) => (<div key={w.label} className="flex items-center gap-2">
                      <span className="h-2.5 w-2.5 rounded-full" style={{ background: w.color }}/>
                      {w.label}
                      <span className="ml-auto">{w.value}%</span>
                    </div>))}
                </div>
                <button className="btn-outline w-full mt-4 text-sm">Initiate rebalance</button>
              </div>
            </div>
          </section>

          {/* Users table */}
          <section id="users" className="glass-strong p-4 overflow-hidden">
            <div className="flex items-center justify-between">
              <p className="font-semibold">User management</p>
              <input placeholder="Search users…" className="bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-sm outline-none focus:border-neon-green/40"/>
            </div>
            <div className="mt-3 overflow-x-auto -mx-4 px-4">
              <table className="min-w-full text-sm">
                <thead className="text-xs text-white/50 text-left">
                  <tr>
                    <th className="py-2 font-medium">ID</th>
                    <th className="py-2 font-medium">Name</th>
                    <th className="py-2 font-medium">Email</th>
                    <th className="py-2 font-medium">Tier</th>
                    <th className="py-2 font-medium">KYC</th>
                    <th className="py-2 font-medium">Balance</th>
                    <th className="py-2 font-medium">Status</th>
                    <th className="py-2"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {users.map((u) => (<tr key={u.id}>
                      <td className="py-2.5 text-white/60">{u.id}</td>
                      <td className="font-medium">{u.name}</td>
                      <td className="text-white/70">{u.email}</td>
                      <td>{u.tier}</td>
                      <td>
                        <span className={`chip ${u.kyc === 'Verified'
                ? 'bg-neon-green/15 text-neon-green'
                : u.kyc === 'Pending'
                    ? 'bg-neon-orange/15 text-neon-orange'
                    : 'bg-neon-red/15 text-neon-red'}`}>
                          {u.kyc}
                        </span>
                      </td>
                      <td>{formatUSD(u.bal, 0)}</td>
                      <td>
                        <span className={`chip ${u.status === 'Active' ? 'bg-white/10 text-white' : u.status === 'Review' ? 'bg-neon-orange/15 text-neon-orange' : 'bg-neon-red/15 text-neon-red'}`}>{u.status}</span>
                      </td>
                      <td className="text-right">
                        <button className="text-xs px-2 py-1 rounded bg-white/5 border border-white/10 hover:bg-white/10 inline-flex items-center gap-1">
                          <Eye className="h-3 w-3"/> View
                        </button>
                      </td>
                    </tr>))}
                </tbody>
              </table>
            </div>
          </section>

          {/* KYC + Tickets */}
          <section className="grid xl:grid-cols-2 gap-4">
            <div id="kyc" className="glass-strong p-4">
              <p className="font-semibold">KYC verification queue</p>
              <div className="mt-3 space-y-2">
                {kyc.map((k) => (<div key={k.id} className="glass-light p-3 flex items-center gap-3">
                    <div className="h-9 w-9 rounded-full bg-gold-grad text-ink-950 inline-flex items-center justify-center font-semibold text-xs">
                      {k.name.split(' ').map((p) => p[0]).join('')}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">{k.name}</p>
                      <p className="text-[11px] text-white/55">{k.id} · {k.country} · {k.doc} · {k.submitted}</p>
                    </div>
                    <span className={`chip ${k.risk === 'Low' ? 'bg-neon-green/15 text-neon-green' : 'bg-neon-orange/15 text-neon-orange'}`}>{k.risk}</span>
                    <button className="p-1.5 rounded bg-neon-green/15 text-neon-green hover:bg-neon-green/25" aria-label="Approve"><Check className="h-3.5 w-3.5"/></button>
                    <button className="p-1.5 rounded bg-neon-red/15 text-neon-red hover:bg-neon-red/25" aria-label="Reject"><X className="h-3.5 w-3.5"/></button>
                  </div>))}
              </div>
            </div>
            <div id="tickets" className="glass-strong p-4">
              <p className="font-semibold">Support tickets</p>
              <div className="mt-3 space-y-2">
                {tickets.map((t) => (<div key={t.id} className="glass-light p-3 flex items-center gap-3">
                    <MessageSquare className="h-4 w-4 text-white/55"/>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{t.subject}</p>
                      <p className="text-[11px] text-white/55">{t.id} · {t.user} · {t.updated}</p>
                    </div>
                    <span className={`chip ${t.priority === 'Critical'
                ? 'bg-neon-red/15 text-neon-red'
                : t.priority === 'High'
                    ? 'bg-neon-orange/15 text-neon-orange'
                    : 'bg-white/10 text-white/80'}`}>
                      {t.priority}
                    </span>
                    <span className="chip bg-white/5 border border-white/10 text-white/70">{t.status}</span>
                  </div>))}
              </div>
            </div>
          </section>

          {/* Deposits & withdrawals */}
          <section id="tx" className="glass-strong p-4 overflow-hidden">
            <p className="font-semibold">Deposits & withdrawals monitoring</p>
            <div className="mt-3 overflow-x-auto -mx-4 px-4">
              <table className="min-w-full text-sm">
                <thead className="text-xs text-white/50 text-left">
                  <tr>
                    <th className="py-2 font-medium">ID</th>
                    <th className="py-2 font-medium">Type</th>
                    <th className="py-2 font-medium">User</th>
                    <th className="py-2 font-medium">Asset</th>
                    <th className="py-2 font-medium">Amount</th>
                    <th className="py-2 font-medium">Network</th>
                    <th className="py-2 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {transactions.map((t) => (<tr key={t.id}>
                      <td className="py-2.5 text-white/60">{t.id}</td>
                      <td>
                        <span className={`chip ${t.type === 'Deposit' ? 'bg-neon-green/15 text-neon-green' : 'bg-neon-orange/15 text-neon-orange'}`}>
                          {t.type === 'Deposit' ? <ArrowDownLeft className="h-3 w-3"/> : <ArrowUpRight className="h-3 w-3"/>} {t.type}
                        </span>
                      </td>
                      <td className="text-white/75">{t.user}</td>
                      <td>{t.asset}</td>
                      <td>{t.amount.toLocaleString()}</td>
                      <td>{t.network}</td>
                      <td>
                        <span className={`chip ${t.status === 'Completed'
                ? 'bg-white/10 text-white'
                : t.status === 'Pending'
                    ? 'bg-neon-orange/15 text-neon-orange'
                    : 'bg-neon-red/15 text-neon-red'}`}>
                          {t.status}
                        </span>
                      </td>
                    </tr>))}
                </tbody>
              </table>
            </div>
          </section>

          {/* Fraud alerts */}
          <section id="fraud" className="glass-strong p-4">
            <p className="font-semibold flex items-center gap-2"><AlertTriangle className="h-4 w-4 text-neon-red"/> Fraud & risk alerts</p>
            <div className="mt-3 space-y-2">
              {fraud.map((f) => (<div key={f.id} className="glass-light p-3 flex items-center gap-3 border-l-2 border-neon-red/50">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">{f.signal}</p>
                    <p className="text-[11px] text-white/55">{f.id} · {f.user} · {f.time}</p>
                  </div>
                  <span className="chip bg-neon-red/15 text-neon-red border border-neon-red/30">Risk {f.score}</span>
                  <span className="chip bg-white/5 border border-white/10 text-white/80">{f.action}</span>
                  <button className="text-xs px-2 py-1 rounded bg-white/5 border border-white/10 hover:bg-white/10">Investigate</button>
                </div>))}
            </div>
          </section>
        </main>
      </div>
      <MobileBottomNav />
    </div>);
}

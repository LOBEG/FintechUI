'use client';
import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  ArrowDownLeft,
  ArrowUpRight,
  TrendingUp,
  TrendingDown,
  Wallet,
  Plus,
  Bot,
  Eye,
  Star,
  Zap,
} from 'lucide-react';
import { Sidebar } from '@/components/dashboard/Sidebar';
import { TopBar } from '@/components/dashboard/TopBar';
import { MobileBottomNav } from '@/components/layout/MobileBottomNav';
import { CandlestickChart, Sparkline, BarChart, DonutChart } from '@/components/ui/Charts';
import { ASSETS, formatUSD, formatPct } from '@/lib/utils';

const positions = [
  { sym: 'BTC/USDT', side: 'LONG', size: 0.4521, entry: 69284.12, mark: 71248.32, pnl: 887.21, roe: 2.84 },
  { sym: 'ETH/USDT', side: 'LONG', size: 4.2, entry: 3712.55, mark: 3812.07, pnl: 417.98, roe: 2.68 },
  { sym: 'SOL/USDT', side: 'SHORT', size: 28, entry: 184.5, mark: 178.42, pnl: 170.24, roe: 3.29 },
  { sym: 'XRP/USDT', side: 'LONG', size: 4200, entry: 0.6045, mark: 0.6128, pnl: 34.86, roe: 1.37 },
];

const transactions = [
  { type: 'Buy', asset: 'BTC', amount: '0.0125', value: 891.1, time: '2m ago', status: 'Filled' },
  { type: 'Deposit', asset: 'USDT', amount: '5,000.00', value: 5000, time: '1h ago', status: 'Completed' },
  { type: 'Sell', asset: 'SOL', amount: '12.4', value: 2212.4, time: '3h ago', status: 'Filled' },
  { type: 'Withdraw', asset: 'ETH', amount: '0.45', value: 1715.42, time: '1d ago', status: 'Completed' },
  { type: 'Buy', asset: 'XRP', amount: '4,200', value: 2538.24, time: '2d ago', status: 'Filled' },
];

const wallets = [
  { sym: 'BTC', name: 'Bitcoin', bal: 1.245, value: 88706.5, color: '#f7931a' },
  { sym: 'ETH', name: 'Ethereum', bal: 12.41, value: 47307.79, color: '#627eea' },
  { sym: 'SOL', name: 'Solana', bal: 84.5, value: 15076.49, color: '#14f195' },
  { sym: 'USDT', name: 'Tether', bal: 24800.0, value: 24800.0, color: '#26a17b' },
];

const totalBalance = wallets.reduce((s, w) => s + w.value, 0);
const portfolioAllocation = wallets.map((w) => ({ label: w.sym, value: Math.round((w.value / totalBalance) * 100), color: w.color }));

export default function DashboardPage() {
  const [side, setSide] = useState<'buy' | 'sell'>('buy');
  const [orderType, setOrderType] = useState<'market' | 'limit' | 'stop'>('limit');
  const [amount, setAmount] = useState('0.05');
  const [price, setPrice] = useState('71248.32');

  return (
    <div className="flex">
      <Sidebar />
      <div className="flex-1 min-w-0 pb-24 lg:pb-0">
        <TopBar title="Trading Dashboard" />
        <main className="p-4 sm:p-6 space-y-6">
          {/* Portfolio overview */}
          <section className="grid lg:grid-cols-4 gap-4">
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass-strong p-5 lg:col-span-2">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-white/60">Total Portfolio Value</p>
                  <p className="text-3xl sm:text-4xl font-display mt-1">{formatUSD(totalBalance)}</p>
                  <p className="text-sm text-neon-green mt-1">+$4,217.42 (+2.4%) today</p>
                </div>
                <div className="hidden sm:flex gap-2">
                  <button className="btn-primary text-sm"><Plus className="h-4 w-4" /> Deposit</button>
                  <button className="btn-ghost text-sm"><ArrowUpRight className="h-4 w-4" /> Withdraw</button>
                </div>
              </div>
              <div className="mt-3 h-24">
                <Sparkline width={640} height={90} seed={9} positive />
              </div>
            </motion.div>

            {[
              { label: 'Available Cash', value: '$24,800', sub: 'USDT · ready to trade', accent: 'text-neon-green' },
              { label: 'Open P&L', value: '+$1,510.29', sub: '4 open positions', accent: 'text-gold-400' },
            ].map((c) => (
              <div key={c.label} className="glass p-5">
                <p className="text-sm text-white/60">{c.label}</p>
                <p className={`text-2xl font-display mt-1 ${c.accent}`}>{c.value}</p>
                <p className="text-xs text-white/50 mt-1">{c.sub}</p>
              </div>
            ))}
          </section>

          {/* Asset cards */}
          <section id="wallet" className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {wallets.slice(0, 4).map((w, i) => (
              <motion.div
                key={w.sym}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="glass p-4"
              >
                <div className="flex items-center gap-2">
                  <span className="h-9 w-9 rounded-full inline-flex items-center justify-center text-xs font-bold text-ink-950" style={{ background: w.color }}>
                    {w.sym.slice(0, 1)}
                  </span>
                  <div>
                    <p className="text-sm font-semibold">{w.sym}</p>
                    <p className="text-[11px] text-white/50">{w.name}</p>
                  </div>
                  <Star className="h-4 w-4 ml-auto text-white/30" />
                </div>
                <p className="text-lg font-semibold mt-3">{w.bal.toLocaleString()}</p>
                <p className="text-xs text-white/50">{formatUSD(w.value)}</p>
                <div className="mt-2"><Sparkline seed={i + 2} positive={i !== 3} /></div>
              </motion.div>
            ))}
          </section>

          {/* Chart + Buy/Sell */}
          <section className="grid xl:grid-cols-3 gap-4">
            <div className="xl:col-span-2 glass-strong p-4">
              <div className="flex items-center justify-between flex-wrap gap-3 px-1">
                <div className="flex items-center gap-3">
                  <span className="h-9 w-9 rounded-md inline-flex items-center justify-center text-ink-950 text-sm font-bold" style={{ background: '#f7931a' }}>₿</span>
                  <div>
                    <p className="text-base font-semibold">BTC / USDT</p>
                    <p className="text-xs text-white/50">Bitcoin · Spot</p>
                  </div>
                  <div className="hidden sm:block pl-4">
                    <p className="text-lg font-semibold text-neon-green">$71,248.32</p>
                    <p className="text-xs text-neon-green">+2.41% (24h)</p>
                  </div>
                </div>
                <div className="flex items-center gap-1 text-xs">
                  {['1m', '5m', '15m', '1H', '4H', '1D', '1W'].map((t, i) => (
                    <button key={t} className={`px-2.5 py-1 rounded ${i === 3 ? 'bg-white/10 text-white' : 'text-white/60 hover:bg-white/5'}`}>
                      {t}
                    </button>
                  ))}
                </div>
              </div>
              <div className="mt-3 rounded-xl bg-ink-900/60 border border-white/5 p-2">
                <div className="aspect-[16/9]">
                  <CandlestickChart count={70} seed={21} base={70000} />
                </div>
              </div>
              <div className="grid grid-cols-4 gap-2 mt-3 text-xs">
                {[
                  { k: '24h High', v: '$72,415' },
                  { k: '24h Low', v: '$69,128' },
                  { k: '24h Vol (BTC)', v: '24,812' },
                  { k: '24h Vol (USD)', v: '$1.76B' },
                ].map((s) => (
                  <div key={s.k} className="glass-light p-2 text-center">
                    <p className="text-white/50">{s.k}</p>
                    <p className="font-semibold mt-0.5">{s.v}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Buy/Sell panel */}
            <div className="glass-strong p-4">
              <div className="grid grid-cols-2 rounded-xl bg-white/5 p-1">
                <button
                  onClick={() => setSide('buy')}
                  className={`py-2 rounded-lg text-sm font-medium ${side === 'buy' ? 'bg-neon-green text-ink-950' : 'text-white/70'}`}
                >
                  Buy
                </button>
                <button
                  onClick={() => setSide('sell')}
                  className={`py-2 rounded-lg text-sm font-medium ${side === 'sell' ? 'bg-neon-red text-white' : 'text-white/70'}`}
                >
                  Sell
                </button>
              </div>
              <div className="mt-3 flex gap-1 text-xs">
                {(['market', 'limit', 'stop'] as const).map((t) => (
                  <button
                    key={t}
                    onClick={() => setOrderType(t)}
                    className={`flex-1 py-1.5 rounded ${orderType === t ? 'bg-white/10 text-white' : 'text-white/55 hover:bg-white/5'}`}
                  >
                    {t.charAt(0).toUpperCase() + t.slice(1)}
                  </button>
                ))}
              </div>
              <div className="mt-4 space-y-3">
                <Field label="Price (USDT)" value={price} onChange={setPrice} disabled={orderType === 'market'} />
                <Field label="Amount (BTC)" value={amount} onChange={setAmount} />
                <div className="grid grid-cols-4 gap-1 text-[11px]">
                  {['25%', '50%', '75%', '100%'].map((p) => (
                    <button key={p} className="py-1.5 rounded bg-white/5 hover:bg-white/10 text-white/70">{p}</button>
                  ))}
                </div>
                <div className="glass-light p-3 text-xs space-y-1">
                  <Row k="Order value" v={`≈ ${formatUSD(parseFloat(amount || '0') * parseFloat(price || '0'))}`} />
                  <Row k="Fee (0.10%)" v={`≈ ${formatUSD(parseFloat(amount || '0') * parseFloat(price || '0') * 0.001)}`} />
                  <Row k="Available" v="24,800.00 USDT" />
                </div>
                <button
                  className={`btn w-full justify-center text-sm font-semibold ${
                    side === 'buy' ? 'bg-neon-green text-ink-950 hover:shadow-glow' : 'bg-neon-red text-white'
                  }`}
                >
                  {side === 'buy' ? 'Buy BTC' : 'Sell BTC'}
                </button>
              </div>
            </div>
          </section>

          {/* Watchlist + Positions */}
          <section className="grid xl:grid-cols-3 gap-4">
            <div className="glass-strong p-4 xl:col-span-1">
              <div className="flex items-center justify-between">
                <p className="font-semibold">Watchlist</p>
                <button className="text-xs text-white/55 hover:text-white">View all</button>
              </div>
              <div className="mt-3 divide-y divide-white/5">
                {ASSETS.slice(0, 7).map((a, i) => (
                  <div key={a.sym} className="flex items-center gap-3 py-2.5">
                    <span className="h-8 w-8 rounded-full inline-flex items-center justify-center text-[11px] font-bold text-ink-950" style={{ background: a.color }}>
                      {a.sym.slice(0, 1)}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">{a.sym}</p>
                      <p className="text-[11px] text-white/50 truncate">{a.name}</p>
                    </div>
                    <Sparkline seed={i + 4} positive={a.change >= 0} width={70} height={28} />
                    <div className="text-right">
                      <p className="text-sm">{formatUSD(a.price, a.price < 1 ? 4 : 2)}</p>
                      <p className={`text-[11px] ${a.change >= 0 ? 'text-neon-green' : 'text-neon-red'}`}>{formatPct(a.change)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Open positions */}
            <div className="glass-strong p-4 xl:col-span-2 overflow-hidden">
              <div className="flex items-center justify-between">
                <p className="font-semibold">Open Positions</p>
                <span className="chip bg-white/5 border border-white/10 text-white/70">{positions.length} active</span>
              </div>
              <div className="mt-3 overflow-x-auto -mx-4 px-4">
                <table className="min-w-full text-sm">
                  <thead className="text-xs text-white/50">
                    <tr className="text-left">
                      <th className="py-2 font-medium">Market</th>
                      <th className="py-2 font-medium">Side</th>
                      <th className="py-2 font-medium">Size</th>
                      <th className="py-2 font-medium">Entry</th>
                      <th className="py-2 font-medium">Mark</th>
                      <th className="py-2 font-medium">PnL</th>
                      <th className="py-2 font-medium">ROE</th>
                      <th className="py-2"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {positions.map((p) => (
                      <tr key={p.sym}>
                        <td className="py-2.5 font-medium">{p.sym}</td>
                        <td>
                          <span className={`chip ${p.side === 'LONG' ? 'bg-neon-green/15 text-neon-green' : 'bg-neon-red/15 text-neon-red'}`}>
                            {p.side === 'LONG' ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                            {p.side}
                          </span>
                        </td>
                        <td>{p.size}</td>
                        <td>{formatUSD(p.entry, p.entry < 1 ? 4 : 2)}</td>
                        <td>{formatUSD(p.mark, p.mark < 1 ? 4 : 2)}</td>
                        <td className="text-neon-green">+{formatUSD(p.pnl)}</td>
                        <td className="text-neon-green">+{p.roe}%</td>
                        <td className="text-right">
                          <button className="text-xs px-2 py-1 rounded bg-white/5 border border-white/10 hover:bg-white/10">Close</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </section>

          {/* Analytics + AI bot + History */}
          <section className="grid xl:grid-cols-3 gap-4">
            <div className="glass-strong p-5">
              <p className="font-semibold">Portfolio allocation</p>
              <div className="flex flex-col items-center mt-3">
                <DonutChart data={portfolioAllocation} size={180} />
                <div className="mt-4 grid grid-cols-2 gap-x-6 gap-y-1.5 w-full text-xs">
                  {portfolioAllocation.map((a) => (
                    <div key={a.label} className="flex items-center gap-2">
                      <span className="h-2.5 w-2.5 rounded-full" style={{ background: a.color }} />
                      {a.label}
                      <span className="ml-auto">{a.value}%</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="glass-strong p-5">
              <div className="flex items-center justify-between">
                <p className="font-semibold">P&L · last 30 days</p>
                <span className="text-xs text-neon-green">+$8,412</span>
              </div>
              <BarChart data={[12, 18, 9, 22, 14, 28, 19, 31, 24, 36, 28, 41, 33, 22, 38]} color="#00ffa3" />
              <div className="grid grid-cols-3 gap-2 mt-2 text-xs">
                <div className="glass-light p-2 text-center"><p className="text-white/50">Win rate</p><p className="font-semibold mt-1">68%</p></div>
                <div className="glass-light p-2 text-center"><p className="text-white/50">Trades</p><p className="font-semibold mt-1">142</p></div>
                <div className="glass-light p-2 text-center"><p className="text-white/50">Avg ROE</p><p className="font-semibold mt-1 text-neon-green">+2.4%</p></div>
              </div>
            </div>

            <div className="glass-strong p-5">
              <div className="flex items-center justify-between">
                <p className="font-semibold flex items-center gap-2"><Bot className="h-4 w-4 text-neon-green" /> Aurelia AI Bot</p>
                <span className="chip bg-neon-green/15 text-neon-green border border-neon-green/30">● Active</span>
              </div>
              <div className="mt-3 space-y-2">
                {['Grid · SOL/USDT', 'DCA · BTC', 'Arbitrage · ETH'].map((s, i) => (
                  <div key={s} className="glass-light p-3 flex items-center gap-3">
                    <Zap className="h-4 w-4 text-gold-400" />
                    <p className="text-sm flex-1">{s}</p>
                    <span className="text-xs text-neon-green">+{(2.4 + i * 1.7).toFixed(1)}%</span>
                  </div>
                ))}
              </div>
              <button className="btn-outline w-full mt-3 text-sm">Configure strategies</button>
            </div>
          </section>

          {/* Transaction history */}
          <section className="glass-strong p-4">
            <div className="flex items-center justify-between">
              <p className="font-semibold">Transaction history</p>
              <button className="text-xs text-white/55 hover:text-white flex items-center gap-1"><Eye className="h-3.5 w-3.5" /> View all</button>
            </div>
            <div className="mt-3 overflow-x-auto -mx-4 px-4">
              <table className="min-w-full text-sm">
                <thead className="text-xs text-white/50 text-left">
                  <tr>
                    <th className="py-2 font-medium">Type</th>
                    <th className="py-2 font-medium">Asset</th>
                    <th className="py-2 font-medium">Amount</th>
                    <th className="py-2 font-medium">Value</th>
                    <th className="py-2 font-medium">Time</th>
                    <th className="py-2 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {transactions.map((t, i) => {
                    const isIn = t.type === 'Buy' || t.type === 'Deposit';
                    return (
                      <tr key={i}>
                        <td className="py-2.5">
                          <span className={`chip ${isIn ? 'bg-neon-green/15 text-neon-green' : 'bg-neon-orange/15 text-neon-orange'}`}>
                            {isIn ? <ArrowDownLeft className="h-3 w-3" /> : <ArrowUpRight className="h-3 w-3" />}
                            {t.type}
                          </span>
                        </td>
                        <td>{t.asset}</td>
                        <td>{t.amount}</td>
                        <td>{formatUSD(t.value)}</td>
                        <td className="text-white/60">{t.time}</td>
                        <td><span className="chip bg-white/5 text-white/80 border border-white/10">{t.status}</span></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>

          {/* Mobile floating action button */}
          <button className="lg:hidden fixed bottom-24 right-5 z-30 h-14 w-14 rounded-full bg-neon-grad text-ink-950 shadow-glow inline-flex items-center justify-center" aria-label="Quick trade">
            <Wallet className="h-6 w-6" />
          </button>
        </main>
      </div>
      <MobileBottomNav />
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  disabled,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  disabled?: boolean;
}) {
  return (
    <label className="block">
      <span className="text-xs text-white/55">{label}</span>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className="mt-1 w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm outline-none focus:border-neon-green/50 disabled:opacity-50"
      />
    </label>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex justify-between text-white/65">
      <span>{k}</span>
      <span className="text-white">{v}</span>
    </div>
  );
}

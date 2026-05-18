'use client';
import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowDownLeft, ArrowUpRight, TrendingUp, TrendingDown, Wallet, Plus, Bot, Eye, Star, Zap, } from 'lucide-react';
import { Sidebar } from '@/components/dashboard/Sidebar';
import { TopBar } from '@/components/dashboard/TopBar';
import { MobileBottomNav } from '@/components/layout/MobileBottomNav';
import { CandlestickChart, Sparkline, BarChart, DonutChart } from '@/components/ui/Charts';
import { formatUSD, formatPct } from '@/lib/utils';
import { useLivePrices, useLiveKlines, SYMBOL_META, DEFAULT_TICKER_SYMBOLS } from '@/lib/useLiveData';

const WATCHLIST_SYMBOLS = ['BTCUSDT', 'ETHUSDT', 'SOLUSDT', 'XRPUSDT', 'BNBUSDT', 'ADAUSDT', 'DOGEUSDT'];
const WALLET_HOLDINGS = [
    { key: 'BTCUSDT', sym: 'BTC', name: 'Bitcoin', bal: 1.245, color: '#f7931a' },
    { key: 'ETHUSDT', sym: 'ETH', name: 'Ethereum', bal: 12.41, color: '#627eea' },
    { key: 'SOLUSDT', sym: 'SOL', name: 'Solana',   bal: 84.5,  color: '#14f195' },
    { key: null,      sym: 'USDT', name: 'Tether',   bal: 24800, color: '#26a17b' },
];
const POSITION_TEMPLATE = [
    { key: 'BTCUSDT', sym: 'BTC/USDT', side: 'LONG',  size: 0.4521, entry: 69284.12 },
    { key: 'ETHUSDT', sym: 'ETH/USDT', side: 'LONG',  size: 4.2,    entry: 3712.55 },
    { key: 'SOLUSDT', sym: 'SOL/USDT', side: 'SHORT', size: 28,     entry: 184.5 },
    { key: 'XRPUSDT', sym: 'XRP/USDT', side: 'LONG',  size: 4200,   entry: 0.6045 },
];
const transactions = [
    { type: 'Buy', asset: 'BTC', amount: '0.0125', value: 891.1, time: '2m ago', status: 'Filled' },
    { type: 'Deposit', asset: 'USDT', amount: '5,000.00', value: 5000, time: '1h ago', status: 'Completed' },
    { type: 'Sell', asset: 'SOL', amount: '12.4', value: 2212.4, time: '3h ago', status: 'Filled' },
    { type: 'Withdraw', asset: 'ETH', amount: '0.45', value: 1715.42, time: '1d ago', status: 'Completed' },
    { type: 'Buy', asset: 'XRP', amount: '4,200', value: 2538.24, time: '2d ago', status: 'Filled' },
];
const INTERVALS = ['1m', '5m', '15m', '1h', '4h', '1d', '1w'];

export default function DashboardPage() {
    const [side, setSide] = useState('buy');
    const [orderType, setOrderType] = useState('limit');
    const [amount, setAmount] = useState('0.05');
    const [interval, setInterval] = useState('5m');
    const livePrices = useLivePrices([...new Set([...WATCHLIST_SYMBOLS, 'BTCUSDT', 'ETHUSDT', 'SOLUSDT', 'XRPUSDT'])]);
    const candles = useLiveKlines('BTCUSDT', interval, 80);
    const btc = livePrices.BTCUSDT || { price: 71248.32, pct: 2.41, high: 72415, low: 69128, vol: 24812, quoteVol: 1.76e9 };
    const btcPctClass = btc.pct >= 0 ? 'text-neon-green' : 'text-neon-red';
    const [price, setPrice] = useState('');
    const effectivePrice = price || (btc.price ? btc.price.toFixed(2) : '0');

    // Live wallet valuations
    const wallets = WALLET_HOLDINGS.map((w) => {
        const px = w.key ? (livePrices[w.key]?.price ?? 0) : 1;
        return { ...w, price: px, value: w.bal * px };
    });
    const totalBalance = wallets.reduce((s, w) => s + w.value, 0);
    const portfolioAllocation = useMemo(
      () => wallets.map((w) => ({ label: w.sym, value: totalBalance ? Math.round((w.value / totalBalance) * 100) : 0, color: w.color })),
      [wallets, totalBalance],
    );

    // Live positions w/ mark + PnL
    const positions = POSITION_TEMPLATE.map((p) => {
        const mark = livePrices[p.key]?.price ?? p.entry;
        const direction = p.side === 'LONG' ? 1 : -1;
        const pnl = (mark - p.entry) * p.size * direction;
        const roe = p.entry ? ((mark - p.entry) / p.entry) * 100 * direction : 0;
        return { ...p, mark, pnl, roe };
    });
    const openPnl = positions.reduce((s, p) => s + p.pnl, 0);
    const cashUSDT = WALLET_HOLDINGS.find((w) => w.sym === 'USDT').bal;

    return (<div className="flex">
      <Sidebar />
      <div className="flex-1 min-w-0 pb-24 lg:pb-0">
        <TopBar title="Trading Dashboard"/>
        <main className="p-4 sm:p-6 space-y-6">
          {/* Portfolio overview */}
          <section className="grid lg:grid-cols-4 gap-4">
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass-strong p-5 lg:col-span-2">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-white/60 flex items-center gap-2">
                    Total Portfolio Value
                    <span className="inline-flex items-center gap-1 text-[10px] uppercase tracking-wider text-neon-green">
                      <span className="h-1.5 w-1.5 rounded-full bg-neon-green animate-pulse"/> live
                    </span>
                  </p>
                  <p className="text-3xl sm:text-4xl font-display mt-1">{formatUSD(totalBalance)}</p>
                  <p className={`text-sm mt-1 ${openPnl >= 0 ? 'text-neon-green' : 'text-neon-red'}`}>
                    {openPnl >= 0 ? '+' : ''}{formatUSD(openPnl)} unrealised P&L
                  </p>
                </div>
                <div className="hidden sm:flex gap-2">
                  <button className="btn-primary text-sm"><Plus className="h-4 w-4"/> Deposit</button>
                  <button className="btn-ghost text-sm"><ArrowUpRight className="h-4 w-4"/> Withdraw</button>
                </div>
              </div>
              <div className="mt-3 h-24">
                <Sparkline width={640} height={90} seed={9} positive={openPnl >= 0}/>
              </div>
            </motion.div>

            <div className="glass p-5">
              <p className="text-sm text-white/60">Available Cash</p>
              <p className="text-2xl font-display mt-1 text-neon-green">{formatUSD(cashUSDT)}</p>
              <p className="text-xs text-white/50 mt-1">USDT · ready to trade</p>
            </div>
            <div className="glass p-5">
              <p className="text-sm text-white/60">Open P&L</p>
              <p className={`text-2xl font-display mt-1 ${openPnl >= 0 ? 'text-gold-400' : 'text-neon-red'}`}>{openPnl >= 0 ? '+' : ''}{formatUSD(openPnl)}</p>
              <p className="text-xs text-white/50 mt-1">{positions.length} open positions</p>
            </div>
          </section>

          {/* Asset cards */}
          <section id="wallet" className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {wallets.slice(0, 4).map((w, i) => (<motion.div key={w.sym} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="glass p-4">
                <div className="flex items-center gap-2">
                  <span className="h-9 w-9 rounded-full inline-flex items-center justify-center text-xs font-bold text-ink-950" style={{ background: w.color }}>
                    {w.sym.slice(0, 1)}
                  </span>
                  <div>
                    <p className="text-sm font-semibold">{w.sym}</p>
                    <p className="text-[11px] text-white/50">{w.name}</p>
                  </div>
                  <Star className="h-4 w-4 ml-auto text-white/30"/>
                </div>
                <p className="text-lg font-semibold mt-3">{w.bal.toLocaleString()}</p>
                <p className="text-xs text-white/50">{formatUSD(w.value)}</p>
                <div className="mt-2"><Sparkline seed={i + 2} positive={w.key ? (livePrices[w.key]?.pct ?? 0) >= 0 : true}/></div>
              </motion.div>))}
          </section>

          {/* Chart + Buy/Sell */}
          <section className="grid xl:grid-cols-3 gap-4">
            <div className="xl:col-span-2 glass-strong p-4">
              <div className="flex items-center justify-between flex-wrap gap-3 px-1">
                <div className="flex items-center gap-3">
                  <span className="h-9 w-9 rounded-md inline-flex items-center justify-center text-ink-950 text-sm font-bold" style={{ background: '#f7931a' }}>₿</span>
                  <div>
                    <p className="text-base font-semibold">BTC / USDT</p>
                    <p className="text-xs text-white/50">Bitcoin · Spot · Binance</p>
                  </div>
                  <div className="hidden sm:block pl-4">
                    <p className={`text-lg font-semibold ${btcPctClass}`}>{formatUSD(btc.price)}</p>
                    <p className={`text-xs ${btcPctClass}`}>{formatPct(btc.pct)} (24h)</p>
                  </div>
                </div>
                <div className="flex items-center gap-1 text-xs">
                  {INTERVALS.map((t) => (<button key={t} onClick={() => setInterval(t)} className={`px-2.5 py-1 rounded ${interval === t ? 'bg-white/10 text-white' : 'text-white/60 hover:bg-white/5'}`}>
                      {t}
                    </button>))}
                </div>
              </div>
              <div className="mt-3 rounded-xl bg-ink-900/60 border border-white/5 p-2">
                <div className="aspect-[16/9]">
                  <CandlestickChart data={candles} animate={false}/>
                </div>
              </div>
              <div className="grid grid-cols-4 gap-2 mt-3 text-xs">
                <div className="glass-light p-2 text-center"><p className="text-white/50">24h High</p><p className="font-semibold mt-0.5">{btc.high ? formatUSD(btc.high) : '—'}</p></div>
                <div className="glass-light p-2 text-center"><p className="text-white/50">24h Low</p><p className="font-semibold mt-0.5">{btc.low ? formatUSD(btc.low) : '—'}</p></div>
                <div className="glass-light p-2 text-center"><p className="text-white/50">24h Vol (BTC)</p><p className="font-semibold mt-0.5">{btc.vol ? btc.vol.toLocaleString(undefined, { maximumFractionDigits: 0 }) : '—'}</p></div>
                <div className="glass-light p-2 text-center"><p className="text-white/50">24h Vol (USD)</p><p className="font-semibold mt-0.5">{btc.quoteVol ? `$${(btc.quoteVol / 1e9).toFixed(2)}B` : '—'}</p></div>
              </div>
            </div>

            {/* Buy/Sell panel */}
            <div className="glass-strong p-4">
              <div className="grid grid-cols-2 rounded-xl bg-white/5 p-1">
                <button onClick={() => setSide('buy')} className={`py-2 rounded-lg text-sm font-medium ${side === 'buy' ? 'bg-neon-green text-ink-950' : 'text-white/70'}`}>
                  Buy
                </button>
                <button onClick={() => setSide('sell')} className={`py-2 rounded-lg text-sm font-medium ${side === 'sell' ? 'bg-neon-red text-white' : 'text-white/70'}`}>
                  Sell
                </button>
              </div>
              <div className="mt-3 flex gap-1 text-xs">
                {['market', 'limit', 'stop'].map((t) => (<button key={t} onClick={() => setOrderType(t)} className={`flex-1 py-1.5 rounded ${orderType === t ? 'bg-white/10 text-white' : 'text-white/55 hover:bg-white/5'}`}>
                    {t.charAt(0).toUpperCase() + t.slice(1)}
                  </button>))}
              </div>
              <div className="mt-4 space-y-3">
                <Field label="Price (USDT)" value={effectivePrice} onChange={setPrice} disabled={orderType === 'market'}/>
                <Field label="Amount (BTC)" value={amount} onChange={setAmount}/>
                <div className="grid grid-cols-4 gap-1 text-[11px]">
                  {['25%', '50%', '75%', '100%'].map((p) => (<button key={p} className="py-1.5 rounded bg-white/5 hover:bg-white/10 text-white/70">{p}</button>))}
                </div>
                <div className="glass-light p-3 text-xs space-y-1">
                  <Row k="Order value" v={`≈ ${formatUSD(parseFloat(amount || '0') * parseFloat(effectivePrice || '0'))}`}/>
                  <Row k="Fee (0.10%)" v={`≈ ${formatUSD(parseFloat(amount || '0') * parseFloat(effectivePrice || '0') * 0.001)}`}/>
                  <Row k="Available" v={`${cashUSDT.toLocaleString()} USDT`}/>
                </div>
                <button className={`btn w-full justify-center text-sm font-semibold ${side === 'buy' ? 'bg-neon-green text-ink-950 hover:shadow-glow' : 'bg-neon-red text-white'}`}>
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
                {WATCHLIST_SYMBOLS.map((s, i) => {
                  const meta = SYMBOL_META[s];
                  const d = livePrices[s];
                  if (!meta) return null;
                  const px = d?.price ?? 0;
                  const pct = d?.pct ?? 0;
                  return (<div key={s} className="flex items-center gap-3 py-2.5">
                      <span className="h-8 w-8 rounded-full inline-flex items-center justify-center text-[11px] font-bold text-ink-950" style={{ background: meta.color }}>
                        {meta.sym.slice(0, 1)}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium">{meta.sym}</p>
                        <p className="text-[11px] text-white/50 truncate">{meta.name}</p>
                      </div>
                      <Sparkline seed={i + 4} positive={pct >= 0} width={70} height={28}/>
                      <div className="text-right">
                        <p className="text-sm">{formatUSD(px, px < 1 ? 4 : 2)}</p>
                        <p className={`text-[11px] ${pct >= 0 ? 'text-neon-green' : 'text-neon-red'}`}>{formatPct(pct)}</p>
                      </div>
                    </div>);
                })}
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
                    {positions.map((p) => {
                      const pos = p.pnl >= 0;
                      return (<tr key={p.sym}>
                        <td className="py-2.5 font-medium">{p.sym}</td>
                        <td>
                          <span className={`chip ${p.side === 'LONG' ? 'bg-neon-green/15 text-neon-green' : 'bg-neon-red/15 text-neon-red'}`}>
                            {p.side === 'LONG' ? <TrendingUp className="h-3 w-3"/> : <TrendingDown className="h-3 w-3"/>}
                            {p.side}
                          </span>
                        </td>
                        <td>{p.size}</td>
                        <td>{formatUSD(p.entry, p.entry < 1 ? 4 : 2)}</td>
                        <td>{formatUSD(p.mark, p.mark < 1 ? 4 : 2)}</td>
                        <td className={pos ? 'text-neon-green' : 'text-neon-red'}>{pos ? '+' : ''}{formatUSD(p.pnl)}</td>
                        <td className={pos ? 'text-neon-green' : 'text-neon-red'}>{pos ? '+' : ''}{p.roe.toFixed(2)}%</td>
                        <td className="text-right">
                          <button className="text-xs px-2 py-1 rounded bg-white/5 border border-white/10 hover:bg-white/10">Close</button>
                        </td>
                      </tr>);
                    })}
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
                <DonutChart data={portfolioAllocation} size={180}/>
                <div className="mt-4 grid grid-cols-2 gap-x-6 gap-y-1.5 w-full text-xs">
                  {portfolioAllocation.map((a) => (<div key={a.label} className="flex items-center gap-2">
                      <span className="h-2.5 w-2.5 rounded-full" style={{ background: a.color }}/>
                      {a.label}
                      <span className="ml-auto">{a.value}%</span>
                    </div>))}
                </div>
              </div>
            </div>

            <div className="glass-strong p-5">
              <div className="flex items-center justify-between">
                <p className="font-semibold">P&L · last 30 days</p>
                <span className={`text-xs ${openPnl >= 0 ? 'text-neon-green' : 'text-neon-red'}`}>{openPnl >= 0 ? '+' : ''}{formatUSD(openPnl + 6900)}</span>
              </div>
              <BarChart data={[12, 18, 9, 22, 14, 28, 19, 31, 24, 36, 28, 41, 33, 22, 38]} color="#00ffa3"/>
              <div className="grid grid-cols-3 gap-2 mt-2 text-xs">
                <div className="glass-light p-2 text-center"><p className="text-white/50">Win rate</p><p className="font-semibold mt-1">68%</p></div>
                <div className="glass-light p-2 text-center"><p className="text-white/50">Trades</p><p className="font-semibold mt-1">142</p></div>
                <div className="glass-light p-2 text-center"><p className="text-white/50">Avg ROE</p><p className="font-semibold mt-1 text-neon-green">+2.4%</p></div>
              </div>
            </div>

            <div className="glass-strong p-5">
              <div className="flex items-center justify-between">
                <p className="font-semibold flex items-center gap-2"><Bot className="h-4 w-4 text-neon-green"/> Aurelia AI Bot</p>
                <span className="chip bg-neon-green/15 text-neon-green border border-neon-green/30">● Active</span>
              </div>
              <div className="mt-3 space-y-2">
                {['Grid · SOL/USDT', 'DCA · BTC', 'Arbitrage · ETH'].map((s, i) => (<div key={s} className="glass-light p-3 flex items-center gap-3">
                    <Zap className="h-4 w-4 text-gold-400"/>
                    <p className="text-sm flex-1">{s}</p>
                    <span className="text-xs text-neon-green">+{(2.4 + i * 1.7).toFixed(1)}%</span>
                  </div>))}
              </div>
              <button className="btn-outline w-full mt-3 text-sm">Configure strategies</button>
            </div>
          </section>

          {/* Transaction history */}
          <section className="glass-strong p-4">
            <div className="flex items-center justify-between">
              <p className="font-semibold">Transaction history</p>
              <button className="text-xs text-white/55 hover:text-white flex items-center gap-1"><Eye className="h-3.5 w-3.5"/> View all</button>
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
            return (<tr key={i}>
                        <td className="py-2.5">
                          <span className={`chip ${isIn ? 'bg-neon-green/15 text-neon-green' : 'bg-neon-orange/15 text-neon-orange'}`}>
                            {isIn ? <ArrowDownLeft className="h-3 w-3"/> : <ArrowUpRight className="h-3 w-3"/>}
                            {t.type}
                          </span>
                        </td>
                        <td>{t.asset}</td>
                        <td>{t.amount}</td>
                        <td>{formatUSD(t.value)}</td>
                        <td className="text-white/60">{t.time}</td>
                        <td><span className="chip bg-white/5 text-white/80 border border-white/10">{t.status}</span></td>
                      </tr>);
        })}
                </tbody>
              </table>
            </div>
          </section>

          {/* Mobile floating action button */}
          <button className="lg:hidden fixed bottom-24 right-5 z-30 h-14 w-14 rounded-full bg-neon-grad text-ink-950 shadow-glow inline-flex items-center justify-center" aria-label="Quick trade">
            <Wallet className="h-6 w-6"/>
          </button>
        </main>
      </div>
      <MobileBottomNav />
    </div>);
}
function Field({ label, value, onChange, disabled, }) {
    return (<label className="block">
      <span className="text-xs text-white/55">{label}</span>
      <input value={value} onChange={(e) => onChange(e.target.value)} disabled={disabled} className="mt-1 w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm outline-none focus:border-neon-green/50 disabled:opacity-50"/>
    </label>);
}
function Row({ k, v }) {
    return (<div className="flex justify-between text-white/65">
      <span>{k}</span>
      <span className="text-white">{v}</span>
    </div>);
}

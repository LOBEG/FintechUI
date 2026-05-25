'use client';
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Bot, Zap, Activity, TrendingUp, TrendingDown, ArrowRight, Sparkles, ShieldCheck, Loader2 } from 'lucide-react';
import { useLivePrices, useLiveKlines } from '@/lib/useLiveData';
import { useSession } from '@/lib/useSession';
import { formatUSD, formatPct } from '@/lib/utils';
import { buildMarketSignal, candleCloseSeries } from '@/lib/marketSignals';

const UNIVERSE = [
  'BTCUSDT', 'ETHUSDT', 'SOLUSDT', 'BNBUSDT', 'XRPUSDT',
  'ADAUSDT', 'AVAXUSDT', 'LINKUSDT', 'DOGEUSDT', 'DOTUSDT',
];

function SignalRow({ symbol }) {
  const candles = useLiveKlines(symbol, '15m', 96);
  const closes = useMemo(() => candleCloseSeries(candles), [candles]);
  const sig = useMemo(() => buildMarketSignal(candles), [candles]);
  const { rsiVal, fast, slow, last, pct24 } = sig;
  const liveCandle = candles[candles.length - 1];
  const live = !!liveCandle?.live;
  const base = symbol.replace(/USDT$/, '');
  const tone = sig.tone === 'buy' ? 'text-accent-success' : sig.tone === 'sell' ? 'text-accent-error' : 'text-white/70';
  const chipBg = sig.tone === 'buy' ? 'bg-accent-success/15 border-accent-success/30 text-accent-success'
    : sig.tone === 'sell' ? 'bg-accent-error/15 border-accent-error/30 text-accent-error'
    : 'bg-white/5 border-white/10 text-white/70';
  // Tiny sparkline of the last 30 closes.
  const tail = closes.slice(-30);
  let path = '';
  if (tail.length > 1) {
    const min = Math.min(...tail), max = Math.max(...tail);
    const span = max - min || 1;
    const step = 110 / (tail.length - 1);
    path = tail.map((v, i) => `${i === 0 ? 'M' : 'L'}${(i * step).toFixed(1)},${(30 - ((v - min) / span) * 30).toFixed(1)}`).join(' ');
  }
  return (
    <tr className="border-t border-white/5">
      <td className="py-2 pr-3">
        <div className="flex items-center gap-2">
          <span className="font-semibold">{base}</span>
          <span className={`inline-flex items-center gap-1 text-[10px] ${live ? 'text-accent-success' : 'text-white/40'}`}>
            <span className={`h-1.5 w-1.5 rounded-full ${live ? 'bg-accent-success animate-pulse' : 'bg-white/30'}`}/>
            {live ? 'live' : 'sync'}
          </span>
        </div>
      </td>
      <td className="py-2 pr-3 font-mono">{last ? formatUSD(last) : '-'}</td>
      <td className={`py-2 pr-3 font-mono ${pct24 >= 0 ? 'text-accent-success' : 'text-accent-error'}`}>{last ? formatPct(pct24) : '-'}</td>
      <td className="py-2 pr-3 font-mono">{rsiVal != null ? rsiVal.toFixed(1) : '-'}</td>
      <td className={`py-2 pr-3 font-mono ${fast != null && slow != null ? (fast > slow ? 'text-accent-success' : 'text-accent-error') : 'text-white/45'}`}>
        {fast != null && slow != null ? (fast > slow ? 'Up' : 'Down') : '-'}
      </td>
      <td className="py-2 pr-3 hidden md:table-cell">
        {path ? (
          <svg width="110" height="30" viewBox="0 0 110 30" className="opacity-90">
            <path d={path} fill="none" stroke={pct24 >= 0 ? '#22c55e' : '#ef4444'} strokeWidth="1.6" strokeLinejoin="round" strokeLinecap="round"/>
          </svg>
        ) : null}
      </td>
      <td className="py-2 pr-1">
        <span className={`chip border text-[11px] ${chipBg}`}>{sig.label}</span>
      </td>
    </tr>
  );
}

export default function AITradingBotClient() {
  const { user, loading } = useSession();
  const prices = useLivePrices(UNIVERSE);
  const [now, setNow] = useState(() => new Date());
  useEffect(() => { const id = setInterval(() => setNow(new Date()), 15000); return () => clearInterval(id); }, []);

  // Aggregate sentiment: count up vs down across the universe.
  let up = 0, down = 0, total = 0;
  for (const s of UNIVERSE) {
    const p = prices[s];
    if (!p || !isFinite(p.pct)) continue;
    total++;
    if (p.pct >= 0) up++; else down++;
  }
  const breadthPct = total ? (up / total) * 100 : 0;
  const bias = breadthPct >= 60 ? { label: 'Risk-On', tone: 'text-accent-success' }
    : breadthPct <= 40 ? { label: 'Risk-Off', tone: 'text-accent-error' }
    : { label: 'Mixed', tone: 'text-slate-400' };

  return (
    <>
      <motion.section initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
        <span className="chip bg-white/5 border border-white/10 text-white/80">
          <Sparkles className="h-3.5 w-3.5 text-accent-success"/> Oakmont Intelligence · Oakmont Digital Markets Groups
        </span>
        <h1 className="mt-4 text-3xl sm:text-4xl lg:text-5xl font-display leading-tight">
          <span className="text-gradient-primary">Real-time market signals</span>
          <br/>across global crypto markets.
        </h1>
        <p className="mt-4 text-white/70 max-w-2xl text-base">
          Live RSI, momentum, trend bias and 24-hour breadth, recomputed every 15 seconds from primary exchange feeds. Use the signals to inform your manual orders or to configure automated DCA / grid strategies inside your trading dashboard.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          {loading ? (
            <span className="btn-ghost opacity-70"><Loader2 className="h-4 w-4 animate-spin"/> Checking session</span>
          ) : user ? (
             <Link href="/dashboard/analytics#live-signals" className="btn-primary">Open Bot in Dashboard <ArrowRight className="h-4 w-4"/></Link>
          ) : (
            <>
              <Link href="/signup" className="btn-primary">Activate Markets Intelligence <ArrowRight className="h-4 w-4"/></Link>
              <Link href="/login?next=/ai-trading-bot" className="btn-ghost">Sign in</Link>
            </>
          )}
        </div>
      </motion.section>

      <section className="mt-10 grid sm:grid-cols-3 gap-3">
        <div className="glass-strong p-4">
          <div className="flex items-center gap-2 text-white/60 text-xs"><Activity className="h-4 w-4 text-accent-success"/> Market breadth (24h)</div>
          <p className={`mt-2 text-2xl font-mono ${bias.tone}`}>{bias.label}</p>
          <p className="text-xs text-white/55 mt-1">{up} of {total} tracked pairs are up. Breadth {breadthPct.toFixed(0)}%.</p>
        </div>
        <div className="glass-strong p-4">
          <div className="flex items-center gap-2 text-white/60 text-xs"><TrendingUp className="h-4 w-4 text-slate-400"/> Top mover</div>
          {(() => {
            const ranked = UNIVERSE.map((s) => ({ s, p: prices[s] })).filter((x) => x.p && isFinite(x.p.pct)).sort((a, b) => b.p.pct - a.p.pct);
            const m = ranked[0];
            if (!m) return <p className="mt-2 text-white/45 text-sm">Connecting…</p>;
            return (
              <>
                <p className="mt-2 text-2xl font-mono text-accent-success">{m.s.replace(/USDT$/, '')}</p>
                <p className="text-xs text-accent-success mt-1">{formatPct(m.p.pct)} · {formatUSD(m.p.price)}</p>
              </>
            );
          })()}
        </div>
        <div className="glass-strong p-4">
          <div className="flex items-center gap-2 text-white/60 text-xs"><TrendingDown className="h-4 w-4 text-accent-error"/> Worst performer</div>
          {(() => {
            const ranked = UNIVERSE.map((s) => ({ s, p: prices[s] })).filter((x) => x.p && isFinite(x.p.pct)).sort((a, b) => a.p.pct - b.p.pct);
            const m = ranked[0];
            if (!m) return <p className="mt-2 text-white/45 text-sm">Connecting…</p>;
            return (
              <>
                <p className="mt-2 text-2xl font-mono text-accent-error">{m.s.replace(/USDT$/, '')}</p>
                <p className="text-xs text-accent-error mt-1">{formatPct(m.p.pct)} · {formatUSD(m.p.price)}</p>
              </>
            );
          })()}
        </div>
      </section>

      <section className="mt-8 glass-strong p-5">
        <div className="flex items-center gap-2 mb-3">
          <Bot className="h-4 w-4 text-accent-success"/>
          <h2 className="font-display text-lg">Live signal table</h2>
          <span className="chip bg-accent-success/15 text-accent-success border border-accent-success/30 text-[10px]">● real-time</span>
          <span className="ml-auto text-[11px] text-white/50">Updated {now.toLocaleTimeString()}</span>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="text-white/55 text-xs uppercase tracking-wider">
              <tr>
                <th className="text-left py-2 pr-3">Pair</th>
                <th className="text-left py-2 pr-3">Last</th>
                <th className="text-left py-2 pr-3">24h</th>
                <th className="text-left py-2 pr-3">RSI(14)</th>
                <th className="text-left py-2 pr-3">Trend</th>
                <th className="text-left py-2 pr-3 hidden md:table-cell">24h chart</th>
                <th className="text-left py-2 pr-1">Signal</th>
              </tr>
            </thead>
            <tbody>
              {UNIVERSE.map((s) => <SignalRow key={s} symbol={s}/>)}
            </tbody>
          </table>
        </div>
        <p className="text-[11px] text-white/45 mt-3">
          Signals are computed from public Binance candles (15-minute resolution, 96-bar window). RSI &lt; 30 with rising 12/26 SMAs flags a Strong Buy; RSI &gt; 70 with falling SMAs flags Take Profit. Educational tool only. Oakmont Digital Markets Groups does not guarantee any returns and all trading carries risk of loss.
        </p>
      </section>

      <section className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { icon: Bot,        title: 'Smart Grid',          desc: 'Place buy and sell orders at preset intervals to harvest range-bound volatility. Configure grid spacing per pair.' },
          { icon: Zap,        title: 'Momentum',            desc: 'Detects breakout patterns using RSI, volume and 12/26 SMA crossovers. Allocates capital dynamically based on risk.' },
          { icon: Activity,   title: 'DCA Strategy',        desc: 'Dollar-cost averaging with intelligent timing. Scale in during dips, scale out near resistance, on a fixed schedule.' },
          { icon: ShieldCheck,title: 'Risk Controls',       desc: 'Per-strategy max drawdown, position sizing and stop-loss bands enforced on every order before it routes.' },
        ].map((c) => {
          const Icon = c.icon;
          return (
            <div key={c.title} className="glass-strong p-5">
              <Icon className="h-7 w-7 text-slate-400 mb-3"/>
              <h3 className="font-semibold">{c.title}</h3>
              <p className="text-xs text-white/60 mt-2">{c.desc}</p>
            </div>
          );
        })}
      </section>
    </>
  );
}

'use client';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Briefcase, Network, Building2, Globe, Loader2, CheckCircle2, ArrowDownLeft, ArrowUpRight, Activity, TrendingUp } from 'lucide-react';
import { api, useSession } from '@/lib/useSession';

const BROKERS = [
  {
    id: 'prime',
    name: 'Oakmont Prime',
    description: 'Internal prime brokerage desk with cross-margined inventory.',
    classes: ['stocks', 'etfs', 'indices'],
    source: 'Oakmont Prime book',
    icon: Building2,
  },
  {
    id: 'crypto',
    name: 'Oakmont Digital Markets Groups Crypto Desk (Binance)',
    description: 'Spot crypto liquidity routed through Binance.',
    classes: ['crypto'],
    source: 'Binance public API',
    icon: Network,
  },
  {
    id: 'multiAsset',
    name: 'Oakmont Multi-Asset Desk (Yahoo Finance)',
    description: 'Equities, ETFs, indices, forex, commodities and futures.',
    classes: ['stocks', 'etfs', 'indices', 'forex', 'commodities', 'futures'],
    source: 'Yahoo Finance v8',
    icon: Globe,
  },
];

export default function BrokerageHubPanel({ onInvest, onWithdraw }) {
  const { user } = useSession();
  const [settings, setSettings] = useState(null);
  const [preferred, setPreferred] = useState('prime');
  const [positions, setPositions] = useState([]);
  const [universe, setUniverse] = useState({});
  const [optionsUnderliers, setOptionsUnderliers] = useState([]);
  const [quotes, setQuotes] = useState([]);
  const [cryptoMarkets, setCryptoMarkets] = useState([]);
  const [savingBroker, setSavingBroker] = useState(false);
  const [loadError, setLoadError] = useState(null);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    let ctrl = null;
    const load = async () => {
      ctrl?.abort();
      const requestCtrl = new AbortController();
      ctrl = requestCtrl;
      try {
        const [s, b, p, u, q, m] = await Promise.all([
          api.get('/api/brokerage/settings', { signal: requestCtrl.signal }).catch(() => null),
          api.get('/api/user/preferred-broker', { signal: requestCtrl.signal }).catch(() => null),
          api.get('/api/brokerage/positions', { signal: requestCtrl.signal }).catch(() => null),
          fetch('/api/brokerage/universe', { cache: 'no-store', signal: requestCtrl.signal }).then((r) => r.ok ? r.json() : null).catch(() => null),
          fetch('/api/brokerage/quotes', { cache: 'no-store', signal: requestCtrl.signal }).then((r) => r.ok ? r.json() : null).catch(() => null),
          fetch('/api/markets', { cache: 'no-store', signal: requestCtrl.signal }).then((r) => r.ok ? r.json() : null).catch(() => null),
        ]);
        if (cancelled || requestCtrl.signal.aborted) return;
        if (!s && !b && !p && !u && !q && !m) {
          setLoadError('Brokerage feeds are temporarily unavailable.');
          return;
        }
        setLoadError(null);
        if (s?.settings) setSettings(s.settings);
        if (b?.preferredBroker) setPreferred(b.preferredBroker);
        if (Array.isArray(p?.positions)) setPositions(p.positions);
        if (u?.universe) setUniverse(u.universe);
        if (Array.isArray(u?.optionsUnderliers)) setOptionsUnderliers(u.optionsUnderliers);
        if (Array.isArray(q?.quotes)) setQuotes(q.quotes);
        if (Array.isArray(m?.markets)) setCryptoMarkets(m.markets);
      } catch (_) {
        if (!cancelled) setLoadError('Brokerage feeds are temporarily unavailable.');
      }
    };
    load();
    const id = setInterval(load, 15_000);
    return () => { cancelled = true; ctrl?.abort(); clearInterval(id); };
  }, [user]);

  const quoteBySymbol = useMemo(() => new Map(quotes.map((q) => [q.symbol, q])), [quotes]);
  const cryptoMarketBySymbol = useMemo(() => new Map(cryptoMarkets.map((m) => [m.symbol, m])), [cryptoMarkets]);
  const integrations = useMemo(() => settings?.integrations || {}, [settings]);
  const enabledBrokers = useMemo(() => BROKERS.filter((b) => integrations[b.id]), [integrations]);
  const enabledClasses = useMemo(() => [
    ...Object.keys(universe).filter((c) => settings?.classes?.[c] !== false),
    ...(integrations.crypto ? ['crypto'] : []),
    ...(settings?.classes?.options !== false && optionsUnderliers.length ? ['options'] : []),
  ], [integrations.crypto, optionsUnderliers.length, settings?.classes, universe]);
  const signalRows = useMemo(() => quotes
    .filter((q) => q.signal && q.price)
    .map((q) => ({ ...q, kind: q.assetClass || 'brokerage' })), [quotes]);
  const cryptoRows = useMemo(() => cryptoMarkets
    .filter((m) => Number(m.price) > 0)
    .map((m) => ({ ...m, kind: 'crypto', signal: m.signal || (Number(m.pct) >= 1 ? 'Accumulate' : Number(m.pct) <= -1 ? 'Reduce' : 'Hold / observe') })), [cryptoMarkets]);
  const selectBroker = useCallback(async (id) => {
    setSavingBroker(true);
    try {
      const r = await api.patch('/api/user/preferred-broker', { broker: id });
      if (r?.preferredBroker) setPreferred(r.preferredBroker);
    } catch (_) {} finally { setSavingBroker(false); }
  }, []);

  if (!user) return null;
  if (!settings) return null;
  const anyEnabled = !!(integrations.prime || integrations.crypto || integrations.multiAsset);
  if (!anyEnabled) return null;

  const updatedLabel = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  return (
    <motion.section
      initial={{ opacity: 0, y: 8 }} 
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="glass-strong p-6 space-y-5 relative overflow-hidden"
    >
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-slate-500/15 via-accent-success/10 to-slate-500/15" />
      {loadError && (
        <div className="rounded-xl border border-amber-500/25 bg-amber-500/10 px-3 py-2 text-xs text-amber-200">
          {loadError} Showing the last available brokerage state while Oakmont reconnects.
        </div>
      )}
      
      <div className="flex items-center flex-wrap gap-3">
        <div className="flex items-center gap-3 flex-1">
          <Briefcase className="h-5 w-5 text-slate-400"/>
          <h3 className="font-display text-xl tracking-tight">Brokerage hub</h3>
          <motion.span 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 }}
            className="chip bg-accent-success/15 text-accent-success border border-accent-success/30 text-[11px] font-medium"
          >
            ● live
          </motion.span>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => onInvest && onInvest('AAPL', 'stocks')} className="btn-ghost text-xs">
            <ArrowDownLeft className="h-3.5 w-3.5"/> Invest
          </button>
          <button onClick={() => onWithdraw && onWithdraw()} className="btn-ghost text-xs">
            <ArrowUpRight className="h-3.5 w-3.5"/> Withdraw
          </button>
          <a href="#wallet" className="btn-ghost text-xs">Deposit</a>
        </div>
      </div>

      <motion.div 
        className="grid sm:grid-cols-3 gap-4"
        initial="hidden"
        animate="visible"
        variants={{
          hidden: {},
          visible: {
            transition: {
              staggerChildren: 0.08
            }
          }
        }}
      >
        {enabledBrokers.map((b) => {
          const Icon = b.icon;
          return (
            <motion.div 
              key={b.id} 
              variants={{
                hidden: { opacity: 0, y: 8 },
                visible: { opacity: 1, y: 0 }
              }}
              className="glass-light p-4 flex flex-col gap-3 hover:bg-white/[0.02] transition-all duration-300 group"
            >
              <div className="flex items-center gap-3">
                <span className="h-10 w-10 rounded-xl bg-white/5 border border-white/10 inline-flex items-center justify-center group-hover:bg-white/10 transition-colors duration-300">
                   <Icon className="h-5 w-5 text-slate-400 group-hover:scale-110 transition-transform duration-300"/>
                </span>
                <span className="font-semibold text-sm flex-1">{b.name}</span>
                <span className="chip bg-accent-success/15 text-accent-success border border-accent-success/30 text-[10px] font-medium">● live</span>
              </div>
              <p className="text-[11px] text-white/50 leading-relaxed">{b.description}</p>
              <div className="flex flex-wrap gap-1.5">
                {b.classes.filter((c) => settings.classes?.[c] !== false).map((c) => (
                  <span key={c} className="chip bg-white/5 border border-white/10 text-white/65 text-[10px] font-medium">{c} · live</span>
                ))}
              </div>
              <div className="flex items-center gap-2 text-[10px] text-white/40 mt-auto pt-2 border-t border-white/5">
                <span>{b.source}</span>
                <span className="ml-auto font-mono">{updatedLabel}</span>
              </div>
            </motion.div>
          );
        })}
      </motion.div>

      <motion.div 
        className="grid lg:grid-cols-2 gap-4"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <div className="glass-light p-4">
          <div className="flex items-center gap-3 mb-3">
            <Activity className="h-4 w-4 text-slate-400"/>
            <p className="text-sm font-semibold">Live asset-class coverage</p>
            <span className="ml-auto text-[10px] text-white/40 font-mono">{quotes.length} live quotes</span>
          </div>
          <div className="space-y-2.5">
            {enabledClasses.map((cls) => {
              const rows = cls === 'crypto'
                ? cryptoMarkets.map((row) => ({ symbol: row.symbol, name: row.name, signal: row.signal }))
                : cls === 'options'
                  ? optionsUnderliers
                  : (universe[cls] || []);
              const liveCount = cls === 'crypto'
                ? rows.filter((row) => Number(cryptoMarkets.find((m) => m.symbol === row.symbol)?.price) > 0).length
                : cls === 'options'
                  ? rows.length
                  : rows.filter((row) => quoteBySymbol.has(row.symbol)).length;
              return (
                <div key={cls} className="rounded-xl border border-white/10 bg-white/[0.03] p-3 hover:bg-white/[0.04] transition-colors duration-200">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xs font-semibold capitalize tracking-wide">{cls}</span>
                    <span className="text-[10px] text-accent-success font-medium">{liveCount} live</span>
                    <span className="ml-auto text-[10px] text-white/40 font-mono">{rows.length} symbols</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {rows.slice(0, 8).map((row) => {
                      const liveQuote = quoteBySymbol.get(row.symbol);
                      const cryptoQuote = cls === 'crypto' ? cryptoMarketBySymbol.get(row.symbol) : null;
                      const signal = liveQuote?.signal || cryptoQuote?.signal;
                      return (
                        <span key={row.symbol} className="chip bg-white/5 border border-white/10 text-white/65 text-[10px] font-medium">
                          {row.symbol}{signal ? ` · ${signal}` : ''}
                        </span>
                      );
                    })}
                    {rows.length > 8 && (
                      <span className="chip bg-white/5 border border-white/10 text-white/40 text-[10px]">+{rows.length - 8} more</span>
                    )}
                    {!rows.length && (
                      <span className="text-[10px] text-white/40">Awaiting live symbols.</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        
        <div className="glass-light p-4">
          <div className="flex items-center gap-3 mb-3">
            <TrendingUp className="h-4 w-4 text-accent-success"/>
            <p className="text-sm font-semibold">Visible live market signals</p>
            <span className="ml-auto text-[10px] text-white/40 font-mono">{updatedLabel}</span>
          </div>
          <div className="divide-y divide-white/5 max-h-[400px] overflow-y-auto -mx-4 px-4">
            {signalRows.map((q, idx) => (
              <motion.div 
                key={q.symbol} 
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.03 }}
                className="py-2.5 flex items-center gap-3 text-xs hover:bg-white/[0.02] -mx-4 px-4 transition-colors duration-200"
              >
                <span className="font-semibold font-mono w-20">{q.symbol}</span>
                <span className="text-white/50 flex-1 truncate">{q.name || q.assetClass}</span>
                <span className={`font-mono font-medium ${Number(q.pct) >= 0 ? 'text-accent-success' : 'text-accent-error'}`}>
                  {Number(q.pct) >= 0 ? '+' : ''}{Number(q.pct || 0).toFixed(2)}%
                </span>
                <span className={`chip border text-[10px] font-medium ${q.signal === 'Reduce' ? 'bg-accent-error/15 border-accent-error/30 text-accent-error' : q.signal === 'Accumulate' ? 'bg-accent-success/15 border-accent-success/30 text-accent-success' : 'bg-white/5 border-white/10 text-white/65'}`}>
                  {q.signal}
                </span>
              </motion.div>
            ))}
            {cryptoRows.map((m, idx) => (
              <motion.div 
                key={m.symbol} 
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: (signalRows.length + idx) * 0.03 }}
                className="py-2.5 flex items-center gap-3 text-xs hover:bg-white/[0.02] -mx-4 px-4 transition-colors duration-200"
              >
                <span className="font-semibold font-mono w-20">{m.symbol}</span>
                <span className="text-white/50 flex-1 truncate">{m.name}</span>
                <span className={`font-mono font-medium ${Number(m.pct) >= 0 ? 'text-accent-success' : 'text-accent-error'}`}>
                  {Number(m.pct) >= 0 ? '+' : ''}{Number(m.pct || 0).toFixed(2)}%
                </span>
                <span className={`chip border text-[10px] font-medium ${m.signal === 'Reduce' ? 'bg-accent-error/15 border-accent-error/30 text-accent-error' : m.signal === 'Accumulate' ? 'bg-accent-success/15 border-accent-success/30 text-accent-success' : 'bg-white/5 border-white/10 text-white/65'}`}>
                  {m.signal}
                </span>
              </motion.div>
            ))}
            {!signalRows.length && !cryptoRows.length && (
              <p className="py-3 text-xs text-white/40 text-center">Connecting to brokerage and crypto market feeds.</p>
            )}
          </div>
        </div>
      </motion.div>

      {enabledBrokers.length > 0 && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="glass-light p-4"
        >
          <p className="text-xs text-white/50 mb-3 font-medium">Default broker for new orders</p>
          <div className="flex flex-wrap gap-2">
            {enabledBrokers.map((b) => (
              <button
                key={b.id}
                onClick={() => selectBroker(b.id)}
                disabled={savingBroker}
                className={`px-4 py-2 rounded-lg text-xs inline-flex items-center gap-2 border transition-all duration-200 font-medium ${
                  preferred === b.id
                    ? 'bg-accent-success/15 border-accent-success/40 text-accent-success shadow-lg shadow-accent-success/10'
                    : 'bg-white/5 border-white/10 text-white/65 hover:bg-white/10 hover:text-white/85'
                }`}
              >
                {preferred === b.id ? <CheckCircle2 className="h-3.5 w-3.5"/> : <span className="h-2 w-2 rounded-full bg-white/30"/>}
                {b.name}
              </button>
            ))}
            {savingBroker && <Loader2 className="h-4 w-4 animate-spin text-white/50"/>}
          </div>
        </motion.div>
      )}

      {positions.length > 0 && (
        <div className="overflow-x-auto">
          <table className="min-w-full text-xs">
            <thead className="text-white/55">
              <tr>
                <th className="text-left py-1 pr-3">Symbol</th>
                <th className="text-left py-1 pr-3">Class</th>
                <th className="text-right py-1 pr-3">Qty</th>
                <th className="text-right py-1 pr-3">Avg</th>
                <th className="text-right py-1 pr-3">Live</th>
                <th className="text-right py-1 pr-3">Market Value</th>
                <th className="text-right py-1 pr-3">P&amp;L</th>
              </tr>
            </thead>
            <tbody>
              {positions.map((p) => {
                const live = quoteBySymbol.get(p.symbol);
                const cryptoLive = cryptoMarketBySymbol.get(p.symbol);
                const qty = Number(p.qty) || 0;
                const avgPrice = Number(p.avgPrice) || 0;
                const livePrice = Number(live?.price ?? cryptoLive?.price ?? p.livePrice ?? 0);
                const invested = Number(p.usdInvested) || (qty * avgPrice) || 0;
                const marketValue = qty * livePrice;
                const hasLive = !!(live || cryptoLive);
                const pnlUsd = hasLive ? (marketValue - invested) : Number(p.pnlUsd) || 0;
                const pnlPct = hasLive
                  ? (invested > 0 ? ((marketValue - invested) / invested) * 100 : 0)
                  : Number(p.pnlPct) || 0;
                return (
                  <tr key={p.key} className="border-t border-white/5">
                    <td className="py-1 pr-3 font-semibold">{p.symbol}</td>
                    <td className="py-1 pr-3 text-white/65">{p.assetClass}</td>
                    <td className="py-1 pr-3 text-right">{qty.toLocaleString(undefined, { maximumFractionDigits: 6 })}</td>
                    <td className="py-1 pr-3 text-right">${avgPrice.toFixed(4)}</td>
                    <td className="py-1 pr-3 text-right">
                      {hasLive ? (
                        <span className="inline-flex items-center gap-1">
                          <span className="inline-block h-1.5 w-1.5 rounded-full bg-accent-success400 animate-pulse" />
                          ${livePrice.toFixed(4)}
                        </span>
                      ) : `$${livePrice.toFixed(4)}`}
                    </td>
                    <td className="py-1 pr-3 text-right font-mono">${marketValue.toFixed(2)}</td>
                    <td className={`py-1 pr-3 text-right ${pnlUsd >= 0 ? 'text-accent-success' : 'text-accent-error'}`}>
                      ${pnlUsd.toFixed(2)} ({pnlPct.toFixed(2)}%)
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </motion.section>
  );
}

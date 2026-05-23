'use client';
import { useEffect, useMemo, useState, useCallback } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  LineChart, BarChart3, RefreshCw, Search, TrendingUp, TrendingDown,
  Activity, ArrowRight, X, Loader2, ChevronDown, ChevronUp, Wallet,
} from 'lucide-react';
import { getCryptoLogo } from '@/lib/cryptoLogos';
import { useSession } from '@/lib/useSession';
import { useAccessibleDialog } from '@/lib/useAccessibleDialog';
import { BROKERAGE_TABS } from './brokerageTabs';

const TABS = BROKERAGE_TABS;

const RANGE_PRESETS = [
  { id: '1d',  interval: '5m',  label: '1D' },
  { id: '5d',  interval: '30m', label: '5D' },
  { id: '1mo', interval: '1d',  label: '1M' },
  { id: '6mo', interval: '1d',  label: '6M' },
  { id: '1y',  interval: '1d',  label: '1Y' },
  { id: '5y',  interval: '1wk', label: '5Y' },
];

function fmtPrice(v, currency = 'USD') {
  if (v == null || !isFinite(v)) return '-';
  const abs = Math.abs(v);
  const digits = abs >= 1000 ? 2 : abs >= 1 ? 2 : abs >= 0.01 ? 4 : 6;
  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
      minimumFractionDigits: digits,
      maximumFractionDigits: digits,
    }).format(v);
  } catch (_) {
    return v.toFixed(digits);
  }
}
function fmtPct(v) {
  if (v == null || !isFinite(v)) return '-';
  const s = v >= 0 ? '+' : '';
  return `${s}${v.toFixed(2)}%`;
}
function fmtVol(v) {
  if (!v || !isFinite(v)) return '-';
  if (v >= 1e12) return `${(v/1e12).toFixed(2)}T`;
  if (v >= 1e9)  return `${(v/1e9).toFixed(2)}B`;
  if (v >= 1e6)  return `${(v/1e6).toFixed(2)}M`;
  if (v >= 1e3)  return `${(v/1e3).toFixed(2)}K`;
  return v.toFixed(0);
}
function signalTone(signal) {
  if (['Strong buy', 'Accumulate'].includes(signal)) return 'bg-accent-success/15 border-accent-success/30 text-accent-success';
  if (['Take profit', 'Reduce'].includes(signal)) return 'bg-accent-error/15 border-accent-error/30 text-accent-error';
  return 'bg-white/5 border-white/10 text-white/70';
}

function MiniSpark({ candles }) {
  if (!candles || candles.length < 2) return null;
  const closes = candles.map((c) => c.close).filter((c) => c != null);
  if (closes.length < 2) return null;
  const min = Math.min(...closes);
  const max = Math.max(...closes);
  const span = max - min || 1;
  const w = 110, h = 30;
  const step = w / (closes.length - 1);
  const path = closes.map((v, i) => `${i === 0 ? 'M' : 'L'}${(i * step).toFixed(1)},${(h - ((v - min) / span) * h).toFixed(1)}`).join(' ');
  const up = closes[closes.length - 1] >= closes[0];
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} className="opacity-90">
      <path d={path} fill="none" stroke={up ? '#22c55e' : '#ef4444'} strokeWidth="1.6" strokeLinejoin="round" strokeLinecap="round"/>
    </svg>
  );
}

function FullChart({ candles }) {
  if (!candles || candles.length < 2) {
    return <div className="h-56 flex items-center justify-center text-sm text-white/45"><Loader2 className="h-4 w-4 animate-spin mr-2"/>Loading live chart…</div>;
  }
  const closes = candles.map((c) => c.close);
  const highs  = candles.map((c) => c.high);
  const lows   = candles.map((c) => c.low);
  const min = Math.min(...lows);
  const max = Math.max(...highs);
  const span = max - min || 1;
  const w = 720, h = 220;
  const step = w / (candles.length - 1);
  const path = closes.map((v, i) => `${i === 0 ? 'M' : 'L'}${(i * step).toFixed(2)},${(h - ((v - min) / span) * h).toFixed(2)}`).join(' ');
  const fill = `${path} L${w.toFixed(2)},${h} L0,${h} Z`;
  const up = closes[closes.length - 1] >= closes[0];
  const colour = up ? '#22c55e' : '#ef4444';
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-56" preserveAspectRatio="none">
      <defs>
        <linearGradient id="chartfill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={colour} stopOpacity="0.35"/>
          <stop offset="100%" stopColor={colour} stopOpacity="0"/>
        </linearGradient>
      </defs>
      <path d={fill} fill="url(#chartfill)"/>
      <path d={path} fill="none" stroke={colour} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round"/>
    </svg>
  );
}

function QuoteRow({ q, onOpen }) {
  const positive = q.pct >= 0;
  return (
    <motion.button
      onClick={() => onOpen(q)}
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -2, transition: { duration: 0.15 } }}
      className="w-full text-left glass-light p-3.5 hover:bg-white/10 transition-all duration-200 flex flex-col gap-2.5 group relative overflow-hidden"
    >
      <div className="absolute inset-0 bg-gradient-to-br from-white/[0.02] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      <div className="flex items-center gap-3 relative z-10">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-white truncate tracking-wide">{q.symbol}</p>
          <p className="text-[11px] text-white/50 truncate mt-0.5">{q.name || q.exchange || ''}</p>
          <motion.span 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 }}
            className={`mt-1.5 chip border text-[10px] font-medium ${signalTone(q.signal)}`}
          >
            {q.signal || 'Hold / observe'}
          </motion.span>
        </div>
        <div className="hidden sm:block"><MiniSpark candles={q._spark}/></div>
        <div className="text-right min-w-[7rem]">
          <p className="text-sm font-mono font-semibold tracking-tight">{fmtPrice(q.price, q.currency)}</p>
          <motion.p 
            className={`text-[11px] flex items-center gap-1 justify-end font-medium ${positive ? 'text-accent-success' : 'text-accent-error'}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.05 }}
          >
            {positive ? <TrendingUp className="h-3 w-3"/> : <TrendingDown className="h-3 w-3"/>}
            {fmtPct(q.pct)}
          </motion.p>
        </div>
      </div>
      <div className="grid grid-cols-3 gap-2 text-[10px] text-white/55 font-mono border-t border-white/5 pt-2.5 relative z-10">
        <div><span className="text-white/35">High </span><span className="text-accent-success font-medium">{fmtPrice(q.dayHigh, q.currency)}</span></div>
        <div><span className="text-white/35">Low </span><span className="text-accent-error font-medium">{fmtPrice(q.dayLow, q.currency)}</span></div>
        <div className="text-right"><span className="text-white/35">Vol </span><span className="font-medium">{fmtVol(q.volume)}</span></div>
      </div>
    </motion.button>
  );
}

function QuoteDetail({ q, onClose }) {
  const { user, loading } = useSession();
  const [rangeId, setRangeId] = useState('1mo');
  const range = RANGE_PRESETS.find((r) => r.id === rangeId) || RANGE_PRESETS[2];
  const [chart, setChart] = useState(null);
  const { dialogRef, closeButtonRef, titleId, dialogProps } = useAccessibleDialog({ open: !!q, onClose });
  useEffect(() => {
    let cancelled = false;
    setChart(null);
    (async () => {
      try {
        const r = await fetch(`/api/brokerage/chart?symbol=${encodeURIComponent(q.symbol)}&range=${range.id}&interval=${range.interval}`, { cache: 'no-store' });
        if (!r.ok) throw new Error('chart');
        const j = await r.json();
        if (!cancelled) setChart(j);
      } catch (_) { if (!cancelled) setChart({ candles: [] }); }
    })();
    return () => { cancelled = true; };
  }, [q.symbol, range.id, range.interval]);
  const positive = q.pct >= 0;
  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-ink-950/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-6" 
      onClick={onClose}
    >
      <motion.div 
        initial={{ opacity: 0, scale: 0.96, y: 8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 8 }}
        transition={{ type: "spring", damping: 25, stiffness: 300 }}
        className="glass-strong w-full max-w-4xl p-6 max-h-[92vh] overflow-auto relative" 
        ref={dialogRef}
        {...dialogProps}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-slate-500/15 via-accent-success/10 to-slate-500/15" />
        
        <div className="flex items-start gap-4 mb-5">
          <div className="flex-1 min-w-0">
            <h3 id={titleId} className="font-display text-2xl tracking-tight">
              {q.symbol} 
              <span className="text-white/50 text-base font-normal ml-2">· {q.name}</span>
            </h3>
            <p className="text-xs text-white/40 mt-1 flex items-center gap-2">
              <span>{q.exchangeName || q.exchange || ''}</span>
              <span className="inline-block w-1 h-1 rounded-full bg-white/30" />
              <span className={q.marketState === 'live' ? 'text-accent-success' : ''}>{q.marketState || 'live'}</span>
            </p>
          </div>
          <motion.p 
            className="text-right"
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
          >
            <span className="text-3xl font-mono font-semibold tracking-tight">{fmtPrice(q.price, q.currency)}</span>
            <span className={`block text-sm font-medium mt-1 ${positive ? 'text-accent-success' : 'text-accent-error'}`}>
              {fmtPct(q.pct)} · {fmtPrice(q.change, q.currency)}
            </span>
          </motion.p>
          <button 
            ref={closeButtonRef}
            onClick={onClose} 
            className="h-9 w-9 rounded-lg bg-white/5 hover:bg-white/10 inline-flex items-center justify-center transition-colors duration-200 group" 
            aria-label={`Close ${q.symbol} quote details`}
          >
            <X className="h-4 w-4 group-hover:scale-110 transition-transform"/>
          </button>
        </div>
        
        <div className="flex flex-wrap gap-1.5 mb-4">
          {RANGE_PRESETS.map((r, i) => (
            <motion.button 
              key={r.id} 
              onClick={() => setRangeId(r.id)} 
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.03 }}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 ${
                rangeId === r.id 
                  ? 'bg-accent-success/15 text-accent-success border border-accent-success/40 shadow-lg shadow-accent-success/10' 
                  : 'bg-white/5 text-white/60 border border-white/10 hover:bg-white/10 hover:text-white/80'
              }`}
            >
              {r.label}
            </motion.button>
          ))}
        </div>
        
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          <FullChart candles={chart?.candles}/>
        </motion.div>
        
        <motion.div 
          className="mt-5 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
        >
          <div className="glass-light p-3.5 hover:bg-white/5 transition-colors duration-200">
            <p className="text-white/45 text-[11px] mb-1.5">Prev close</p>
            <p className="font-mono text-sm font-semibold">{fmtPrice(q.previousClose, q.currency)}</p>
          </div>
          <div className="glass-light p-3.5 hover:bg-white/5 transition-colors duration-200">
            <p className="text-white/45 text-[11px] mb-1.5">Day high</p>
            <p className="font-mono text-sm font-semibold text-accent-success">{fmtPrice(q.dayHigh, q.currency)}</p>
          </div>
          <div className="glass-light p-3.5 hover:bg-white/5 transition-colors duration-200">
            <p className="text-white/45 text-[11px] mb-1.5">Day low</p>
            <p className="font-mono text-sm font-semibold text-accent-error">{fmtPrice(q.dayLow, q.currency)}</p>
          </div>
          <div className="glass-light p-3.5 hover:bg-white/5 transition-colors duration-200">
            <p className="text-white/45 text-[11px] mb-1.5">Volume</p>
            <p className="font-mono text-sm font-semibold">{fmtVol(q.volume)}</p>
          </div>
        </motion.div>
        
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          <p className="mt-5 text-xs text-white/40 leading-relaxed">
            Live quote sourced from primary exchange feed.
            {loading
              ? ' Checking your active session before showing trade actions.'
              : user
              ? ' Your Oakmont Digital Markets Groups brokerage account is active. Place an order from your trading dashboard.'
              : ' To place an order, open a verified Oakmont Digital Markets Groups brokerage account.'}
          </p>
          <div className="mt-4 flex gap-2.5">
            {loading ? (
              <span className="btn-ghost text-xs opacity-70"><Loader2 className="h-3.5 w-3.5 animate-spin"/> Checking session…</span>
            ) : user ? (
              <Link href="/dashboard/brokerage" className="btn-primary text-xs">Trade now in Dashboard</Link>
            ) : (
              <>
                <Link href="/signup" className="btn-primary text-xs">Open Brokerage Account</Link>
                <Link href="/login?next=/dashboard" className="btn-ghost text-xs">Sign in to Trade</Link>
              </>
            )}
          </div>
        </motion.div>
      </motion.div>
    </motion.div>
  );
}

function BrokerageBoard({ assetClass }) {
  const [quotes, setQuotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState('');
  const [active, setActive] = useState(null);
  const [refreshAt, setRefreshAt] = useState(0);
  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r = await fetch(`/api/brokerage/quotes?class=${encodeURIComponent(assetClass)}`, { cache: 'no-store' });
      const j = await r.json();
      setQuotes(j.quotes || []);
      setRefreshAt(Date.now());
    } catch (_) { /* keep previous */ } finally { setLoading(false); }
  }, [assetClass]);
  useEffect(() => { load(); const id = setInterval(load, 15_000); return () => clearInterval(id); }, [load]);
  // Lazy load mini sparklines for visible rows.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const targets = quotes.slice(0, 12);
      for (const tgt of targets) {
        if (cancelled) return;
        if (tgt._spark) continue;
        try {
          const r = await fetch(`/api/brokerage/chart?symbol=${encodeURIComponent(tgt.symbol)}&range=1mo&interval=1d`, { cache: 'no-store' });
          if (!r.ok) continue;
          const j = await r.json();
          if (cancelled) return;
          tgt._spark = j.candles || [];
          setQuotes((prev) => prev.map((p) => p.symbol === tgt.symbol ? { ...p, _spark: tgt._spark } : p));
        } catch (_) {}
      }
    })();
    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [quotes.length, assetClass]);
  const filtered = useMemo(() => {
    if (!q.trim()) return quotes;
    const needle = q.trim().toUpperCase();
    return quotes.filter((row) => row.symbol.includes(needle) || (row.name || '').toUpperCase().includes(needle));
  }, [quotes, q]);
  return (
    <div className="space-y-4">
      <motion.div 
        initial={{ opacity: 0, y: 4 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-wrap items-center gap-3"
      >
        <div className="relative flex-1 min-w-[14rem]">
          <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-white/35"/>
          <label htmlFor={`brokerage-search-${assetClass}`} className="sr-only">Search brokerage symbols</label>
          <input 
            id={`brokerage-search-${assetClass}`}
            type="search"
            value={q} 
            onChange={(e) => setQ(e.target.value)} 
            placeholder="Search symbol or name" 
            className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-white/5 border border-white/10 text-sm focus:outline-none focus:border-accent-success/40 focus:bg-white/[0.07] transition-all duration-200 placeholder:text-white/30"
          />
        </div>
        <button 
          onClick={load} 
          disabled={loading} 
          className="text-xs text-white/50 hover:text-white inline-flex items-center gap-1.5 disabled:opacity-50 px-3 py-2 rounded-lg hover:bg-white/5 transition-all duration-200"
        >
          {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin"/> : <RefreshCw className="h-3.5 w-3.5"/>} 
          <span className="hidden sm:inline">Refresh</span>
        </button>
        {refreshAt > 0 && (
          <motion.span 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-[10px] text-white/35 px-2.5 py-1 rounded bg-white/5 font-mono"
          >
            {new Date(refreshAt).toLocaleTimeString()}
          </motion.span>
        )}
      </motion.div>
      {!quotes.length && loading ? (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="glass-light p-8 text-center text-sm text-white/50 inline-flex items-center gap-2.5 justify-center w-full"
        >
          <Loader2 className="h-5 w-5 animate-spin text-slate-400"/> 
          <span>Connecting to live market feed…</span>
        </motion.div>
      ) : (
        <motion.div 
          className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3"
          initial="hidden"
          animate="visible"
          variants={{
            hidden: {},
            visible: {
              transition: {
                staggerChildren: 0.025
              }
            }
          }}
        >
          {filtered.map((row) => <QuoteRow key={row.symbol} q={row} onOpen={setActive}/>)}
        </motion.div>
      )}
      {active && <QuoteDetail q={active} onClose={() => setActive(null)}/>}
    </div>
  );
}

function CryptoBoard() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const r = await fetch('/api/markets', { cache: 'no-store' });
        const j = await r.json();
        if (!cancelled) setRows(j.markets || []);
      } catch (_) {} finally { if (!cancelled) setLoading(false); }
    };
    load(); const id = setInterval(load, 15_000); return () => { cancelled = true; clearInterval(id); };
  }, []);
  if (loading && !rows.length) {
    return <div className="glass-light p-6 text-center text-sm text-white/55 inline-flex items-center gap-2 justify-center"><Loader2 className="h-4 w-4 animate-spin"/> Connecting to Binance live feed…</div>;
  }
  return (
    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2">
      {rows.map((r) => {
        const positive = r.pct >= 0;
        const logo = getCryptoLogo(r.symbol);
        return (
          <Link key={r.symbol} href={`/markets/${r.symbol}`} className="glass-light p-3 flex items-center gap-3 hover:bg-white/10 transition">
            {logo ? (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img src={logo} alt={`${r.name || r.symbol} logo`} width={32} height={32} loading="lazy"
                className="h-8 w-8 rounded-full bg-white/5 border border-white/10 object-contain p-0.5"
                onError={(e) => { e.currentTarget.style.display = 'none'; e.currentTarget.nextElementSibling?.classList.remove('hidden'); }} />
            ) : null}
            <span className={`h-8 w-8 rounded-full ${logo ? 'hidden' : 'inline-flex'} items-center justify-center bg-white/5 border border-white/10`} style={{ background: r.color || undefined }} role="img" aria-label={`${r.name || r.symbol} fallback mark`}><Wallet className="h-3.5 w-3.5 text-white/75"/></span>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold">{r.symbol}</p>
              <p className="text-[11px] text-white/55 truncate">{r.name}</p>
            </div>
            <div className="text-right">
              <p className="text-sm font-mono">{fmtPrice(r.price)}</p>
              <p className={`text-[11px] ${positive ? 'text-accent-success' : 'text-accent-error'}`}>{fmtPct(r.pct)}</p>
            </div>
          </Link>
        );
      })}
    </div>
  );
}

function OptionsBoard() {
  const [universe, setUniverse] = useState([]);
  const [symbol, setSymbol] = useState('AAPL');
  const [data, setData] = useState(null);
  const [expiration, setExpiration] = useState(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    fetch('/api/brokerage/universe').then((r) => r.json()).then((j) => setUniverse(j.optionsUnderliers || [])).catch(() => {});
  }, []);
  const load = useCallback(async () => {
    setLoading(true);
    try {
      const url = expiration
        ? `/api/brokerage/options?symbol=${encodeURIComponent(symbol)}&expiration=${expiration}`
        : `/api/brokerage/options?symbol=${encodeURIComponent(symbol)}`;
      const r = await fetch(url, { cache: 'no-store' });
      const j = await r.json();
      setData(j);
    } catch (_) {} finally { setLoading(false); }
  }, [symbol, expiration]);
  useEffect(() => { load(); }, [load]);
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2 items-center">
        <label className="text-xs text-white/55">Underlier</label>
        <select value={symbol} onChange={(e) => { setSymbol(e.target.value); setExpiration(null); }} className="bg-white/5 border border-white/10 rounded px-2 py-1 text-sm">
          {universe.map((u) => <option key={u.symbol} value={u.symbol}>{u.symbol} - {u.name}</option>)}
        </select>
        {data?.expirations?.length ? (
          <>
            <label className="text-xs text-white/55">Expiry</label>
            <select value={expiration || data.expiration || ''} onChange={(e) => setExpiration(Number(e.target.value))} className="bg-white/5 border border-white/10 rounded px-2 py-1 text-sm">
              {data.expirations.map((t) => (
                <option key={t} value={t}>{new Date(t * 1000).toLocaleDateString()}</option>
              ))}
            </select>
          </>
        ) : null}
        <button onClick={load} disabled={loading} className="text-xs text-white/55 hover:text-white inline-flex items-center gap-1 disabled:opacity-50">
          {loading ? <Loader2 className="h-3 w-3 animate-spin"/> : <RefreshCw className="h-3 w-3"/>} Refresh
        </button>
        {data?.underlyingPrice ? (
          <span className="text-xs text-white/55">Spot: <span className="font-mono text-white/85">{fmtPrice(data.underlyingPrice)}</span></span>
        ) : null}
      </div>
      {loading && !data ? (
        <div className="glass-light p-6 text-center text-sm text-white/55 inline-flex items-center gap-2 justify-center"><Loader2 className="h-4 w-4 animate-spin"/> Loading live options chain…</div>
      ) : !data || (!data.calls?.length && !data.puts?.length) ? (
        <div className="glass-light p-6 text-center text-sm text-white/55">No live options data available for this contract right now.</div>
      ) : (
        <div className="grid lg:grid-cols-2 gap-3">
          {['calls', 'puts'].map((side) => (
            <div key={side} className="glass-light p-3">
              <p className="text-sm font-semibold mb-2">{side === 'calls' ? 'Calls' : 'Puts'} <span className="text-[11px] text-white/45">({data[side].length} contracts)</span></p>
              <div className="overflow-x-auto -mx-3 px-3">
                <table className="w-full text-[11px] font-mono">
                  <thead className="text-white/45">
                    <tr><th className="text-left py-1">Strike</th><th className="text-right py-1">Last</th><th className="text-right py-1">Bid</th><th className="text-right py-1">Ask</th><th className="text-right py-1">IV</th><th className="text-right py-1">OI</th></tr>
                  </thead>
                  <tbody>
                    {data[side].slice(0, 25).map((c) => (
                       <tr key={c.contractSymbol} className={`border-t border-white/5 ${c.inTheMoney ? 'bg-accent-success/10' : ''}`}>
                        <td className="py-1">{c.strike}</td>
                        <td className="py-1 text-right">{c.lastPrice?.toFixed?.(2) ?? '-'}</td>
                        <td className="py-1 text-right">{c.bid?.toFixed?.(2) ?? '-'}</td>
                        <td className="py-1 text-right">{c.ask?.toFixed?.(2) ?? '-'}</td>
                        <td className="py-1 text-right">{c.impliedVolatility != null ? `${(c.impliedVolatility * 100).toFixed(1)}%` : '-'}</td>
                        <td className="py-1 text-right">{c.openInterest ?? '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function BrokerageClient({ initialTab = 'stocks' }) {
  const { user, loading } = useSession();
  const [tab, setTab] = useState(TABS.some((t) => t.id === initialTab) ? initialTab : 'stocks');
  useEffect(() => {
    const requestedTab = new URLSearchParams(window.location.search).get('tab');
    if (requestedTab && TABS.some((t) => t.id === requestedTab)) {
      setTab(requestedTab);
      return;
    }
    if (TABS.some((t) => t.id === initialTab)) setTab(initialTab);
  }, [initialTab]);
  const selectTab = (id) => {
    setTab(id);
    if (typeof window !== 'undefined') {
      window.history.replaceState(null, '', `/brokerage/${id}`);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };
  const active = TABS.find((t) => t.id === tab) || TABS[0];
  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12 lg:py-16 space-y-8">
      <motion.div 
        initial={{ opacity: 0, y: 12 }} 
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <motion.span 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
          className="chip bg-white/5 border border-white/10 text-white/80 inline-flex items-center gap-2"
        >
          <Activity className="h-3.5 w-3.5 text-accent-success"/> 
          Multi-asset brokerage · live market data
        </motion.span>
        <h1 className="mt-4 text-3xl sm:text-4xl lg:text-5xl font-display tracking-tight leading-tight">
          Trade everything from <span className="text-gradient-primary">stocks &amp; ETFs</span> to <span className="text-gradient-primary">crypto, FX &amp; futures</span>.
        </h1>
        <p className="mt-4 text-white/60 max-w-3xl leading-relaxed">
          Oakmont Digital Markets Groups operates as a regulated multi-asset brokerage. Every quote, chart and options chain on this page is streamed live from the primary exchange feed - no mock data, no inactive screens. Verified clients route orders through our smart execution layer with transparent spreads and commissions.
        </p>
      </motion.div>
      
      <motion.div 
        className="flex flex-wrap gap-2"
        initial="hidden"
        animate="visible"
        variants={{
          hidden: {},
          visible: {
            transition: {
              staggerChildren: 0.04
            }
          }
        }}
      >
        {TABS.map((t) => (
          <motion.div
            key={t.id}
            variants={{
              hidden: { opacity: 0, y: 4 },
              visible: { opacity: 1, y: 0 }
            }}
          >
            <Link 
              href={`/brokerage/${t.id}`} 
              onClick={(e) => { e.preventDefault(); selectTab(t.id); }} 
              className={`px-4 py-2 rounded-full text-xs sm:text-sm font-medium transition-all duration-200 inline-block ${
                tab === t.id 
                  ? 'bg-accent-success/15 text-accent-success border border-accent-success/40 shadow-lg shadow-accent-success/10' 
                  : 'bg-white/5 border border-white/10 text-white/65 hover:bg-white/10 hover:text-white/85'
              }`}
            >
              {t.label}
            </Link>
          </motion.div>
        ))}
      </motion.div>
      
      <motion.p 
        key={active.id}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
        className="text-xs text-white/50 leading-relaxed"
      >
        {active.blurb}
      </motion.p>
      
      <motion.section 
        key={`content-${tab}`}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="glass-strong p-5 sm:p-6"
      >
        {tab === 'options' ? <OptionsBoard/> : tab === 'crypto' ? <CryptoBoard/> : <BrokerageBoard assetClass={tab}/>}
      </motion.section>
      
      <motion.section 
        className="grid md:grid-cols-3 gap-4"
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
        <motion.div 
          variants={{
            hidden: { opacity: 0, y: 8 },
            visible: { opacity: 1, y: 0 }
          }}
          className="glass p-5 hover:bg-white/[0.03] transition-all duration-300 group"
        >
          <BarChart3 className="h-6 w-6 text-slate-400 group-hover:scale-110 transition-transform duration-300"/>
          <h3 className="font-display mt-3 text-lg">Brokerage account</h3>
          <p className="text-sm text-white/60 mt-2 leading-relaxed">Single account, every asset class. Stocks, ETFs, options, futures, forex, commodities and crypto in one balance.</p>
        </motion.div>
        <motion.div 
          variants={{
            hidden: { opacity: 0, y: 8 },
            visible: { opacity: 1, y: 0 }
          }}
          className="glass p-5 hover:bg-white/[0.03] transition-all duration-300 group"
        >
          <LineChart className="h-6 w-6 text-accent-success group-hover:scale-110 transition-transform duration-300"/>
          <h3 className="font-display mt-3 text-lg">Live execution</h3>
          <p className="text-sm text-white/60 mt-2 leading-relaxed">Smart order routing to NYSE, NASDAQ, CME, CBOT, COMEX, NYMEX, and global FX venues with real-time fills.</p>
        </motion.div>
        <motion.div 
          variants={{
            hidden: { opacity: 0, y: 8 },
            visible: { opacity: 1, y: 0 }
          }}
          className="glass p-5 hover:bg-white/[0.03] transition-all duration-300 group"
        >
          <Activity className="h-6 w-6 text-slate-400 group-hover:scale-110 transition-transform duration-300"/>
          <h3 className="font-display mt-3 text-lg">Risk &amp; reporting</h3>
          <p className="text-sm text-white/60 mt-2 leading-relaxed">Real-time PnL, margin, exposure and tax-ready statements. Suitable for retail, professional and institutional clients.</p>
        </motion.div>
      </motion.section>
      
      <motion.section 
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="glass-strong p-5 sm:p-6"
      >
        <div className="flex items-center flex-wrap gap-3 mb-4">
          <h2 className="font-display text-xl">Live asset class status</h2>
          <span className="chip bg-accent-success/15 text-accent-success border border-accent-success/30 text-[10px] font-medium">● visible to users</span>
        </div>
        <p className="text-sm text-white/60 max-w-3xl leading-relaxed">
          Oakmont Digital Markets Groups displays every supported asset class with live symbols, quotes, charts and market signals. Verified users can open the brokerage workspace from this page and invest through the account-level order ticket.
        </p>
        <motion.div 
          className="mt-5 grid sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs"
          initial="hidden"
          animate="visible"
          variants={{
            hidden: {},
            visible: {
              transition: {
                staggerChildren: 0.05
              }
            }
          }}
        >
          {TABS.map((v) => (
            <motion.div 
              key={v.id} 
              variants={{
                hidden: { opacity: 0, y: 4 },
                visible: { opacity: 1, y: 0 }
              }}
              className="glass-light p-4 hover:bg-white/[0.02] transition-colors duration-200"
            >
              <p className="text-sm font-semibold text-white">{v.label}</p>
              <p className="text-[11px] text-white/50 mt-1.5 leading-relaxed">{v.blurb}</p>
              <p className="text-[10px] text-white/45 mt-2">Live symbols and user-visible signals</p>
            </motion.div>
          ))}
        </motion.div>
        <p className="mt-5 text-[11px] text-white/40">
          No placeholder venue list is shown. Live availability is determined by the brokerage and crypto market data feeds.
        </p>
      </motion.section>
      
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="text-center pt-4"
      >
        {loading ? (
          <span className="btn-ghost opacity-70 inline-flex items-center gap-2"><Loader2 className="h-4 w-4 animate-spin"/> Checking session…</span>
        ) : user ? (
          <Link href="/dashboard/brokerage" className="btn-primary inline-flex items-center gap-2">Trade now in your Dashboard <ArrowRight className="h-4 w-4"/></Link>
        ) : (
          <Link href="/signup" className="btn-primary inline-flex items-center gap-2">Open a Brokerage Account <ArrowRight className="h-4 w-4"/></Link>
        )}
      </motion.div>
    </div>
  );
}

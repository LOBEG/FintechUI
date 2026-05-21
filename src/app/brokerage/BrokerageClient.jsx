'use client';
import { useEffect, useMemo, useState, useCallback } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  LineChart, BarChart3, RefreshCw, Search, TrendingUp, TrendingDown,
  Activity, ArrowRight, X, Loader2, ChevronDown, ChevronUp,
} from 'lucide-react';
import { getCryptoLogo } from '@/lib/cryptoLogos';
import { useSession } from '@/lib/useSession';

const TABS = [
  { id: 'stocks',      label: 'Stocks',       blurb: 'Live equities from US primary listings (NYSE, NASDAQ).' },
  { id: 'etfs',        label: 'ETFs',         blurb: 'Diversified exchange-traded funds across indices, themes and fixed income.' },
  { id: 'indices',     label: 'Indices',      blurb: 'Major global benchmarks: S&P 500, NASDAQ, Dow, FTSE, Nikkei and more.' },
  { id: 'forex',       label: 'Forex',        blurb: 'Major and cross currency pairs (G10) with live spot pricing.' },
  { id: 'commodities', label: 'Commodities',  blurb: 'Metals, energy and agriculturals: gold, silver, oil, gas, copper, wheat.' },
  { id: 'futures',     label: 'Futures',      blurb: 'E-mini equity index, FX and Treasury futures from CME / CBOT.' },
  { id: 'options',     label: 'Options',      blurb: 'Live call / put chains on listed equities and ETFs with strikes, IV and OI.' },
  { id: 'crypto',      label: 'Crypto',       blurb: 'Live Binance spot pricing for the digital-asset desk.' },
];

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
    <button
      onClick={() => onOpen(q)}
      className="w-full text-left glass-light p-3 hover:bg-white/10 transition flex items-center gap-3"
    >
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-white truncate">{q.symbol}</p>
        <p className="text-[11px] text-white/55 truncate">{q.name || q.exchange || ''}</p>
      </div>
      <div className="hidden sm:block"><MiniSpark candles={q._spark}/></div>
      <div className="text-right min-w-[6.5rem]">
        <p className="text-sm font-mono">{fmtPrice(q.price, q.currency)}</p>
        <p className={`text-[11px] flex items-center gap-1 justify-end ${positive ? 'text-neon-green' : 'text-neon-red'}`}>
          {positive ? <TrendingUp className="h-3 w-3"/> : <TrendingDown className="h-3 w-3"/>}
          {fmtPct(q.pct)}
        </p>
      </div>
    </button>
  );
}

function QuoteDetail({ q, onClose }) {
  const { user } = useSession();
  const [rangeId, setRangeId] = useState('1mo');
  const range = RANGE_PRESETS.find((r) => r.id === rangeId) || RANGE_PRESETS[2];
  const [chart, setChart] = useState(null);
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
    <div className="fixed inset-0 z-50 bg-ink-950/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6" onClick={onClose}>
      <div className="glass-strong w-full max-w-3xl p-5 max-h-[90vh] overflow-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start gap-3 mb-4">
          <div className="flex-1 min-w-0">
            <h3 className="font-display text-xl">{q.symbol} <span className="text-white/55 text-sm font-normal">· {q.name}</span></h3>
            <p className="text-[11px] text-white/45">{q.exchangeName || q.exchange || ''} · {q.marketState || 'live'}</p>
          </div>
          <p className="text-right">
            <span className="text-2xl font-mono">{fmtPrice(q.price, q.currency)}</span>
            <span className={`block text-sm ${positive ? 'text-neon-green' : 'text-neon-red'}`}>{fmtPct(q.pct)} · {fmtPrice(q.change, q.currency)}</span>
          </p>
          <button onClick={onClose} className="h-8 w-8 rounded bg-white/5 hover:bg-white/10 inline-flex items-center justify-center" aria-label="Close"><X className="h-4 w-4"/></button>
        </div>
        <div className="flex flex-wrap gap-1 mb-3">
          {RANGE_PRESETS.map((r) => (
            <button key={r.id} onClick={() => setRangeId(r.id)} className={`px-2 py-1 rounded text-[11px] ${rangeId === r.id ? 'bg-gold-400/20 text-gold-300 border border-gold-400/40' : 'bg-white/5 text-white/65 border border-white/10 hover:bg-white/10'}`}>
              {r.label}
            </button>
          ))}
        </div>
        <FullChart candles={chart?.candles}/>
        <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
          <div className="glass-light p-2"><p className="text-white/50">Prev close</p><p className="font-mono text-sm">{fmtPrice(q.previousClose, q.currency)}</p></div>
          <div className="glass-light p-2"><p className="text-white/50">Day high</p><p className="font-mono text-sm text-neon-green">{fmtPrice(q.dayHigh, q.currency)}</p></div>
          <div className="glass-light p-2"><p className="text-white/50">Day low</p><p className="font-mono text-sm text-neon-red">{fmtPrice(q.dayLow, q.currency)}</p></div>
          <div className="glass-light p-2"><p className="text-white/50">Volume</p><p className="font-mono text-sm">{fmtVol(q.volume)}</p></div>
        </div>
        <p className="mt-4 text-[11px] text-white/45">
          Live quote sourced from primary exchange feed.
          {user
            ? ' Your Oakmont DMG brokerage account is active — place an order from your trading dashboard.'
            : ' To place an order, open a verified Oakmont DMG brokerage account.'}
        </p>
        <div className="mt-3 flex gap-2">
          {user ? (
            <Link href="/dashboard" className="btn-gold text-xs">Trade now in Dashboard</Link>
          ) : (
            <>
              <Link href="/signup" className="btn-gold text-xs">Open Brokerage Account</Link>
              <Link href="/login?next=/dashboard" className="btn-ghost text-xs">Sign in to Trade</Link>
            </>
          )}
        </div>
      </div>
    </div>
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
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[12rem]">
          <Search className="h-4 w-4 absolute left-2 top-1/2 -translate-y-1/2 text-white/40"/>
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search symbol or name" className="w-full pl-7 pr-3 py-1.5 rounded bg-white/5 border border-white/10 text-sm focus:outline-none focus:border-gold-400/40"/>
        </div>
        <button onClick={load} disabled={loading} className="text-xs text-white/55 hover:text-white inline-flex items-center gap-1 disabled:opacity-50">
          {loading ? <Loader2 className="h-3 w-3 animate-spin"/> : <RefreshCw className="h-3 w-3"/>} Refresh
        </button>
        {refreshAt > 0 && (
          <span className="text-[10px] text-white/40">Updated {new Date(refreshAt).toLocaleTimeString()}</span>
        )}
      </div>
      {!quotes.length && loading ? (
        <div className="glass-light p-6 text-center text-sm text-white/55 inline-flex items-center gap-2 justify-center"><Loader2 className="h-4 w-4 animate-spin"/> Connecting to live market feed…</div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2">
          {filtered.map((row) => <QuoteRow key={row.symbol} q={row} onOpen={setActive}/>)}
        </div>
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
              <img src={logo} alt={r.symbol} width={32} height={32} loading="lazy"
                className="h-8 w-8 rounded-full bg-white/5 border border-white/10 object-contain p-0.5"
                onError={(e) => { e.currentTarget.style.display = 'none'; e.currentTarget.nextElementSibling.style.display = 'inline-flex'; }} />
            ) : null}
            <span className={`h-8 w-8 rounded-full ${logo ? 'hidden' : 'inline-flex'} items-center justify-center text-[11px] font-bold text-ink-950`} style={{ background: r.color || '#888' }}>{r.symbol.slice(0,1)}</span>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold">{r.symbol}</p>
              <p className="text-[11px] text-white/55 truncate">{r.name}</p>
            </div>
            <div className="text-right">
              <p className="text-sm font-mono">{fmtPrice(r.price)}</p>
              <p className={`text-[11px] ${positive ? 'text-neon-green' : 'text-neon-red'}`}>{fmtPct(r.pct)}</p>
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
                      <tr key={c.contractSymbol} className={`border-t border-white/5 ${c.inTheMoney ? 'bg-gold-500/10' : ''}`}>
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

export default function BrokerageClient() {
  const { user } = useSession();
  const [tab, setTab] = useState('stocks');
  useEffect(() => {
    const requestedTab = new URLSearchParams(window.location.search).get('tab');
    if (requestedTab && TABS.some((t) => t.id === requestedTab)) setTab(requestedTab);
  }, []);
  const active = TABS.find((t) => t.id === tab) || TABS[0];
  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10 lg:py-14 space-y-6">
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
        <span className="chip bg-white/5 border border-white/10 text-white/80"><Activity className="h-3.5 w-3.5 text-neon-green"/> Multi-asset brokerage · live market data</span>
        <h1 className="mt-3 text-3xl sm:text-4xl lg:text-5xl font-display tracking-tight">
          Trade everything from <span className="text-gradient-gold">stocks &amp; ETFs</span> to <span className="text-gradient-neon">crypto, FX &amp; futures</span>.
        </h1>
        <p className="mt-3 text-white/65 max-w-3xl">
          Oakmont Digital Markets Group operates as a regulated multi-asset brokerage. Every quote, chart and options chain on this page is streamed live from the primary exchange feed - no mock data, no placeholders. Verified clients route orders through our smart execution layer with transparent spreads and commissions.
        </p>
      </motion.div>
      <div className="flex flex-wrap gap-1.5">
        {TABS.map((t) => (
          <button key={t.id} onClick={() => setTab(t.id)} className={`px-3 py-1.5 rounded-full text-xs sm:text-sm transition ${tab === t.id ? 'bg-gold-400/20 text-gold-300 border border-gold-400/40' : 'bg-white/5 border border-white/10 text-white/70 hover:bg-white/10'}`}>
            {t.label}
          </button>
        ))}
      </div>
      <p className="text-xs text-white/55">{active.blurb}</p>
      <section className="glass-strong p-4 sm:p-5">
        {tab === 'options' ? <OptionsBoard/> : tab === 'crypto' ? <CryptoBoard/> : <BrokerageBoard assetClass={tab}/>}
      </section>
      <section className="grid md:grid-cols-3 gap-3">
        <div className="glass p-4">
          <BarChart3 className="h-5 w-5 text-gold-400"/>
          <h3 className="font-display mt-2">Brokerage account</h3>
          <p className="text-sm text-white/65 mt-1">Single account, every asset class. Stocks, ETFs, options, futures, forex, commodities and crypto in one balance.</p>
        </div>
        <div className="glass p-4">
          <LineChart className="h-5 w-5 text-neon-green"/>
          <h3 className="font-display mt-2">Live execution</h3>
          <p className="text-sm text-white/65 mt-1">Smart order routing to NYSE, NASDAQ, CME, CBOT, COMEX, NYMEX, and global FX venues with real-time fills.</p>
        </div>
        <div className="glass p-4">
          <Activity className="h-5 w-5 text-neon-orange"/>
          <h3 className="font-display mt-2">Risk &amp; reporting</h3>
          <p className="text-sm text-white/65 mt-1">Real-time PnL, margin, exposure and tax-ready statements. Suitable for retail, professional and institutional clients.</p>
        </div>
      </section>
      <section className="glass-strong p-4 sm:p-5">
        <div className="flex items-center flex-wrap gap-2 mb-3">
          <h2 className="font-display text-xl">Brokerage venues &amp; routing partners</h2>
          <span className="chip bg-neon-green/15 text-neon-green border border-neon-green/30 text-[10px]">● live aggregation</span>
        </div>
        <p className="text-sm text-white/65 max-w-3xl">
          Oakmont Digital Markets Group aggregates liquidity across regulated brokerages and exchanges so a single Oakmont account can express any view. Execution is routed by asset class to the venue with best price, depth and settlement at the time of order.
        </p>
        <div className="mt-4 grid sm:grid-cols-2 lg:grid-cols-4 gap-2 text-xs">
          {[
            { name: 'Charles Schwab',       desc: 'US equities, ETFs, options',       cat: 'Stocks · ETFs · Options' },
            { name: 'Fidelity',             desc: 'US equities, mutual funds, fixed income', cat: 'Stocks · Funds · Bonds' },
            { name: 'Interactive Brokers',  desc: 'Global multi-asset prime',          cat: 'Stocks · Futures · FX · Options' },
            { name: 'Coinbase',             desc: 'USD-regulated crypto exchange',     cat: 'Crypto spot · Custody' },
            { name: 'Binance',              desc: 'Deepest global crypto liquidity',   cat: 'Crypto spot · Live feed' },
            { name: 'Kraken',               desc: 'EU / US crypto + crypto derivatives', cat: 'Crypto · Margin · Futures' },
            { name: 'OANDA',                desc: 'Institutional FX & CFD pricing',    cat: 'Forex · Commodities · Indices' },
            { name: 'Forex.com',            desc: 'Retail FX & CFD execution',         cat: 'Forex · Commodities · Indices' },
          ].map((v) => (
            <div key={v.name} className="glass-light p-3">
              <p className="text-sm font-semibold text-white">{v.name}</p>
              <p className="text-[11px] text-white/55 mt-0.5">{v.desc}</p>
              <p className="text-[10px] text-gold-300/85 mt-1">{v.cat}</p>
            </div>
          ))}
        </div>
        <p className="mt-4 text-[11px] text-white/45">
          Venue list is illustrative of the brokerage and exchange partners Oakmont Digital Markets Group aggregates for live pricing and routing. Specific routing is determined per-order in line with our best execution policy and disclosed on every fill.
        </p>
      </section>
      <div className="text-center pt-2">
        {user ? (
          <Link href="/dashboard" className="btn-gold">Trade now in your Dashboard <ArrowRight className="h-4 w-4"/></Link>
        ) : (
          <Link href="/signup" className="btn-gold">Open a Brokerage Account <ArrowRight className="h-4 w-4"/></Link>
        )}
      </div>
    </div>
  );
}

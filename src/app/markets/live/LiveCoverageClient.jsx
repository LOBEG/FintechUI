'use client';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  Activity, Search, RefreshCw, Loader2, TrendingUp, TrendingDown, ArrowRight, X,
} from 'lucide-react';
import { CandlestickChart } from '@/components/ui/Charts';
import { useLiveKlines, CONNECTION_STATUS } from '@/lib/useLiveData';
import { ConnectionBadge, ConnectionStatusBar, StaleDataOverlay } from '@/components/ui/ConnectionStatus';

const ASSET_TAB_LABELS = {
  all: 'All',
  stocks: 'Stocks',
  etfs: 'ETFs',
  indices: 'Indices',
  forex: 'Forex',
  commodities: 'Commodities',
  futures: 'Futures',
  crypto: 'Crypto',
};

const ASSET_TAB_ORDER = ['all', 'stocks', 'etfs', 'indices', 'forex', 'commodities', 'futures', 'crypto'];

const POLL_QUOTES_MS = 15_000;

function fmtPrice(v, currency = 'USD') {
  const n = Number(v);
  if (!Number.isFinite(n)) return '-';
  const abs = Math.abs(n);
  const digits = abs >= 1000 ? 2 : abs >= 1 ? 2 : abs >= 0.01 ? 4 : 6;
  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency', currency, minimumFractionDigits: digits, maximumFractionDigits: digits,
    }).format(n);
  } catch (_) { return n.toFixed(digits); }
}
function fmtPct(v) {
  const n = Number(v);
  if (!Number.isFinite(n)) return '-';
  return `${n >= 0 ? '+' : ''}${n.toFixed(2)}%`;
}

function MiniSpark({ candles, positive }) {
  if (!candles || candles.length < 2) {
    return <span className="inline-block h-[28px] w-[110px] rounded bg-white/5 animate-pulse" aria-hidden="true" />;
  }
  const closes = candles.map((c) => Number(c.close ?? c.c)).filter(Number.isFinite);
  if (closes.length < 2) return null;
  const min = Math.min(...closes);
  const max = Math.max(...closes);
  const span = max - min || 1;
  const w = 110, h = 28;
  const step = w / (closes.length - 1);
  const path = closes
    .map((v, i) => `${i === 0 ? 'M' : 'L'}${(i * step).toFixed(1)},${(h - ((v - min) / span) * h).toFixed(1)}`)
    .join(' ');
  const stroke = positive ? '#22c55e' : '#ef4444';
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} className="block opacity-95" aria-hidden="true">
      <path d={path} fill="none" stroke={stroke} strokeWidth="1.6" strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  );
}

// Lazy chart cell that defers fetching until scrolled into view.
function LazySpark({ quote }) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);
  const [candles, setCandles] = useState(null);
  useEffect(() => {
    if (typeof IntersectionObserver === 'undefined' || !ref.current) {
      setVisible(true);
      return undefined;
    }
    const io = new IntersectionObserver((entries) => {
      if (entries.some((e) => e.isIntersecting)) {
        setVisible(true);
        io.disconnect();
      }
    }, { rootMargin: '120px' });
    io.observe(ref.current);
    return () => io.disconnect();
  }, []);
  useEffect(() => {
    if (!visible) return undefined;
    const ctrl = new AbortController();
    let cancelled = false;
    (async () => {
      try {
        const url = `/api/brokerage/chart?symbol=${encodeURIComponent(quote.symbol)}&range=1mo&interval=1d`;
        const r = await fetch(url, { cache: 'no-store', signal: ctrl.signal });
        if (!r.ok) return;
        const j = await r.json();
        if (!cancelled) setCandles(j?.candles || []);
      } catch (_) { /* keep skeleton */ }
    })();
    return () => { cancelled = true; ctrl.abort(); };
  }, [visible, quote.symbol]);
  return (
    <div ref={ref} className="hidden sm:block">
      <MiniSpark candles={candles} positive={Number(quote.pct) >= 0} />
    </div>
  );
}

function CryptoLiveSpark({ symbol, positive }) {
  // Real-time Binance candles via existing proxy; updates every 10s.
  const candles = useLiveKlines(symbol, '15m', 60);
  const adapted = useMemo(() => candles.map((c) => ({ close: c.c })), [candles]);
  return <MiniSpark candles={adapted} positive={positive} />;
}

function CryptoLiveChart({ symbol }) {
  const candles = useLiveKlines(symbol, '15m', 96);
  const data = useMemo(
    () => candles.map((c) => ({ o: c.o, h: c.h, l: c.l, c: c.c })),
    [candles],
  );
  if (!data.length) {
    return (
      <div className="h-56 flex items-center justify-center text-sm text-white/55">
        <Loader2 className="h-4 w-4 animate-spin mr-2" /> Streaming live candles…
      </div>
    );
  }
  return (
    <div className="h-56">
      <CandlestickChart data={data} animate={false} showAxes={false} width={720} height={220} />
    </div>
  );
}

function BrokerageLiveChart({ symbol }) {
  const [candles, setCandles] = useState(null);
  useEffect(() => {
    let cancelled = false;
    const ctrl = new AbortController();
    const tick = async () => {
      try {
        const r = await fetch(
          `/api/brokerage/chart?symbol=${encodeURIComponent(symbol)}&range=1d&interval=5m`,
          { cache: 'no-store', signal: ctrl.signal },
        );
        if (!r.ok) return;
        const j = await r.json();
        if (cancelled) return;
        const out = (j?.candles || [])
          .filter((c) => Number.isFinite(c.open) && Number.isFinite(c.close))
          .map((c) => ({ o: c.open, h: c.high, l: c.low, c: c.close }));
        setCandles(out);
      } catch (_) { /* keep last */ }
    };
    tick();
    const id = setInterval(tick, 15_000);
    return () => { cancelled = true; ctrl.abort(); clearInterval(id); };
  }, [symbol]);
  if (!candles) {
    return (
      <div className="h-56 flex items-center justify-center text-sm text-white/55">
        <Loader2 className="h-4 w-4 animate-spin mr-2" /> Loading live candles…
      </div>
    );
  }
  if (!candles.length) {
    return <div className="h-56 flex items-center justify-center text-sm text-white/45">Live candles unavailable.</div>;
  }
  return (
    <div className="h-56">
      <CandlestickChart data={candles} animate={false} showAxes={false} width={720} height={220} />
    </div>
  );
}

function signalChip(signal) {
  if (signal === 'Accumulate' || signal === 'Strong buy')
    return 'bg-accent-success/15 border-accent-success/30 text-accent-success';
  if (signal === 'Reduce' || signal === 'Take profit')
    return 'bg-accent-error/15 border-accent-error/30 text-accent-error';
  return 'bg-white/5 border-white/10 text-white/70';
}

function QuoteCard({ q, active, onToggle }) {
  const positive = Number(q.pct) >= 0;
  const isCrypto = q.assetClass === 'crypto';
  return (
    <div className="glass-light hover:bg-white/10 transition">
      <button
        type="button"
        onClick={() => onToggle(q)}
        className="w-full text-left p-3 flex flex-col gap-2"
        aria-expanded={active}
      >
        <div className="flex items-center gap-3">
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-white truncate">{q.symbol}</p>
            <p className="text-[11px] text-white/55 truncate">{q.name || q.exchange || q.assetClass}</p>
            {q.signal ? (
              <span className={`mt-1 chip border text-[10px] ${signalChip(q.signal)}`}>{q.signal}</span>
            ) : null}
          </div>
          <div className="hidden sm:block">
            {isCrypto ? <CryptoLiveSpark symbol={q.symbol} positive={positive} /> : <LazySpark quote={q} />}
          </div>
          <div className="text-right min-w-[6.5rem]">
            <p className="text-sm font-mono">{fmtPrice(q.price, q.currency || 'USD')}</p>
            <p className={`text-[11px] flex items-center gap-1 justify-end ${positive ? 'text-accent-success' : 'text-accent-error'}`}>
              {positive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
              {fmtPct(q.pct)}
            </p>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-1 text-[10px] text-white/60 font-mono border-t border-white/5 pt-2">
          <div><span className="text-white/40">High </span><span className="text-accent-success">{fmtPrice(q.dayHigh ?? q.high, q.currency || 'USD')}</span></div>
          <div><span className="text-white/40">Low </span><span className="text-accent-error">{fmtPrice(q.dayLow ?? q.low, q.currency || 'USD')}</span></div>
          <div className="text-right text-white/45 capitalize">{q.assetClass || 'asset'}</div>
        </div>
      </button>
      {active ? (
        <div className="border-t border-white/5 p-3 bg-ink-950/40">
          {isCrypto ? <CryptoLiveChart symbol={q.symbol} /> : <BrokerageLiveChart symbol={q.symbol} />}
          <p className="mt-2 text-[10px] text-white/45">
            Live candles via {isCrypto ? 'Binance market data' : 'primary exchange feed'}. Updates automatically.
          </p>
        </div>
      ) : null}
    </div>
  );
}

export default function LiveCoverageClient() {
  const [brokerageQuotes, setBrokerageQuotes] = useState([]);
  const [cryptoQuotes, setCryptoQuotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('all');
  const [search, setSearch] = useState('');
  const [activeSymbol, setActiveSymbol] = useState(null);
  const [refreshAt, setRefreshAt] = useState(0);
  const [feedStatus, setFeedStatus] = useState(CONNECTION_STATUS.CONNECTING);
  const [consecutiveFailures, setConsecutiveFailures] = useState(0);
  const mountedRef = useRef(true);

  const load = useCallback(async (signal) => {
    setLoading(true);
    try {
      const [bq, cq] = await Promise.all([
        fetch('/api/brokerage/quotes', { cache: 'no-store', signal }).then((r) => (r.ok ? r.json() : null)).catch(() => null),
        fetch('/api/markets', { cache: 'no-store', signal }).then((r) => (r.ok ? r.json() : null)).catch(() => null),
      ]);
      if (!mountedRef.current || signal?.aborted) return;
      if (Array.isArray(bq?.quotes)) setBrokerageQuotes(bq.quotes);
      if (Array.isArray(cq?.markets)) {
        const mapped = cq.markets.map((m) => ({
          symbol: m.symbol,
          name: m.name || m.symbol,
          price: Number(m.price) || 0,
          pct: Number(m.pct) || 0,
          dayHigh: Number(m.high) || 0,
          dayLow: Number(m.low) || 0,
          currency: 'USD',
          assetClass: 'crypto',
          exchange: 'Binance',
          signal: m.signal || (Number(m.pct) >= 1 ? 'Accumulate' : Number(m.pct) <= -1 ? 'Reduce' : 'Hold / observe'),
        }));
        setCryptoQuotes(mapped);
      }
      if (bq || cq) {
        setRefreshAt(Date.now());
        setFeedStatus(CONNECTION_STATUS.LIVE);
        setConsecutiveFailures(0);
      } else {
        throw new Error('both feeds failed');
      }
    } catch (_) {
      if (!mountedRef.current || signal?.aborted) return;
      setConsecutiveFailures((prev) => {
        const next = prev + 1;
        setFeedStatus(next >= 3 ? CONNECTION_STATUS.DISCONNECTED : CONNECTION_STATUS.DEGRADED);
        return next;
      });
    } finally {
      if (mountedRef.current && !signal?.aborted) setLoading(false);
    }
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    const ctrl = new AbortController();
    load(ctrl.signal);
    const id = setInterval(() => load(), POLL_QUOTES_MS);
    return () => {
      mountedRef.current = false;
      ctrl.abort();
      clearInterval(id);
    };
  }, [load]);

  const allQuotes = useMemo(() => {
    const merged = [...brokerageQuotes, ...cryptoQuotes];
    // Deduplicate by symbol (brokerage already has its own symbols; crypto pairs use BTCUSDT, etc.)
    const seen = new Set();
    return merged.filter((q) => {
      if (!q?.symbol) return false;
      if (seen.has(q.symbol)) return false;
      seen.add(q.symbol);
      return true;
    });
  }, [brokerageQuotes, cryptoQuotes]);

  const counts = useMemo(() => {
    const c = { all: allQuotes.length };
    for (const q of allQuotes) {
      const cls = q.assetClass || 'asset';
      c[cls] = (c[cls] || 0) + 1;
    }
    return c;
  }, [allQuotes]);

  const filtered = useMemo(() => {
    const needle = search.trim().toUpperCase();
    return allQuotes.filter((q) => {
      if (tab !== 'all' && q.assetClass !== tab) return false;
      if (!needle) return true;
      return q.symbol.toUpperCase().includes(needle) || (q.name || '').toUpperCase().includes(needle);
    });
  }, [allQuotes, tab, search]);

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10 lg:py-14 space-y-6">
      <ConnectionStatusBar status={feedStatus} lastUpdated={refreshAt || null} />
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex flex-wrap items-center gap-3 mb-1">
          <span className="chip bg-white/5 border border-white/10 text-white/80">
            <Activity className="h-3.5 w-3.5 text-accent-success" /> Live asset-class coverage
          </span>
          <ConnectionBadge status={feedStatus} lastUpdated={refreshAt || null} />
        </div>
        <h1 className="mt-3 text-3xl sm:text-4xl lg:text-5xl font-display tracking-tight">
          <span className="text-gradient-primary">{counts.all || '…'} live quotes</span> across every desk.
        </h1>
        <p className="mt-3 text-white/65 max-w-3xl">
          Real-time prices for every Oakmont Digital Markets Groups asset class: equities, ETFs, indices,
          forex, commodities, futures, and crypto. Every row is streamed from the primary exchange feed -
          no mock data, no placeholders. Tap a row to expand a live candle chart.
        </p>
      </motion.div>

      <div className="flex flex-wrap items-center gap-1.5">
        {ASSET_TAB_ORDER.map((id) => {
          const label = ASSET_TAB_LABELS[id];
          const count = counts[id] || 0;
          return (
            <button
              key={id}
              onClick={() => setTab(id)}
              className={`px-3 py-1.5 rounded-full text-xs sm:text-sm transition border ${
                tab === id
                  ? 'bg-accent-success/15 text-accent-success border-accent-success/40'
                  : 'bg-white/5 border-white/10 text-white/70 hover:bg-white/10'
              }`}
            >
              {label}{count ? ` · ${count}` : ''}
            </button>
          );
        })}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[12rem]">
          <Search className="h-4 w-4 absolute left-2 top-1/2 -translate-y-1/2 text-white/40" />
          <label htmlFor="live-coverage-search" className="sr-only">Search live market coverage</label>
          <input
            id="live-coverage-search"
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search symbol or name"
            className="w-full pl-7 pr-3 py-1.5 rounded bg-white/5 border border-white/10 text-sm focus:outline-none focus:border-accent-success/40"
          />
        </div>
        <button
          onClick={() => load()}
          disabled={loading}
          className="text-xs text-white/55 hover:text-white inline-flex items-center gap-1 disabled:opacity-50"
        >
          {loading ? <Loader2 className="h-3 w-3 animate-spin" /> : <RefreshCw className="h-3 w-3" />} Refresh
        </button>
        {refreshAt > 0 && (
          <span className="text-[10px] text-white/40">Updated {new Date(refreshAt).toLocaleTimeString()}</span>
        )}
        <Link href="/markets/signals" className="ml-auto text-xs text-accent-success hover:underline inline-flex items-center gap-1">
          Live market signals <ArrowRight className="h-3 w-3" />
        </Link>
        <Link href="/markets/candles" className="text-xs text-accent-success hover:underline inline-flex items-center gap-1">
          Candle visualisation <ArrowRight className="h-3 w-3" />
        </Link>
      </div>

      {loading && !filtered.length ? (
        <div className="glass-light p-6 text-center text-sm text-white/55 inline-flex items-center gap-2 justify-center">
          <Loader2 className="h-4 w-4 animate-spin" /> Connecting to live market feeds…
        </div>
      ) : feedStatus === CONNECTION_STATUS.DISCONNECTED && !filtered.length ? (
        <div className="glass-light p-6 text-center text-sm text-accent-error bg-accent-error/10 border border-accent-error/30 space-y-3">
          <p>Live market data is temporarily unavailable. Check your connection and retry.</p>
          <button type="button" onClick={() => load()} className="btn-ghost text-xs mx-auto">
            <RefreshCw className="h-3 w-3" /> Retry feeds
          </button>
        </div>
      ) : !filtered.length ? (
        <div className="glass-light p-6 text-center text-sm text-white/55">No live symbols match this filter.</div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2">
          {filtered.map((q) => (
            <QuoteCard
              key={q.symbol}
              q={q}
              active={activeSymbol === q.symbol}
              onToggle={() => setActiveSymbol((cur) => (cur === q.symbol ? null : q.symbol))}
            />
          ))}
        </div>
      )}

      {activeSymbol ? (
        <div className="lg:hidden fixed bottom-24 right-5 z-30">
          <button
            onClick={() => setActiveSymbol(null)}
            className="h-10 px-3 rounded-full bg-white/10 border border-white/15 text-xs text-white inline-flex items-center gap-1.5"
            aria-label="Collapse active chart"
          >
            <X className="h-3.5 w-3.5" /> Close chart
          </button>
        </div>
      ) : null}
    </div>
  );
}

'use client';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Signal, RefreshCw, Loader2, ArrowRight, ChevronDown, ChevronUp } from 'lucide-react';
import { CandlestickChart } from '@/components/ui/Charts';
import { useLiveKlines } from '@/lib/useLiveData';
import { buildMarketSignal } from '@/lib/marketSignals';

const POLL_MS = 15_000;

const FOCUS_CRYPTO = [
  'BTCUSDT', 'ETHUSDT', 'BNBUSDT', 'SOLUSDT', 'XRPUSDT', 'ADAUSDT',
  'AVAXUSDT', 'DOGEUSDT', 'LINKUSDT', 'DOTUSDT', 'MATICUSDT', 'TRXUSDT',
];

const TONE_CLASS = {
  buy: 'bg-accent-success/15 border-accent-success/30 text-accent-success',
  sell: 'bg-accent-error/15 border-accent-error/30 text-accent-error',
  neutral: 'bg-white/5 border-white/10 text-white/70',
};

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

function CryptoSignalRow({ row, expanded, onToggle }) {
  const candles = useLiveKlines(row.symbol, '15m', 96);
  const signal = useMemo(() => buildMarketSignal(candles, Number(row.pct) || 0), [candles, row.pct]);
  const last = signal.last ?? Number(row.price) ?? 0;
  const tone = signal.tone || 'neutral';
  const chartData = useMemo(
    () => candles.map((c) => ({ o: c.o, h: c.h, l: c.l, c: c.c })),
    [candles],
  );
  return (
    <SignalCard
      symbol={row.symbol}
      name={row.name || row.symbol}
      assetClass="crypto"
      price={last}
      pct={signal.pct24}
      rsi={signal.rsiVal}
      label={signal.label}
      tone={tone}
      expanded={expanded}
      onToggle={onToggle}
      chartData={chartData}
    />
  );
}

function BrokerageSignalRow({ row, expanded, onToggle }) {
  const [candles, setCandles] = useState([]);
  useEffect(() => {
    if (!expanded) return undefined;
    let cancelled = false;
    const ctrl = new AbortController();
    const tick = async () => {
      try {
        const r = await fetch(
          `/api/brokerage/chart?symbol=${encodeURIComponent(row.symbol)}&range=5d&interval=15m`,
          { cache: 'no-store', signal: ctrl.signal },
        );
        if (!r.ok) return;
        const j = await r.json();
        if (cancelled) return;
        const cs = (j?.candles || []).filter(
          (c) => Number.isFinite(c.open) && Number.isFinite(c.close),
        );
        setCandles(cs);
      } catch (_) { /* keep */ }
    };
    tick();
    const id = setInterval(tick, 15_000);
    return () => { cancelled = true; ctrl.abort(); clearInterval(id); };
  }, [expanded, row.symbol]);
  const chartData = useMemo(
    () => candles.map((c) => ({ o: c.open, h: c.high, l: c.low, c: c.close })),
    [candles],
  );
  const tone = row.signal === 'Accumulate' || row.signal === 'Strong buy'
    ? 'buy'
    : row.signal === 'Reduce' || row.signal === 'Take profit'
      ? 'sell'
      : 'neutral';
  return (
    <SignalCard
      symbol={row.symbol}
      name={row.name || row.symbol}
      assetClass={row.assetClass || 'asset'}
      price={row.price}
      pct={row.pct}
      currency={row.currency || 'USD'}
      rsi={null}
      label={row.signal}
      tone={tone}
      expanded={expanded}
      onToggle={onToggle}
      chartData={chartData}
      loadingChart={expanded && !candles.length}
    />
  );
}

function SignalCard({
  symbol, name, assetClass, price, pct, rsi, label, tone, expanded, onToggle,
  chartData, loadingChart = false, currency = 'USD',
}) {
  const positive = Number(pct) >= 0;
  return (
    <div className="glass-light overflow-hidden">
      <button
        type="button"
        onClick={onToggle}
        className="w-full text-left p-3 sm:p-4 flex items-center gap-3 hover:bg-white/5 transition"
        aria-expanded={expanded}
      >
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-white truncate">{symbol}</p>
          <p className="text-[11px] text-white/55 truncate">{name}</p>
          <div className="mt-1 flex flex-wrap gap-1.5 items-center">
            <span className={`chip border text-[10px] ${TONE_CLASS[tone] || TONE_CLASS.neutral}`}>{label || 'Hold / observe'}</span>
            <span className="chip border bg-white/5 border-white/10 text-white/55 text-[10px] capitalize">{assetClass}</span>
            {Number.isFinite(Number(rsi)) && (
              <span className="chip border bg-white/5 border-white/10 text-white/55 text-[10px] font-mono">RSI {Number(rsi).toFixed(0)}</span>
            )}
          </div>
        </div>
        <div className="text-right">
          <p className="text-sm font-mono">{fmtPrice(price, currency)}</p>
          <p className={`text-[11px] font-mono ${positive ? 'text-accent-success' : 'text-accent-error'}`}>{fmtPct(pct)}</p>
        </div>
        <span className="ml-2 text-white/40">
          {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </span>
      </button>
      {expanded ? (
        <div className="border-t border-white/5 p-3 bg-ink-950/40">
          {loadingChart ? (
            <div className="h-56 flex items-center justify-center text-sm text-white/55">
              <Loader2 className="h-4 w-4 animate-spin mr-2" /> Loading live candles…
            </div>
          ) : chartData.length ? (
            <div className="h-56">
              <CandlestickChart data={chartData} animate={false} showAxes={false} width={720} height={220} />
            </div>
          ) : (
            <div className="h-56 flex items-center justify-center text-sm text-white/45">
              Live candles unavailable.
            </div>
          )}
          <p className="mt-2 text-[10px] text-white/45">
            Signal computed in real time from streaming candles using RSI + 12/26 SMA cross.
          </p>
        </div>
      ) : null}
    </div>
  );
}

export default function MarketSignalsClient() {
  const [brokerage, setBrokerage] = useState([]);
  const [cryptoMeta, setCryptoMeta] = useState({});
  const [loading, setLoading] = useState(true);
  const [scope, setScope] = useState('all'); // all | crypto | multi
  const [tone, setTone] = useState('all'); // all | buy | sell | neutral
  const [openSymbol, setOpenSymbol] = useState(null);
  const [refreshAt, setRefreshAt] = useState(0);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [bq, cq] = await Promise.all([
        fetch('/api/brokerage/quotes', { cache: 'no-store' }).then((r) => (r.ok ? r.json() : null)).catch(() => null),
        fetch('/api/markets', { cache: 'no-store' }).then((r) => (r.ok ? r.json() : null)).catch(() => null),
      ]);
      if (Array.isArray(bq?.quotes)) setBrokerage(bq.quotes);
      if (Array.isArray(cq?.markets)) {
        const map = {};
        for (const m of cq.markets) {
          map[m.symbol] = { name: m.name || m.symbol, price: Number(m.price) || 0, pct: Number(m.pct) || 0 };
        }
        setCryptoMeta(map);
      }
      setRefreshAt(Date.now());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    const id = setInterval(load, POLL_MS);
    return () => clearInterval(id);
  }, [load]);

  const cryptoRows = useMemo(
    () => FOCUS_CRYPTO.map((sym) => ({ symbol: sym, ...(cryptoMeta[sym] || { name: sym, price: 0, pct: 0 }) })),
    [cryptoMeta],
  );

  // Pre-filter brokerage rows: skip 'Hold / observe' if user filtered to active signals.
  const filteredBrokerage = useMemo(() => {
    return brokerage.filter((q) => {
      if (tone === 'all') return true;
      const t = q.signal === 'Accumulate' || q.signal === 'Strong buy'
        ? 'buy'
        : q.signal === 'Reduce' || q.signal === 'Take profit'
          ? 'sell'
          : 'neutral';
      return t === tone;
    });
  }, [brokerage, tone]);

  const showCrypto = scope === 'all' || scope === 'crypto';
  const showBrokerage = scope === 'all' || scope === 'multi';

  const stats = useMemo(() => {
    const all = brokerage;
    const buy = all.filter((q) => q.signal === 'Accumulate' || q.signal === 'Strong buy').length;
    const sell = all.filter((q) => q.signal === 'Reduce' || q.signal === 'Take profit').length;
    return { total: all.length, buy, sell };
  }, [brokerage]);

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10 lg:py-14 space-y-6">
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
        <span className="chip bg-white/5 border border-white/10 text-white/80">
          <Signal className="h-3.5 w-3.5 text-accent-success" /> Visible live market signals
        </span>
        <h1 className="mt-3 text-3xl sm:text-4xl lg:text-5xl font-display tracking-tight">
          <span className="text-gradient-primary">Real-time signals</span>, computed from live candles.
        </h1>
        <p className="mt-3 text-white/65 max-w-3xl">
          Every Oakmont Digital Markets Groups signal is derived in real time from the same candle stream
          our desks trade. RSI, 12/26 SMA cross and 24h drift are recomputed on every tick - no static
          recommendations, no placeholders. Expand any symbol to see the live candles behind the call.
        </p>
        <div className="mt-4 flex flex-wrap gap-2 text-xs text-white/65">
          <span className="chip bg-white/5 border border-white/10">{stats.total} multi-asset signals</span>
          <span className="chip bg-accent-success/15 border border-accent-success/30 text-accent-success">{stats.buy} buy</span>
          <span className="chip bg-accent-error/15 border border-accent-error/30 text-accent-error">{stats.sell} sell</span>
          <span className="chip bg-white/5 border border-white/10">{FOCUS_CRYPTO.length} live crypto streams</span>
        </div>
      </motion.div>

      <div className="flex flex-wrap gap-2 items-center">
        <div className="flex gap-1.5">
          {['all', 'crypto', 'multi'].map((id) => (
            <button
              key={id}
              onClick={() => setScope(id)}
              className={`px-3 py-1.5 rounded-full text-xs sm:text-sm transition border ${
                scope === id
                  ? 'bg-accent-success/15 text-accent-success border-accent-success/40'
                  : 'bg-white/5 border-white/10 text-white/70 hover:bg-white/10'
              }`}
            >
              {id === 'all' ? 'All' : id === 'crypto' ? 'Crypto' : 'Multi-asset'}
            </button>
          ))}
        </div>
        <div className="flex gap-1.5">
          {['all', 'buy', 'sell', 'neutral'].map((id) => (
            <button
              key={id}
              onClick={() => setTone(id)}
              className={`px-3 py-1.5 rounded-full text-xs sm:text-sm transition border capitalize ${
                tone === id
                  ? 'bg-white/15 text-white border-white/30'
                  : 'bg-white/5 border-white/10 text-white/60 hover:bg-white/10'
              }`}
            >
              {id === 'all' ? 'Any signal' : id}
            </button>
          ))}
        </div>
        <button
          onClick={load}
          disabled={loading}
          className="ml-auto text-xs text-white/55 hover:text-white inline-flex items-center gap-1 disabled:opacity-50"
        >
          {loading ? <Loader2 className="h-3 w-3 animate-spin" /> : <RefreshCw className="h-3 w-3" />} Refresh
        </button>
        {refreshAt > 0 && (
          <span className="text-[10px] text-white/40">Updated {new Date(refreshAt).toLocaleTimeString()}</span>
        )}
        <Link href="/markets/live" className="text-xs text-accent-success hover:underline inline-flex items-center gap-1">
          Live asset-class coverage <ArrowRight className="h-3 w-3" />
        </Link>
      </div>

      {showCrypto && (
        <section className="space-y-3">
          <h2 className="text-sm uppercase tracking-wider text-white/55">Crypto · real-time candle signals</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2">
            {cryptoRows
              .filter(() => true)
              .map((row) => (
                <CryptoSignalRow
                  key={row.symbol}
                  row={row}
                  expanded={openSymbol === row.symbol}
                  onToggle={() => setOpenSymbol((cur) => (cur === row.symbol ? null : row.symbol))}
                />
              ))}
          </div>
        </section>
      )}

      {showBrokerage && (
        <section className="space-y-3">
          <h2 className="text-sm uppercase tracking-wider text-white/55">
            Multi-asset · {filteredBrokerage.length} signals
          </h2>
          {loading && !filteredBrokerage.length ? (
            <div className="glass-light p-6 text-center text-sm text-white/55 inline-flex items-center gap-2 justify-center">
              <Loader2 className="h-4 w-4 animate-spin" /> Loading live signals…
            </div>
          ) : !filteredBrokerage.length ? (
            <div className="glass-light p-6 text-center text-sm text-white/55">
              No signals match this filter.
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2">
              {filteredBrokerage.map((q) => (
                <BrokerageSignalRow
                  key={q.symbol}
                  row={q}
                  expanded={openSymbol === q.symbol}
                  onToggle={() => setOpenSymbol((cur) => (cur === q.symbol ? null : q.symbol))}
                />
              ))}
            </div>
          )}
        </section>
      )}
    </div>
  );
}

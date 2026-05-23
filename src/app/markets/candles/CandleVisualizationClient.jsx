'use client';
import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  CandlestickChart as CandlestickIcon, ArrowRight, RefreshCw, Loader2, Signal,
} from 'lucide-react';
import { CandlestickChart } from '@/components/ui/Charts';
import { useLiveKlines, useLivePricesWithStatus, SYMBOL_META, DEFAULT_TICKER_SYMBOLS, CONNECTION_STATUS } from '@/lib/useLiveData';
import { ConnectionBadge, StaleDataOverlay } from '@/components/ui/ConnectionStatus';
import { buildMarketSignal } from '@/lib/marketSignals';

const INTERVALS = [
  { value: '1m', label: '1m' },
  { value: '5m', label: '5m' },
  { value: '15m', label: '15m' },
  { value: '1h', label: '1H' },
  { value: '4h', label: '4H' },
  { value: '1d', label: '1D' },
  { value: '1w', label: '1W' },
];

const CRYPTO_SYMBOLS = DEFAULT_TICKER_SYMBOLS.slice(0, 12);

function fmtPrice(v) {
  const n = Number(v);
  if (!Number.isFinite(n)) return '-';
  const abs = Math.abs(n);
  const digits = abs >= 1000 ? 2 : abs >= 1 ? 2 : abs >= 0.01 ? 4 : 6;
  return n.toLocaleString('en-US', { minimumFractionDigits: digits, maximumFractionDigits: digits });
}

function fmtPct(v) {
  const n = Number(v);
  if (!Number.isFinite(n)) return '-';
  return `${n >= 0 ? '+' : ''}${n.toFixed(2)}%`;
}

function LiveCandlePanel({ pair, interval }) {
  const candles = useLiveKlines(pair, interval, 100);
  const chartData = useMemo(
    () => candles.map((c) => ({ o: c.o, h: c.h, l: c.l, c: c.c })),
    [candles],
  );
  const signal = useMemo(() => buildMarketSignal(candles, 0), [candles]);
  const isStale = candles.length > 0 && candles[0].live === false;

  if (!chartData.length) {
    return (
      <div className="h-64 sm:h-80 flex items-center justify-center text-sm text-white/55">
        <Loader2 className="h-4 w-4 animate-spin mr-2" /> Streaming live candles…
      </div>
    );
  }

  return (
    <StaleDataOverlay isStale={isStale} className="space-y-2">
      <div className="h-64 sm:h-80">
        <CandlestickChart data={chartData} animate={false} showAxes responsive />
      </div>
      <div className="flex flex-wrap gap-2 text-[10px] text-white/60">
        {signal.label && (
          <span className={`chip border ${
            signal.tone === 'buy' ? 'bg-accent-success/15 border-accent-success/30 text-accent-success'
            : signal.tone === 'sell' ? 'bg-accent-error/15 border-accent-error/30 text-accent-error'
            : 'bg-white/5 border-white/10 text-white/70'
          }`}>{signal.label}</span>
        )}
        {Number.isFinite(signal.rsiVal) && (
          <span className="chip border bg-white/5 border-white/10 text-white/55 font-mono">RSI {signal.rsiVal.toFixed(0)}</span>
        )}
        <span className="chip border bg-white/5 border-white/10 text-white/55 font-mono">
          SMA 12: {signal.fast ? fmtPrice(signal.fast) : '-'} / 26: {signal.slow ? fmtPrice(signal.slow) : '-'}
        </span>
      </div>
    </StaleDataOverlay>
  );
}

function BrokerageCandlePanel({ symbol, interval }) {
  const [candles, setCandles] = useState(null);
  const [isStale, setIsStale] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const ctrl = new AbortController();
    let failCount = 0;

    const rangeMap = { '1m': '1d', '5m': '5d', '15m': '5d', '1h': '1mo', '4h': '3mo', '1d': '6mo', '1w': '1y' };
    const range = rangeMap[interval] || '1mo';

    const tick = async () => {
      try {
        const r = await fetch(
          `/api/brokerage/chart?symbol=${encodeURIComponent(symbol)}&range=${range}&interval=${interval}`,
          { cache: 'no-store', signal: ctrl.signal },
        );
        if (!r.ok) throw new Error('chart fetch fail');
        const j = await r.json();
        if (cancelled) return;
        const out = (j?.candles || [])
          .filter((c) => Number.isFinite(c.open) && Number.isFinite(c.close))
          .map((c) => ({ o: c.open, h: c.high, l: c.low, c: c.close }));
        setCandles(out);
        setIsStale(false);
        failCount = 0;
      } catch (_) {
        failCount++;
        if (failCount > 2) setIsStale(true);
      }
    };
    tick();
    const id = setInterval(tick, 15_000);
    return () => { cancelled = true; ctrl.abort(); clearInterval(id); };
  }, [symbol, interval]);

  if (!candles) {
    return (
      <div className="h-64 sm:h-80 flex items-center justify-center text-sm text-white/55">
        <Loader2 className="h-4 w-4 animate-spin mr-2" /> Loading live candles…
      </div>
    );
  }
  if (!candles.length) {
    return <div className="h-64 sm:h-80 flex items-center justify-center text-sm text-white/45">Live candles unavailable for this interval.</div>;
  }
  return (
    <StaleDataOverlay isStale={isStale}>
      <div className="h-64 sm:h-80">
        <CandlestickChart data={candles} animate={false} showAxes responsive />
      </div>
    </StaleDataOverlay>
  );
}

export default function CandleVisualizationClient() {
  const [selectedPair, setSelectedPair] = useState('BTCUSDT');
  const [interval, setInterval] = useState('15m');
  const [mode, setMode] = useState('crypto'); // crypto | brokerage
  const [brokerageSymbol, setBrokerageSymbol] = useState('AAPL');
  const [brokerageList, setBrokerageList] = useState([]);

  const { data: prices, status, lastUpdated } = useLivePricesWithStatus(CRYPTO_SYMBOLS);
  const meta = SYMBOL_META[selectedPair] || { sym: selectedPair.replace('USDT', ''), name: selectedPair, color: '#b8862b' };
  const pxData = prices[selectedPair];

  // Load brokerage symbols
  useEffect(() => {
    fetch('/api/brokerage/universe', { cache: 'no-store' })
      .then((r) => r.ok ? r.json() : null)
      .then((j) => {
        if (!j?.universe) return;
        const all = Object.values(j.universe).flat().map((i) => i.symbol);
        setBrokerageList(all.slice(0, 30));
      })
      .catch(() => {});
  }, []);

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10 lg:py-14 space-y-6">
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex flex-wrap items-center gap-3 mb-3">
          <span className="chip bg-white/5 border border-white/10 text-white/80">
            <CandlestickIcon className="h-3.5 w-3.5 text-accent-success" /> Live candle visualisation
          </span>
          <ConnectionBadge status={status} lastUpdated={lastUpdated} />
        </div>
        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-display tracking-tight">
          <span className="text-gradient-primary">Live OHLCV candles</span>, streamed in real time.
        </h1>
        <p className="mt-3 text-white/65 max-w-3xl">
          Full-screen candle visualisation for any Oakmont Digital Markets Groups instrument.
          Charts update automatically from live exchange feeds - Binance for crypto, primary
          exchange for equities, forex, and commodities. No mock data.
        </p>
      </motion.div>

      {/* Mode selector */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex gap-1.5">
          {[{ id: 'crypto', label: 'Crypto' }, { id: 'brokerage', label: 'Multi-asset' }].map((m) => (
            <button
              key={m.id}
              onClick={() => setMode(m.id)}
              className={`px-3 py-1.5 rounded-full text-xs sm:text-sm transition border ${
                mode === m.id
                  ? 'bg-accent-success/15 text-accent-success border-accent-success/40'
                  : 'bg-white/5 border-white/10 text-white/70 hover:bg-white/10'
              }`}
            >
              {m.label}
            </button>
          ))}
        </div>

        {/* Interval selector */}
        <div className="flex gap-1 ml-auto">
          {INTERVALS.map((iv) => (
            <button
              key={iv.value}
              onClick={() => setInterval(iv.value)}
              className={`px-2 py-1 rounded text-[11px] sm:text-xs transition border ${
                interval === iv.value
                  ? 'bg-white/15 text-white border-white/30'
                  : 'bg-white/5 border-white/10 text-white/60 hover:bg-white/10'
              }`}
            >
              {iv.label}
            </button>
          ))}
        </div>
      </div>

      {/* Symbol selector */}
      <div className="flex flex-wrap gap-1.5">
        {mode === 'crypto' ? (
          CRYPTO_SYMBOLS.map((pair) => {
            const m = SYMBOL_META[pair] || { sym: pair.replace('USDT', '') };
            return (
              <button
                key={pair}
                onClick={() => setSelectedPair(pair)}
                className={`px-2.5 py-1 rounded-lg text-xs transition border ${
                  selectedPair === pair
                    ? 'bg-accent-success/15 text-accent-success border-accent-success/40'
                    : 'bg-white/5 border-white/10 text-white/70 hover:bg-white/10'
                }`}
              >
                {m.sym}
              </button>
            );
          })
        ) : (
          <select
            value={brokerageSymbol}
            onChange={(e) => setBrokerageSymbol(e.target.value)}
            className="field-control text-sm max-w-xs"
          >
            {brokerageList.map((s) => (
              <option key={s} value={s} className="bg-ink-900">{s}</option>
            ))}
          </select>
        )}
      </div>

      {/* Chart header with live price */}
      <div className="glass-light card-pad-lg">
        <div className="flex items-center gap-3 mb-4">
          <div className="h-10 w-10 rounded-full flex items-center justify-center" style={{ background: `${meta.color}20`, border: `1px solid ${meta.color}40` }}>
            <span className="text-sm font-bold" style={{ color: meta.color }}>{meta.sym?.charAt(0)}</span>
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-lg font-semibold text-white truncate">
              {mode === 'crypto' ? meta.name : brokerageSymbol}
            </h2>
            <p className="text-xs text-white/55">
              {mode === 'crypto' ? `${meta.sym}/USDT · Binance` : `${brokerageSymbol} · Exchange feed`}
            </p>
          </div>
          {mode === 'crypto' && pxData && (
            <div className="text-right">
              <p className="text-lg font-mono">${fmtPrice(pxData.price)}</p>
              <p className={`text-xs font-mono ${pxData.pct >= 0 ? 'text-accent-success' : 'text-accent-error'}`}>
                {fmtPct(pxData.pct)}
              </p>
            </div>
          )}
        </div>

        {/* Live candle chart */}
        {mode === 'crypto' ? (
          <LiveCandlePanel pair={selectedPair} interval={interval} />
        ) : (
          <BrokerageCandlePanel symbol={brokerageSymbol} interval={interval} />
        )}
      </div>

      {/* Navigation links */}
      <div className="flex flex-wrap gap-3 text-xs">
        <Link href="/markets/live" className="text-accent-success hover:underline inline-flex items-center gap-1">
          Live asset-class coverage <ArrowRight className="h-3 w-3" />
        </Link>
        <Link href="/markets/signals" className="text-accent-success hover:underline inline-flex items-center gap-1">
          Live market signals <ArrowRight className="h-3 w-3" />
        </Link>
      </div>
    </div>
  );
}

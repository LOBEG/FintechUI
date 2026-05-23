'use client';
import { useCallback, useEffect, useRef, useState } from 'react';

// --- Symbol metadata (display name & brand color) ---
export const SYMBOL_META = {
  BTCUSDT:  { sym: 'BTC',   name: 'Bitcoin',    color: '#06d6c4' },
  ETHUSDT:  { sym: 'ETH',   name: 'Ethereum',   color: '#627eea' },
  SOLUSDT:  { sym: 'SOL',   name: 'Solana',     color: '#14f195' },
  XRPUSDT:  { sym: 'XRP',   name: 'XRP',        color: '#23292f' },
  BNBUSDT:  { sym: 'BNB',   name: 'BNB',        color: '#00c98b' },
  ADAUSDT:  { sym: 'ADA',   name: 'Cardano',    color: '#0033ad' },
  DOGEUSDT: { sym: 'DOGE',  name: 'Dogecoin',   color: '#38bdf8' },
  AVAXUSDT: { sym: 'AVAX',  name: 'Avalanche',  color: '#e84142' },
  LTCUSDT:  { sym: 'LTC',   name: 'Litecoin',   color: '#345d9d' },
  TRXUSDT:  { sym: 'TRX',   name: 'TRON',       color: '#ef0027' },
  DOTUSDT:  { sym: 'DOT',   name: 'Polkadot',   color: '#e6007a' },
  LINKUSDT: { sym: 'LINK',  name: 'Chainlink',  color: '#2a5ada' },
  MATICUSDT:{ sym: 'MATIC', name: 'Polygon',    color: '#8247e5' },
  TONUSDT:  { sym: 'TON',   name: 'Toncoin',    color: '#0098ea' },
  ATOMUSDT: { sym: 'ATOM',  name: 'Cosmos',     color: '#2e3148' },
  NEARUSDT: { sym: 'NEAR',  name: 'NEAR',       color: '#00ec97' },
  APTUSDT:  { sym: 'APT',   name: 'Aptos',      color: '#00d4aa' },
  ARBUSDT:  { sym: 'ARB',   name: 'Arbitrum',   color: '#28a0f0' },
  OPUSDT:   { sym: 'OP',    name: 'Optimism',   color: '#ff0420' },
  SUIUSDT:  { sym: 'SUI',   name: 'Sui',        color: '#6fbcf0' },
  FILUSDT:  { sym: 'FIL',   name: 'Filecoin',   color: '#0090ff' },
  INJUSDT:  { sym: 'INJ',   name: 'Injective',  color: '#00f2fe' },
  SHIBUSDT: { sym: 'SHIB',  name: 'Shiba Inu',  color: '#f00500' },
  PEPEUSDT: { sym: 'PEPE',  name: 'Pepe',       color: '#479f53' },
  BCHUSDT:  { sym: 'BCH',   name: 'Bitcoin Cash', color: '#8dc351' },
  ETCUSDT:  { sym: 'ETC',   name: 'Ethereum Classic', color: '#328332' },
  XLMUSDT:  { sym: 'XLM',   name: 'Stellar',    color: '#14b6e7' },
  ALGOUSDT: { sym: 'ALGO',  name: 'Algorand',   color: '#ffffff' },
  HBARUSDT: { sym: 'HBAR',  name: 'Hedera',     color: '#ffffff' },
};

export const DEFAULT_TICKER_SYMBOLS = [
  'BTCUSDT', 'ETHUSDT', 'SOLUSDT', 'XRPUSDT',
  'BNBUSDT', 'ADAUSDT', 'DOGEUSDT', 'AVAXUSDT',
  'LTCUSDT', 'TRXUSDT', 'DOTUSDT', 'LINKUSDT',
  'MATICUSDT', 'TONUSDT', 'ATOMUSDT', 'NEARUSDT',
  'APTUSDT', 'ARBUSDT', 'OPUSDT', 'SUIUSDT',
  'FILUSDT', 'INJUSDT', 'SHIBUSDT', 'PEPEUSDT',
  'BCHUSDT', 'ETCUSDT', 'XLMUSDT', 'ALGOUSDT',
  'HBARUSDT',
];

// All Binance traffic is proxied through our own /api/markets/* routes
// so the browser never hits api.binance.com directly. Binance refuses
// requests from a number of IPs (notably US), so the server can be pointed
// at another Binance-compatible base URL by env.
const PROXY_BASE = '/api/markets';
const POLL_MS = 5000;
const KLINE_POLL_MS = 10_000;

// Exponential backoff config for retry on failures
const BACKOFF_BASE_MS = 2000;
const BACKOFF_MAX_MS = 30000;
const MAX_RETRIES = 5;

// Connection status constants
export const CONNECTION_STATUS = {
  CONNECTING: 'connecting',
  LIVE: 'live',
  DEGRADED: 'degraded',
  DISCONNECTED: 'disconnected',
};

// Stale data threshold (30s without successful update = stale)
const STALE_THRESHOLD_MS = 30_000;

function isBrowser() {
  return typeof window !== 'undefined';
}

function getBackoffDelay(failures) {
  const delay = Math.min(BACKOFF_BASE_MS * Math.pow(2, failures), BACKOFF_MAX_MS);
  // Add jitter ±20%
  return delay * (0.8 + Math.random() * 0.4);
}

/**
 * Subscribe to live 24h ticker for one or more symbols.
 * Returns: { data, status, lastUpdated, isStale }
 * data: { [SYMBOL]: { price, pct, open, high, low, vol, live } }
 */
export function useLivePrices(symbols = DEFAULT_TICKER_SYMBOLS) {
  const symbolsKey = symbols.join(',');
  const [data, setData] = useState({});
  const [status, setStatus] = useState(CONNECTION_STATUS.CONNECTING);
  const [lastUpdated, setLastUpdated] = useState(null);
  const failuresRef = useRef(0);
  const timerRef = useRef(null);
  const cancelledRef = useRef(false);

  useEffect(() => {
    if (!isBrowser()) return;
    cancelledRef.current = false;
    failuresRef.current = 0;
    setStatus(CONNECTION_STATUS.CONNECTING);

    const schedule = (delay) => {
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(tick, delay);
    };

    const tick = async () => {
      if (cancelledRef.current) return;
      try {
        const qs = encodeURIComponent(JSON.stringify(symbols));
        const res = await fetch(`${PROXY_BASE}/ticker?symbols=${qs}`, { cache: 'no-store' });
        if (!res.ok) throw new Error('ticker proxy fail');
        const arr = await res.json();
        if (cancelledRef.current || !Array.isArray(arr) || !arr.length) {
          schedule(POLL_MS);
          return;
        }
        setData((prev) => {
          const next = { ...prev };
          for (const t of arr) {
            next[t.symbol] = {
              price: parseFloat(t.lastPrice),
              pct: parseFloat(t.priceChangePercent),
              open: parseFloat(t.openPrice),
              high: parseFloat(t.highPrice),
              low: parseFloat(t.lowPrice),
              vol: parseFloat(t.volume),
              quoteVol: parseFloat(t.quoteVolume),
              live: true,
            };
          }
          return next;
        });
        failuresRef.current = 0;
        setStatus(CONNECTION_STATUS.LIVE);
        setLastUpdated(Date.now());
        schedule(POLL_MS);
      } catch (_) {
        failuresRef.current += 1;
        if (failuresRef.current >= MAX_RETRIES) {
          setStatus(CONNECTION_STATUS.DISCONNECTED);
        } else {
          setStatus(CONNECTION_STATUS.DEGRADED);
        }
        // Mark existing data as potentially stale but keep it
        setData((prev) => {
          const next = { ...prev };
          for (const key of Object.keys(next)) {
            next[key] = { ...next[key], live: false };
          }
          return next;
        });
        const backoff = getBackoffDelay(failuresRef.current);
        schedule(backoff);
      }
    };

    tick();
    return () => {
      cancelledRef.current = true;
      if (timerRef.current) clearTimeout(timerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [symbolsKey]);

  const isStale = lastUpdated ? (Date.now() - lastUpdated) > STALE_THRESHOLD_MS : false;

  return data;
}

/**
 * Enhanced live prices hook that also exposes connection metadata.
 * Use this when you need to display connection status or stale indicators.
 */
export function useLivePricesWithStatus(symbols = DEFAULT_TICKER_SYMBOLS) {
  const symbolsKey = symbols.join(',');
  const [data, setData] = useState({});
  const [status, setStatus] = useState(CONNECTION_STATUS.CONNECTING);
  const [lastUpdated, setLastUpdated] = useState(null);
  const failuresRef = useRef(0);
  const timerRef = useRef(null);
  const cancelledRef = useRef(false);

  useEffect(() => {
    if (!isBrowser()) return;
    cancelledRef.current = false;
    failuresRef.current = 0;
    setStatus(CONNECTION_STATUS.CONNECTING);

    const schedule = (delay) => {
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(tick, delay);
    };

    const tick = async () => {
      if (cancelledRef.current) return;
      try {
        const qs = encodeURIComponent(JSON.stringify(symbols));
        const res = await fetch(`${PROXY_BASE}/ticker?symbols=${qs}`, { cache: 'no-store' });
        if (!res.ok) throw new Error('ticker proxy fail');
        const arr = await res.json();
        if (cancelledRef.current || !Array.isArray(arr) || !arr.length) {
          schedule(POLL_MS);
          return;
        }
        setData((prev) => {
          const next = { ...prev };
          for (const t of arr) {
            next[t.symbol] = {
              price: parseFloat(t.lastPrice),
              pct: parseFloat(t.priceChangePercent),
              open: parseFloat(t.openPrice),
              high: parseFloat(t.highPrice),
              low: parseFloat(t.lowPrice),
              vol: parseFloat(t.volume),
              quoteVol: parseFloat(t.quoteVolume),
              live: true,
            };
          }
          return next;
        });
        failuresRef.current = 0;
        setStatus(CONNECTION_STATUS.LIVE);
        setLastUpdated(Date.now());
        schedule(POLL_MS);
      } catch (_) {
        failuresRef.current += 1;
        if (failuresRef.current >= MAX_RETRIES) {
          setStatus(CONNECTION_STATUS.DISCONNECTED);
        } else {
          setStatus(CONNECTION_STATUS.DEGRADED);
        }
        setData((prev) => {
          const next = { ...prev };
          for (const key of Object.keys(next)) {
            next[key] = { ...next[key], live: false };
          }
          return next;
        });
        const backoff = getBackoffDelay(failuresRef.current);
        schedule(backoff);
      }
    };

    tick();
    return () => {
      cancelledRef.current = true;
      if (timerRef.current) clearTimeout(timerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [symbolsKey]);

  const isStale = lastUpdated ? (Date.now() - lastUpdated) > STALE_THRESHOLD_MS : !lastUpdated;

  return { data, status, lastUpdated, isStale };
}

/**
 * Real-time candlesticks (klines) for a single symbol via Binance.
 * Includes retry/backoff logic for resilient polling.
 * @param {string} symbol  e.g. 'BTCUSDT'
 * @param {string} interval e.g. '1m','5m','15m','1h','4h','1d','1w'
 * @param {number} limit candles to fetch from REST
 */
export function useLiveKlines(symbol = 'BTCUSDT', interval = '5m', limit = 60) {
  const [candles, setCandles] = useState([]);
  const failuresRef = useRef(0);
  const timerRef = useRef(null);
  const cancelledRef = useRef(false);

  useEffect(() => {
    if (!isBrowser()) return;
    cancelledRef.current = false;
    failuresRef.current = 0;

    const schedule = (delay) => {
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(tick, delay);
    };

    const tick = async () => {
      if (cancelledRef.current) return;
      try {
        const url = `${PROXY_BASE}/klines?symbol=${symbol}&interval=${interval}&limit=${limit}`;
        const res = await fetch(url, { cache: 'no-store' });
        if (!res.ok) throw new Error('klines proxy fail');
        const arr = await res.json();
        if (cancelledRef.current || !Array.isArray(arr) || !arr.length) {
          schedule(KLINE_POLL_MS);
          return;
        }
        const next = arr.map((k) => ({
          t: k[0],
          o: parseFloat(k[1]),
          h: parseFloat(k[2]),
          l: parseFloat(k[3]),
          c: parseFloat(k[4]),
          v: parseFloat(k[5]),
          live: true,
          updatedAt: Date.now(),
        }));
        setCandles(next);
        failuresRef.current = 0;
        schedule(KLINE_POLL_MS);
      } catch (_) {
        failuresRef.current += 1;
        // Mark existing candles as stale but keep them
        setCandles((prev) => prev.length ? prev.map((c) => ({ ...c, live: false })) : prev);
        const backoff = getBackoffDelay(failuresRef.current);
        schedule(backoff);
      }
    };

    tick();
    return () => {
      cancelledRef.current = true;
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [symbol, interval, limit]);

  return candles;
}

/**
 * Helper: derive a sparkline series (closes) from kline data.
 */
export function klineCloses(candles) {
  return candles.map((k) => k.c);
}

/**
 * Connection status badge component helper.
 * Returns className + label for UI rendering.
 */
export function getConnectionStatusDisplay(status) {
  switch (status) {
    case CONNECTION_STATUS.LIVE:
      return { className: 'text-accent-success', dotClass: 'bg-accent-success', label: 'Live' };
    case CONNECTION_STATUS.DEGRADED:
      return { className: 'text-amber-400', dotClass: 'bg-amber-400', label: 'Reconnecting' };
    case CONNECTION_STATUS.DISCONNECTED:
      return { className: 'text-red-400', dotClass: 'bg-red-400', label: 'Disconnected' };
    default:
      return { className: 'text-white/50', dotClass: 'bg-white/50', label: 'Connecting' };
  }
}

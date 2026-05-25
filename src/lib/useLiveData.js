'use client';
import { useEffect, useRef, useState } from 'react';
import { getStream, buildTickerStreamUrl, buildKlineStreamUrl, WS_STATE } from './wsManager';

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

// REST fallback proxy base
const PROXY_BASE = '/api/markets';
const FALLBACK_POLL_MS = 15000;
const KLINE_FALLBACK_POLL_MS = 30000;

// Connection status constants (preserved for consumers)
export const CONNECTION_STATUS = {
  CONNECTING: 'connecting',
  LIVE: 'live',
  DEGRADED: 'degraded',
  DISCONNECTED: 'disconnected',
};

// Stale data threshold
const STALE_THRESHOLD_MS = 30_000;

function isBrowser() {
  return typeof window !== 'undefined';
}

// Map WS_STATE to CONNECTION_STATUS for compatibility
function mapWsState(wsState, hasFailed) {
  if (hasFailed) return CONNECTION_STATUS.DISCONNECTED;
  switch (wsState) {
    case WS_STATE.OPEN: return CONNECTION_STATUS.LIVE;
    case WS_STATE.CONNECTING: return CONNECTION_STATUS.CONNECTING;
    case WS_STATE.RECONNECTING: return CONNECTION_STATUS.DEGRADED;
    default: return CONNECTION_STATUS.CONNECTING;
  }
}

/**
 * Parse Binance 24hr ticker WebSocket message into our normalised format.
 */
function parseTickerWsMessage(msg) {
  // Combined stream wraps in { stream, data }
  const ticker = msg.data || msg;
  if (!ticker.s) return null;
  return {
    symbol: ticker.s,
    price: parseFloat(ticker.c),
    pct: parseFloat(ticker.P),
    open: parseFloat(ticker.o),
    high: parseFloat(ticker.h),
    low: parseFloat(ticker.l),
    vol: parseFloat(ticker.v),
    quoteVol: parseFloat(ticker.q),
    live: true,
  };
}

/**
 * REST fallback fetcher for ticker data.
 */
async function fetchTickerRest(symbols) {
  const qs = encodeURIComponent(JSON.stringify(symbols));
  const res = await fetch(`${PROXY_BASE}/ticker?symbols=${qs}`, { cache: 'no-store' });
  if (!res.ok) throw new Error('ticker proxy fail');
  const arr = await res.json();
  if (!Array.isArray(arr)) throw new Error('invalid response');
  const result = {};
  for (const t of arr) {
    result[t.symbol] = {
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
  return result;
}

/**
 * REST fallback fetcher for kline data.
 */
async function fetchKlinesRest(symbol, interval, limit) {
  const url = `${PROXY_BASE}/klines?symbol=${symbol}&interval=${interval}&limit=${limit}`;
  const res = await fetch(url, { cache: 'no-store' });
  if (!res.ok) throw new Error('klines proxy fail');
  const arr = await res.json();
  if (!Array.isArray(arr)) throw new Error('invalid response');
  return arr.map((k) => ({
    t: k[0],
    o: parseFloat(k[1]),
    h: parseFloat(k[2]),
    l: parseFloat(k[3]),
    c: parseFloat(k[4]),
    v: parseFloat(k[5]),
    live: true,
    updatedAt: Date.now(),
  }));
}

/**
 * Subscribe to live 24h ticker for one or more symbols via WebSocket.
 * Falls back to REST polling if WebSocket fails.
 * Returns: { [SYMBOL]: { price, pct, open, high, low, vol, live } }
 */
export function useLivePrices(symbols = DEFAULT_TICKER_SYMBOLS) {
  const symbolsKey = symbols.join(',');
  const [data, setData] = useState({});
  const mountedRef = useRef(true);
  const fallbackTimerRef = useRef(null);
  const wsFailedRef = useRef(false);
  const initialFetchDoneRef = useRef(false);

  useEffect(() => {
    if (!isBrowser()) return;
    mountedRef.current = true;
    wsFailedRef.current = false;
    initialFetchDoneRef.current = false;

    // Initial REST fetch for immediate data while WS connects
    const doInitialFetch = async () => {
      try {
        const result = await fetchTickerRest(symbols);
        if (mountedRef.current && !initialFetchDoneRef.current) {
          initialFetchDoneRef.current = true;
          setData(result);
        }
      } catch (_) {
        // Will be populated by WS
      }
    };
    doInitialFetch();

    // WebSocket streaming
    const streamKey = `ticker:${symbolsKey}`;
    const streamUrl = buildTickerStreamUrl(symbols);
    const stream = getStream(streamKey, streamUrl);

    const unsubscribe = stream.subscribe((event) => {
      if (!mountedRef.current) return;

      if (event.type === 'data') {
        const parsed = parseTickerWsMessage(event.data);
        if (parsed) {
          setData((prev) => ({
            ...prev,
            [parsed.symbol]: parsed,
          }));
        }
      } else if (event.type === 'failed') {
        // WebSocket permanently failed, start REST fallback
        wsFailedRef.current = true;
        startFallbackPolling();
      }
    });

    // REST fallback polling (only activates if WS fails)
    const startFallbackPolling = () => {
      if (fallbackTimerRef.current) return;
      const poll = async () => {
        if (!mountedRef.current) return;
        try {
          const result = await fetchTickerRest(symbols);
          if (mountedRef.current) {
            setData((prev) => ({ ...prev, ...result }));
          }
        } catch (_) {}
        if (mountedRef.current && wsFailedRef.current) {
          fallbackTimerRef.current = setTimeout(poll, FALLBACK_POLL_MS);
        }
      };
      poll();
    };

    return () => {
      mountedRef.current = false;
      unsubscribe();
      if (fallbackTimerRef.current) {
        clearTimeout(fallbackTimerRef.current);
        fallbackTimerRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [symbolsKey]);

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
  const mountedRef = useRef(true);
  const fallbackTimerRef = useRef(null);
  const wsFailedRef = useRef(false);

  useEffect(() => {
    if (!isBrowser()) return;
    mountedRef.current = true;
    wsFailedRef.current = false;
    setStatus(CONNECTION_STATUS.CONNECTING);

    // Initial REST fetch
    const doInitialFetch = async () => {
      try {
        const result = await fetchTickerRest(symbols);
        if (mountedRef.current) {
          setData(result);
          setLastUpdated(Date.now());
          setStatus(CONNECTION_STATUS.LIVE);
        }
      } catch (_) {}
    };
    doInitialFetch();

    // WebSocket streaming
    const streamKey = `ticker:${symbolsKey}`;
    const streamUrl = buildTickerStreamUrl(symbols);
    const stream = getStream(streamKey, streamUrl);

    const unsubscribe = stream.subscribe((event) => {
      if (!mountedRef.current) return;

      if (event.type === 'data') {
        const parsed = parseTickerWsMessage(event.data);
        if (parsed) {
          setData((prev) => ({ ...prev, [parsed.symbol]: parsed }));
          setLastUpdated(Date.now());
          setStatus(CONNECTION_STATUS.LIVE);
        }
      } else if (event.type === 'state') {
        const newStatus = mapWsState(event.state, wsFailedRef.current);
        setStatus(newStatus);
      } else if (event.type === 'failed') {
        wsFailedRef.current = true;
        setStatus(CONNECTION_STATUS.DEGRADED);
        startFallbackPolling();
      }
    });

    const startFallbackPolling = () => {
      if (fallbackTimerRef.current) return;
      const poll = async () => {
        if (!mountedRef.current) return;
        try {
          const result = await fetchTickerRest(symbols);
          if (mountedRef.current) {
            setData((prev) => ({ ...prev, ...result }));
            setLastUpdated(Date.now());
            setStatus(CONNECTION_STATUS.LIVE);
          }
        } catch (_) {
          if (mountedRef.current) setStatus(CONNECTION_STATUS.DEGRADED);
        }
        if (mountedRef.current && wsFailedRef.current) {
          fallbackTimerRef.current = setTimeout(poll, FALLBACK_POLL_MS);
        }
      };
      poll();
    };

    return () => {
      mountedRef.current = false;
      unsubscribe();
      if (fallbackTimerRef.current) {
        clearTimeout(fallbackTimerRef.current);
        fallbackTimerRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [symbolsKey]);

  const isStale = lastUpdated ? (Date.now() - lastUpdated) > STALE_THRESHOLD_MS : !lastUpdated;

  return { data, status, lastUpdated, isStale };
}

/**
 * Real-time candlesticks (klines) for a single symbol via WebSocket.
 * Uses WS for live candle updates and REST for initial historical load.
 * Falls back to REST polling if WebSocket fails.
 * @param {string} symbol  e.g. 'BTCUSDT'
 * @param {string} interval e.g. '1m','5m','15m','1h','4h','1d','1w'
 * @param {number} limit candles to fetch from REST
 */
export function useLiveKlines(symbol = 'BTCUSDT', interval = '5m', limit = 60) {
  const [candles, setCandles] = useState([]);
  const mountedRef = useRef(true);
  const fallbackTimerRef = useRef(null);
  const wsFailedRef = useRef(false);

  useEffect(() => {
    if (!isBrowser()) return;
    mountedRef.current = true;
    wsFailedRef.current = false;

    // Load initial candle history via REST
    const loadHistory = async () => {
      try {
        const result = await fetchKlinesRest(symbol, interval, limit);
        if (mountedRef.current) {
          setCandles(result);
        }
      } catch (_) {}
    };
    loadHistory();

    // WebSocket for live candle updates
    const streamKey = `kline:${symbol}:${interval}`;
    const streamUrl = buildKlineStreamUrl(symbol, interval);
    const stream = getStream(streamKey, streamUrl);

    const unsubscribe = stream.subscribe((event) => {
      if (!mountedRef.current) return;

      if (event.type === 'data') {
        const kline = event.data.k || (event.data.data && event.data.data.k);
        if (!kline) return;

        const candle = {
          t: kline.t,
          o: parseFloat(kline.o),
          h: parseFloat(kline.h),
          l: parseFloat(kline.l),
          c: parseFloat(kline.c),
          v: parseFloat(kline.v),
          live: true,
          updatedAt: Date.now(),
        };

        setCandles((prev) => {
          if (!prev.length) return [candle];
          const last = prev[prev.length - 1];
          if (last.t === candle.t) {
            const next = [...prev];
            next[next.length - 1] = candle;
            return next;
          } else if (candle.t > last.t) {
            const next = [...prev, candle];
            return next.length > limit ? next.slice(next.length - limit) : next;
          }
          return prev;
        });
      } else if (event.type === 'failed') {
        wsFailedRef.current = true;
        startFallbackPolling();
      }
    });

    // REST fallback polling
    const startFallbackPolling = () => {
      if (fallbackTimerRef.current) return;
      const poll = async () => {
        if (!mountedRef.current) return;
        try {
          const result = await fetchKlinesRest(symbol, interval, limit);
          if (mountedRef.current) setCandles(result);
        } catch (_) {
          if (mountedRef.current) {
            setCandles((prev) => prev.length ? prev.map((c) => ({ ...c, live: false })) : prev);
          }
        }
        if (mountedRef.current && wsFailedRef.current) {
          fallbackTimerRef.current = setTimeout(poll, KLINE_FALLBACK_POLL_MS);
        }
      };
      poll();
    };

    return () => {
      mountedRef.current = false;
      unsubscribe();
      if (fallbackTimerRef.current) {
        clearTimeout(fallbackTimerRef.current);
        fallbackTimerRef.current = null;
      }
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

'use client';
import { useEffect, useState } from 'react';

// --- Symbol metadata (display name & brand color) ---
export const SYMBOL_META = {
  BTCUSDT:  { sym: 'BTC',   name: 'Bitcoin',    color: '#f7931a' },
  ETHUSDT:  { sym: 'ETH',   name: 'Ethereum',   color: '#627eea' },
  SOLUSDT:  { sym: 'SOL',   name: 'Solana',     color: '#14f195' },
  XRPUSDT:  { sym: 'XRP',   name: 'XRP',        color: '#23292f' },
  BNBUSDT:  { sym: 'BNB',   name: 'BNB',        color: '#f3ba2f' },
  ADAUSDT:  { sym: 'ADA',   name: 'Cardano',    color: '#0033ad' },
  DOGEUSDT: { sym: 'DOGE',  name: 'Dogecoin',   color: '#c2a633' },
  AVAXUSDT: { sym: 'AVAX',  name: 'Avalanche',  color: '#e84142' },
  DOTUSDT:  { sym: 'DOT',   name: 'Polkadot',   color: '#e6007a' },
  LINKUSDT: { sym: 'LINK',  name: 'Chainlink',  color: '#2a5ada' },
  MATICUSDT:{ sym: 'MATIC', name: 'Polygon',    color: '#8247e5' },
  TRXUSDT:  { sym: 'TRX',   name: 'TRON',       color: '#ef0027' },
};

export const DEFAULT_TICKER_SYMBOLS = [
  'BTCUSDT', 'ETHUSDT', 'SOLUSDT', 'XRPUSDT',
  'BNBUSDT', 'ADAUSDT', 'DOGEUSDT', 'AVAXUSDT',
  'DOTUSDT', 'LINKUSDT', 'MATICUSDT', 'TRXUSDT',
];

// All Binance traffic is proxied through our own /api/markets/* routes
// so the browser never hits api.binance.com directly. Binance refuses
// requests from a number of IPs (notably US), so the server can be pointed
// at another Binance-compatible base URL by env.
const PROXY_BASE = '/api/markets';
const POLL_MS = 5000;

function isBrowser() {
  return typeof window !== 'undefined';
}

/**
 * Subscribe to live 24h ticker for one or more symbols.
 * Returns: { [SYMBOL]: { price, pct, open, high, low, vol, live } }
 * Returns an empty object until the live proxy responds.
 */
export function useLivePrices(symbols = DEFAULT_TICKER_SYMBOLS) {
  const symbolsKey = symbols.join(',');
  const [data, setData] = useState({});

  useEffect(() => {
    if (!isBrowser()) return;
    let cancelled = false;
    let timer = null;

    const tick = async () => {
      try {
        const qs = encodeURIComponent(JSON.stringify(symbols));
        const res = await fetch(`${PROXY_BASE}/ticker?symbols=${qs}`, { cache: 'no-store' });
        if (!res.ok) throw new Error('ticker proxy fail');
        const arr = await res.json();
        if (cancelled || !Array.isArray(arr) || !arr.length) return;
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
      } catch (_) {
        // keep last known values
      }
    };

    tick();
    timer = setInterval(tick, POLL_MS);

    return () => {
      cancelled = true;
      if (timer) clearInterval(timer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [symbolsKey]);

  return data;
}

/**
 * Real-time candlesticks (klines) for a single symbol via Binance.
 * @param {string} symbol  e.g. 'BTCUSDT'
 * @param {string} interval e.g. '1m','5m','15m','1h','4h','1d','1w'
 * @param {number} limit candles to fetch from REST
 */
export function useLiveKlines(symbol = 'BTCUSDT', interval = '5m', limit = 60) {
  const [candles, setCandles] = useState([]);

  useEffect(() => {
    if (!isBrowser()) return;
    let cancelled = false;
    let timer = null;

    const tick = async () => {
      try {
        const url = `${PROXY_BASE}/klines?symbol=${symbol}&interval=${interval}&limit=${limit}`;
        const res = await fetch(url, { cache: 'no-store' });
        if (!res.ok) throw new Error('klines proxy fail');
        const arr = await res.json();
        if (cancelled || !Array.isArray(arr) || !arr.length) return;
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
      } catch (_) {
        // keep last set
      }
    };

    tick();
    // Refresh every 10s - finer-grained updates aren't useful for the
    // dashboard candle chart and would add load to the proxy.
    timer = setInterval(tick, 10_000);

    return () => {
      cancelled = true;
      if (timer) clearInterval(timer);
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

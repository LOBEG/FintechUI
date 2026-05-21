'use client';
import { useEffect, useState } from 'react';

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

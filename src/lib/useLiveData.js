'use client';
import { useEffect, useRef, useState } from 'react';

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

const REST_BASE = 'https://api.binance.com';
const WS_BASE = 'wss://stream.binance.com:9443';

function isBrowser() {
  return typeof window !== 'undefined';
}

// Seed prices for SSR / fallback so the UI never renders empty.
const SEED = {
  BTCUSDT:  { price: 71248.32, pct: 2.41,  open: 69570, high: 72415, low: 69128, vol: 24812 },
  ETHUSDT:  { price: 3812.07,  pct: 1.18,  open: 3768,  high: 3845,  low: 3744,  vol: 152312 },
  SOLUSDT:  { price: 178.42,   pct: 4.62,  open: 170.5, high: 181.2, low: 169.4, vol: 612000 },
  XRPUSDT:  { price: 0.6128,   pct: -0.84, open: 0.618, high: 0.624, low: 0.605, vol: 18200000 },
  BNBUSDT:  { price: 612.18,   pct: 0.74,  open: 607.7, high: 615.4, low: 604.8, vol: 41200 },
  ADAUSDT:  { price: 0.4621,   pct: -1.32, open: 0.4683, high: 0.471, low: 0.459, vol: 31200000 },
  DOGEUSDT: { price: 0.1582,   pct: 3.27,  open: 0.1532, high: 0.162, low: 0.151, vol: 84200000 },
  AVAXUSDT: { price: 38.91,    pct: 1.93,  open: 38.17, high: 39.4,  low: 37.9,  vol: 482000 },
  DOTUSDT:  { price: 7.42,     pct: -0.45, open: 7.453, high: 7.51,  low: 7.38,  vol: 1820000 },
  LINKUSDT: { price: 18.74,    pct: 2.10,  open: 18.35, high: 19.02, low: 18.21, vol: 1180000 },
  MATICUSDT:{ price: 0.731,    pct: 2.05,  open: 0.716, high: 0.738, low: 0.711, vol: 8400000 },
  TRXUSDT:  { price: 0.1742,   pct: 0.62,  open: 0.1731, high: 0.1758, low: 0.1722, vol: 22000000 },
};

function seedFor(symbols) {
  const out = {};
  for (const s of symbols) {
    if (SEED[s]) out[s] = { ...SEED[s], live: false };
  }
  return out;
}

/**
 * Subscribe to live 24h ticker for one or more symbols.
 * Returns: { [SYMBOL]: { price, pct, open, high, low, vol, live } }
 * Falls back to seed data if network is unavailable (e.g., SSR or no connectivity).
 */
export function useLivePrices(symbols = DEFAULT_TICKER_SYMBOLS) {
  const symbolsKey = symbols.join(',');
  const [data, setData] = useState(() => seedFor(symbols));
  const wsRef = useRef(null);

  useEffect(() => {
    if (!isBrowser()) return;
    let cancelled = false;

    // Seed via REST snapshot (single call)
    (async () => {
      try {
        const qs = encodeURIComponent(JSON.stringify(symbols));
        const res = await fetch(`${REST_BASE}/api/v3/ticker/24hr?symbols=${qs}`);
        if (!res.ok) throw new Error('rest fail');
        const arr = await res.json();
        if (cancelled) return;
        const next = {};
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
        setData((prev) => ({ ...prev, ...next }));
      } catch (_) {
        // keep seed
      }
    })();

    // WebSocket subscription for live updates
    try {
      const streams = symbols.map((s) => `${s.toLowerCase()}@ticker`).join('/');
      const ws = new WebSocket(`${WS_BASE}/stream?streams=${streams}`);
      wsRef.current = ws;
      ws.onmessage = (ev) => {
        try {
          const msg = JSON.parse(ev.data);
          const t = msg.data;
          if (!t || !t.s) return;
          setData((prev) => ({
            ...prev,
            [t.s]: {
              price: parseFloat(t.c),
              pct: parseFloat(t.P),
              open: parseFloat(t.o),
              high: parseFloat(t.h),
              low: parseFloat(t.l),
              vol: parseFloat(t.v),
              quoteVol: parseFloat(t.q),
              live: true,
            },
          }));
        } catch (_) {}
      };
      ws.onerror = () => {};
    } catch (_) {}

    return () => {
      cancelled = true;
      try { wsRef.current && wsRef.current.close(); } catch (_) {}
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [symbolsKey]);

  return data;
}

// --- Seed klines (synthetic) used for SSR / fallback so the chart renders instantly ---
function seedKlines(count = 60, base = 70000) {
  const out = [];
  let prev = base;
  let t = Date.now() - count * 60_000;
  for (let i = 0; i < count; i++) {
    const drift = (Math.random() - 0.48) * base * 0.01;
    const o = prev;
    const c = Math.max(1, o + drift);
    const h = Math.max(o, c) + Math.random() * base * 0.005;
    const l = Math.min(o, c) - Math.random() * base * 0.005;
    out.push({ t, o, h, l, c, v: 0 });
    prev = c;
    t += 60_000;
  }
  return out;
}

const KLINE_SEED_BASE = {
  BTCUSDT: 71000, ETHUSDT: 3800, SOLUSDT: 178, XRPUSDT: 0.61,
  BNBUSDT: 612, ADAUSDT: 0.46, DOGEUSDT: 0.158, AVAXUSDT: 39,
  DOTUSDT: 7.4, LINKUSDT: 18.7, MATICUSDT: 0.73, TRXUSDT: 0.174,
};

/**
 * Real-time candlesticks (klines) for a single symbol via Binance.
 * @param {string} symbol  e.g. 'BTCUSDT'
 * @param {string} interval e.g. '1m','5m','15m','1h','4h','1d','1w'
 * @param {number} limit candles to fetch from REST
 */
export function useLiveKlines(symbol = 'BTCUSDT', interval = '5m', limit = 60) {
  const [candles, setCandles] = useState(() =>
    seedKlines(limit, KLINE_SEED_BASE[symbol] || 100),
  );
  const wsRef = useRef(null);

  useEffect(() => {
    if (!isBrowser()) return;
    let cancelled = false;

    // Fetch initial history
    (async () => {
      try {
        const url = `${REST_BASE}/api/v3/klines?symbol=${symbol}&interval=${interval}&limit=${limit}`;
        const res = await fetch(url);
        if (!res.ok) throw new Error('klines fetch failed');
        const arr = await res.json();
        if (cancelled) return;
        const next = arr.map((k) => ({
          t: k[0],
          o: parseFloat(k[1]),
          h: parseFloat(k[2]),
          l: parseFloat(k[3]),
          c: parseFloat(k[4]),
          v: parseFloat(k[5]),
        }));
        setCandles(next);
      } catch (_) {
        // keep seed
      }
    })();

    // Live kline WebSocket
    try {
      const ws = new WebSocket(
        `${WS_BASE}/ws/${symbol.toLowerCase()}@kline_${interval}`,
      );
      wsRef.current = ws;
      ws.onmessage = (ev) => {
        try {
          const msg = JSON.parse(ev.data);
          const k = msg.k;
          if (!k) return;
          const candle = {
            t: k.t,
            o: parseFloat(k.o),
            h: parseFloat(k.h),
            l: parseFloat(k.l),
            c: parseFloat(k.c),
            v: parseFloat(k.v),
          };
          setCandles((prev) => {
            if (!prev.length) return [candle];
            const last = prev[prev.length - 1];
            if (last.t === candle.t) {
              const next = prev.slice();
              next[next.length - 1] = candle;
              return next;
            }
            // new candle (closed previous, opening new)
            const next = prev.slice(-limit + 1);
            next.push(candle);
            return next;
          });
        } catch (_) {}
      };
      ws.onerror = () => {};
    } catch (_) {}

    return () => {
      cancelled = true;
      try { wsRef.current && wsRef.current.close(); } catch (_) {}
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

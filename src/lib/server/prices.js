// Server-side helpers for live crypto prices.
// Uses Binance public REST (no API key). Cached for 5s to avoid being
// rate-limited when many users hit /api/wallet in parallel.

const CACHE = new Map(); // symbol -> { price, fetchedAt }
const TTL_MS = 5000;
const REST = 'https://api.binance.com';

export const KNOWN_SYMBOLS = [
  'BTC', 'ETH', 'SOL', 'XRP', 'BNB', 'ADA', 'DOGE', 'AVAX',
  'DOT', 'LINK', 'MATIC', 'TRX', 'LTC', 'USDT',
];

function toPair(symbol) {
  const s = symbol.toUpperCase();
  if (s === 'USDT') return null;
  return `${s}USDT`;
}

export async function priceFor(symbol) {
  const sym = (symbol || '').toUpperCase();
  if (sym === 'USDT' || sym === 'USD') return 1;
  const c = CACHE.get(sym);
  if (c && Date.now() - c.fetchedAt < TTL_MS) return c.price;
  const pair = toPair(sym);
  if (!pair) return 0;
  try {
    const res = await fetch(`${REST}/api/v3/ticker/price?symbol=${pair}`, {
      // never cache at fetch layer
      cache: 'no-store',
    });
    if (!res.ok) throw new Error(`binance ${res.status}`);
    const j = await res.json();
    const price = parseFloat(j.price);
    if (!isFinite(price)) throw new Error('NaN price');
    CACHE.set(sym, { price, fetchedAt: Date.now() });
    return price;
  } catch (err) {
    // Use the previous cached value if we have one, otherwise 0.
    if (c) return c.price;
    return 0;
  }
}

export async function pricesFor(symbols) {
  const unique = Array.from(new Set(symbols.map((s) => s.toUpperCase())));
  const entries = await Promise.all(unique.map(async (s) => [s, await priceFor(s)]));
  return Object.fromEntries(entries);
}

export function isSupportedSymbol(sym) {
  return KNOWN_SYMBOLS.includes((sym || '').toUpperCase());
}

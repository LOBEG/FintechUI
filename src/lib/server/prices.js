// Server-side helpers for live crypto prices.
// Uses Binance public REST (no API key). Cached for 5s to avoid being
// rate-limited when many users hit /api/wallet in parallel.

const CACHE = new Map(); // symbol -> { price, fetchedAt }
const TTL_MS = 5000;
const REST = 'https://api.binance.com';

export const KNOWN_SYMBOLS = [
  'BTC', 'ETH', 'SOL', 'XRP', 'BNB', 'ADA', 'DOGE', 'AVAX',
  'DOT', 'LINK', 'MATIC', 'TRX', 'LTC', 'USDT',
  'TON', 'ATOM', 'NEAR', 'APT', 'ARB', 'OP', 'SUI', 'FIL',
  'INJ', 'SHIB', 'PEPE', 'BCH', 'ETC', 'XLM', 'ALGO', 'HBAR',
];

// Human-readable metadata for the markets page.
export const SYMBOL_INFO = {
  BTC:  { name: 'Bitcoin',     color: '#f7931a' },
  ETH:  { name: 'Ethereum',    color: '#627eea' },
  SOL:  { name: 'Solana',      color: '#14f195' },
  XRP:  { name: 'XRP',         color: '#22c55e' },
  BNB:  { name: 'BNB',         color: '#f3ba2f' },
  ADA:  { name: 'Cardano',     color: '#0033ad' },
  DOGE: { name: 'Dogecoin',    color: '#c2a633' },
  AVAX: { name: 'Avalanche',   color: '#e84142' },
  DOT:  { name: 'Polkadot',    color: '#e6007a' },
  LINK: { name: 'Chainlink',   color: '#2a5ada' },
  MATIC:{ name: 'Polygon',     color: '#8247e5' },
  TRX:  { name: 'TRON',        color: '#ff060a' },
  LTC:  { name: 'Litecoin',    color: '#bfbbbb' },
  USDT: { name: 'Tether',      color: '#26a17b' },
  TON:  { name: 'Toncoin',     color: '#0098ea' },
  ATOM: { name: 'Cosmos',      color: '#2e3148' },
  NEAR: { name: 'NEAR',        color: '#00c08b' },
  APT:  { name: 'Aptos',       color: '#06bff5' },
  ARB:  { name: 'Arbitrum',    color: '#28a0f0' },
  OP:   { name: 'Optimism',    color: '#ff0420' },
  SUI:  { name: 'Sui',         color: '#4ca3ff' },
  FIL:  { name: 'Filecoin',    color: '#0090ff' },
  INJ:  { name: 'Injective',   color: '#00f2fe' },
  SHIB: { name: 'Shiba Inu',   color: '#ffa409' },
  PEPE: { name: 'Pepe',        color: '#43a047' },
  BCH:  { name: 'Bitcoin Cash',color: '#8dc351' },
  ETC:  { name: 'Ethereum Classic', color: '#3ab83a' },
  XLM:  { name: 'Stellar',     color: '#7c80ff' },
  ALGO: { name: 'Algorand',    color: '#999999' },
  HBAR: { name: 'Hedera',      color: '#7b7be9' },
};

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

// Fetch a 24h ticker summary (price + pct change + volume) for many symbols
// in a single Binance request. Cached for 5s.
let _statsCache = null;
export async function marketStats() {
  if (_statsCache && Date.now() - _statsCache.at < TTL_MS) return _statsCache.data;
  try {
    const pairs = KNOWN_SYMBOLS.filter((s) => s !== 'USDT').map((s) => `"${s}USDT"`).join(',');
    const url = `${REST}/api/v3/ticker/24hr?symbols=[${pairs}]`;
    const res = await fetch(url, { cache: 'no-store' });
    if (!res.ok) throw new Error(`binance ${res.status}`);
    const arr = await res.json();
    const data = arr.map((t) => {
      const sym = t.symbol.replace(/USDT$/, '');
      return {
        symbol: sym,
        name: SYMBOL_INFO[sym]?.name || sym,
        color: SYMBOL_INFO[sym]?.color || '#888',
        price: parseFloat(t.lastPrice),
        pct: parseFloat(t.priceChangePercent),
        high: parseFloat(t.highPrice),
        low: parseFloat(t.lowPrice),
        volume: parseFloat(t.quoteVolume),
      };
    });
    _statsCache = { at: Date.now(), data };
    return data;
  } catch (_) {
    if (_statsCache) return _statsCache.data;
    return [];
  }
}

export function isSupportedSymbol(sym) {
  return KNOWN_SYMBOLS.includes((sym || '').toUpperCase());
}

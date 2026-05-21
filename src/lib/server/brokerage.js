// Server-side helpers for the multi-asset brokerage live market data.
//
// We proxy Yahoo Finance's public v8 chart endpoint
// (`query1.finance.yahoo.com/v8/finance/chart/SYMBOL`). It requires no API key,
// returns live regularMarketPrice + previousClose + OHLC arrays for stocks,
// ETFs, indices, forex pairs (e.g. EURUSD=X), energy and industrial futures
// (CL=F crude, SI=F silver, NG=F natgas, HG=F copper),
// and equity index futures (ES=F S&P 500, NQ=F NASDAQ-100, YM=F Dow).
//
// Results are cached per-symbol for 10s server side so simultaneous client
// requests don't hammer Yahoo and trip its public rate limits.

const QUOTE_CACHE = new Map(); // sym -> { at, data }
const CHART_CACHE = new Map(); // key  -> { at, data }
const QUOTE_TTL_MS = 10_000;
const CHART_TTL_MS = 15_000;

const UA = 'Mozilla/5.0 (compatible; OakmontDigitalMarketsGroup/1.0; +https://oakmontdigitalmarkets.com)';

// Curated, broker-grade symbol universe.  Live quotes are sourced from
// Yahoo Finance's public chart endpoint; the company / display metadata
// is bundled here so the UI does not need a second lookup.
export const BROKERAGE_UNIVERSE = {
  stocks: [
    { symbol: 'AAPL',  name: 'Apple Inc.',                 exchange: 'NASDAQ' },
    { symbol: 'MSFT',  name: 'Microsoft Corporation',      exchange: 'NASDAQ' },
    { symbol: 'GOOGL', name: 'Alphabet Inc. Class A',      exchange: 'NASDAQ' },
    { symbol: 'AMZN',  name: 'Amazon.com, Inc.',           exchange: 'NASDAQ' },
    { symbol: 'META',  name: 'Meta Platforms, Inc.',       exchange: 'NASDAQ' },
    { symbol: 'NVDA',  name: 'NVIDIA Corporation',         exchange: 'NASDAQ' },
    { symbol: 'TSLA',  name: 'Tesla, Inc.',                exchange: 'NASDAQ' },
    { symbol: 'NFLX',  name: 'Netflix, Inc.',              exchange: 'NASDAQ' },
    { symbol: 'AMD',   name: 'Advanced Micro Devices',     exchange: 'NASDAQ' },
    { symbol: 'INTC',  name: 'Intel Corporation',          exchange: 'NASDAQ' },
    { symbol: 'ORCL',  name: 'Oracle Corporation',         exchange: 'NYSE' },
    { symbol: 'CRM',   name: 'Salesforce, Inc.',           exchange: 'NYSE' },
    { symbol: 'ADBE',  name: 'Adobe Inc.',                 exchange: 'NASDAQ' },
    { symbol: 'COST',  name: 'Costco Wholesale Corp.',     exchange: 'NASDAQ' },
    { symbol: 'JPM',   name: 'JPMorgan Chase & Co.',       exchange: 'NYSE' },
    { symbol: 'V',     name: 'Visa Inc.',                  exchange: 'NYSE' },
    { symbol: 'MA',    name: 'Mastercard Incorporated',    exchange: 'NYSE' },
    { symbol: 'BAC',   name: 'Bank of America Corp.',      exchange: 'NYSE' },
    { symbol: 'BRK-B', name: 'Berkshire Hathaway Inc.',    exchange: 'NYSE' },
    { symbol: 'XOM',   name: 'Exxon Mobil Corporation',    exchange: 'NYSE' },
    { symbol: 'UNH',   name: 'UnitedHealth Group Inc.',    exchange: 'NYSE' },
    { symbol: 'HD',    name: 'The Home Depot, Inc.',       exchange: 'NYSE' },
    { symbol: 'KO',    name: 'The Coca-Cola Company',      exchange: 'NYSE' },
    { symbol: 'PEP',   name: 'PepsiCo, Inc.',              exchange: 'NASDAQ' },
    { symbol: 'DIS',   name: 'The Walt Disney Company',    exchange: 'NYSE' },
  ],
  etfs: [
    { symbol: 'SPY',  name: 'SPDR S&P 500 ETF Trust',                exchange: 'NYSE Arca' },
    { symbol: 'QQQ',  name: 'Invesco QQQ Trust (NASDAQ-100)',         exchange: 'NASDAQ' },
    { symbol: 'IWM',  name: 'iShares Russell 2000 ETF',               exchange: 'NYSE Arca' },
    { symbol: 'DIA',  name: 'SPDR Dow Jones Industrial Average ETF',  exchange: 'NYSE Arca' },
    { symbol: 'VTI',  name: 'Vanguard Total Stock Market ETF',        exchange: 'NYSE Arca' },
    { symbol: 'EEM',  name: 'iShares MSCI Emerging Markets ETF',      exchange: 'NYSE Arca' },
    { symbol: 'SLV',  name: 'iShares Silver Trust',                   exchange: 'NYSE Arca' },
    { symbol: 'TLT',  name: 'iShares 20+ Year Treasury Bond ETF',     exchange: 'NASDAQ' },
  ],
  indices: [
    { symbol: '^GSPC', name: 'S&P 500',                       exchange: 'Index' },
    { symbol: '^IXIC', name: 'NASDAQ Composite',              exchange: 'Index' },
    { symbol: '^DJI',  name: 'Dow Jones Industrial Average',  exchange: 'Index' },
    { symbol: '^RUT',  name: 'Russell 2000',                  exchange: 'Index' },
    { symbol: '^FTSE', name: 'FTSE 100',                      exchange: 'Index' },
    { symbol: '^N225', name: 'Nikkei 225',                    exchange: 'Index' },
    { symbol: '^GDAXI',name: 'DAX Performance Index',         exchange: 'Index' },
    { symbol: '^HSI',  name: 'Hang Seng Index',               exchange: 'Index' },
    { symbol: '^VIX',  name: 'CBOE Volatility Index (VIX)',   exchange: 'Index' },
  ],
  forex: [
    { symbol: 'EURUSD=X', name: 'EUR / USD', exchange: 'FX' },
    { symbol: 'GBPUSD=X', name: 'GBP / USD', exchange: 'FX' },
    { symbol: 'USDJPY=X', name: 'USD / JPY', exchange: 'FX' },
    { symbol: 'USDCHF=X', name: 'USD / CHF', exchange: 'FX' },
    { symbol: 'AUDUSD=X', name: 'AUD / USD', exchange: 'FX' },
    { symbol: 'USDCAD=X', name: 'USD / CAD', exchange: 'FX' },
    { symbol: 'NZDUSD=X', name: 'NZD / USD', exchange: 'FX' },
    { symbol: 'EURJPY=X', name: 'EUR / JPY', exchange: 'FX' },
    { symbol: 'EURGBP=X', name: 'EUR / GBP', exchange: 'FX' },
    { symbol: 'GBPJPY=X', name: 'GBP / JPY', exchange: 'FX' },
    { symbol: 'AUDJPY=X', name: 'AUD / JPY', exchange: 'FX' },
    { symbol: 'EURAUD=X', name: 'EUR / AUD', exchange: 'FX' },
    { symbol: 'USDCNY=X', name: 'USD / CNY', exchange: 'FX' },
  ],
  commodities: [
    { symbol: 'SI=F', name: 'Silver (COMEX front-month)',   exchange: 'COMEX' },
    { symbol: 'CL=F', name: 'WTI Crude Oil',                exchange: 'NYMEX' },
    { symbol: 'BZ=F', name: 'Brent Crude Oil',              exchange: 'ICE'   },
    { symbol: 'NG=F', name: 'Natural Gas',                  exchange: 'NYMEX' },
    { symbol: 'HG=F', name: 'Copper',                       exchange: 'COMEX' },
    { symbol: 'PL=F', name: 'Platinum',                     exchange: 'NYMEX' },
    { symbol: 'PA=F', name: 'Palladium',                    exchange: 'NYMEX' },
    { symbol: 'ZC=F', name: 'Corn',                         exchange: 'CBOT'  },
    { symbol: 'ZW=F', name: 'Wheat',                        exchange: 'CBOT'  },
    { symbol: 'ZS=F', name: 'Soybeans',                     exchange: 'CBOT'  },
    { symbol: 'ZO=F', name: 'Oats',                         exchange: 'CBOT'  },
    { symbol: 'KC=F', name: 'Coffee',                       exchange: 'ICE'   },
    { symbol: 'SB=F', name: 'Sugar #11',                    exchange: 'ICE'   },
    { symbol: 'CT=F', name: 'Cotton',                       exchange: 'ICE'   },
  ],
  futures: [
    { symbol: 'ES=F', name: 'S&P 500 E-mini Futures',          exchange: 'CME' },
    { symbol: 'NQ=F', name: 'NASDAQ-100 E-mini Futures',       exchange: 'CME' },
    { symbol: 'YM=F', name: 'Dow E-mini Futures',              exchange: 'CBOT' },
    { symbol: 'RTY=F',name: 'Russell 2000 E-mini Futures',     exchange: 'CME' },
    { symbol: 'ZB=F', name: 'US Treasury Bond Futures',        exchange: 'CBOT' },
    { symbol: 'ZN=F', name: '10-Year US T-Note Futures',       exchange: 'CBOT' },
    { symbol: '6E=F', name: 'Euro FX Futures',                 exchange: 'CME' },
    { symbol: '6J=F', name: 'Japanese Yen Futures',            exchange: 'CME' },
  ],
};

// Options are accessed via Yahoo's options chain endpoint - the available
// expirations are returned by the API itself, so we only need the
// underliers users can pick.
export const OPTIONS_UNDERLIERS = [
  { symbol: 'AAPL', name: 'Apple Inc.' },
  { symbol: 'MSFT', name: 'Microsoft Corporation' },
  { symbol: 'NVDA', name: 'NVIDIA Corporation' },
  { symbol: 'AMD',  name: 'Advanced Micro Devices' },
  { symbol: 'TSLA', name: 'Tesla, Inc.' },
  { symbol: 'AMZN', name: 'Amazon.com, Inc.' },
  { symbol: 'META', name: 'Meta Platforms, Inc.' },
  { symbol: 'GOOGL',name: 'Alphabet Inc. Class A' },
  { symbol: 'SPY',  name: 'SPDR S&P 500 ETF Trust' },
  { symbol: 'QQQ',  name: 'Invesco QQQ Trust' },
  { symbol: 'IWM',  name: 'iShares Russell 2000 ETF' },
];

export const ASSET_CLASSES = ['stocks', 'etfs', 'indices', 'forex', 'commodities', 'futures'];

export function allBrokerageSymbols() {
  return ASSET_CLASSES.flatMap((cls) => BROKERAGE_UNIVERSE[cls].map((r) => ({ ...r, assetClass: cls })));
}

async function yahooFetch(url) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), 8000);
  try {
    const r = await fetch(url, {
      headers: { 'User-Agent': UA, 'Accept': 'application/json' },
      signal: ctrl.signal,
      cache: 'no-store',
    });
    if (!r.ok) throw new Error(`Yahoo HTTP ${r.status}`);
    return await r.json();
  } finally {
    clearTimeout(t);
  }
}

// Returns the live quote for a single symbol (price, change, % change,
// previousClose, dayHigh/Low, volume, currency, market state).
// Falls back to the previous cache value on transient errors.
export async function brokerageQuote(symbol) {
  const sym = String(symbol || '').trim();
  if (!sym) return null;
  const cached = QUOTE_CACHE.get(sym);
  if (cached && Date.now() - cached.at < QUOTE_TTL_MS) return cached.data;
  try {
    const j = await yahooFetch(
      `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(sym)}?interval=1d&range=2d&includePrePost=false`,
    );
    const res = j?.chart?.result?.[0];
    const meta = res?.meta;
    if (!meta) throw new Error('no meta');
    const price = Number(meta.regularMarketPrice);
    const prev = Number(meta.chartPreviousClose ?? meta.previousClose);
    const change = isFinite(price) && isFinite(prev) ? price - prev : 0;
    const pct = isFinite(price) && isFinite(prev) && prev !== 0 ? (change / prev) * 100 : 0;
    const data = {
      symbol: sym,
      price: isFinite(price) ? price : 0,
      previousClose: isFinite(prev) ? prev : 0,
      change,
      pct,
      currency: meta.currency || 'USD',
      exchangeName: meta.fullExchangeName || meta.exchangeName || '',
      marketState: meta.marketState || 'CLOSED',
      dayHigh: Number(meta.regularMarketDayHigh) || 0,
      dayLow: Number(meta.regularMarketDayLow) || 0,
      volume: Number(meta.regularMarketVolume) || 0,
      fetchedAt: Date.now(),
    };
    QUOTE_CACHE.set(sym, { at: Date.now(), data });
    return data;
  } catch (_err) {
    if (cached) return cached.data;
    return null;
  }
}

export async function brokerageQuotes(symbols) {
  const list = (Array.isArray(symbols) ? symbols : []).map((s) => String(s || '').trim()).filter(Boolean);
  if (!list.length) return [];
  // Run in parallel but cap concurrency so we don't fire 50 requests at once.
  const out = new Array(list.length);
  const N = 8;
  let i = 0;
  const next = async () => {
    while (i < list.length) {
      const idx = i++;
      out[idx] = await brokerageQuote(list[idx]);
    }
  };
  await Promise.all(Array.from({ length: Math.min(N, list.length) }, next));
  return out.filter(Boolean);
}

// OHLC candles for a single symbol.  `range` and `interval` are passed
// straight through to Yahoo (e.g. range=1mo, interval=1h).
export async function brokerageChart(symbol, { range = '1mo', interval = '1d' } = {}) {
  const sym = String(symbol || '').trim();
  const key = `${sym}|${range}|${interval}`;
  const cached = CHART_CACHE.get(key);
  if (cached && Date.now() - cached.at < CHART_TTL_MS) return cached.data;
  try {
    const j = await yahooFetch(
      `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(sym)}?interval=${encodeURIComponent(interval)}&range=${encodeURIComponent(range)}&includePrePost=false`,
    );
    const res = j?.chart?.result?.[0];
    if (!res) throw new Error('no result');
    const ts = res.timestamp || [];
    const q = res.indicators?.quote?.[0] || {};
    const candles = ts.map((t, idx) => ({
      time: t * 1000,
      open: Number(q.open?.[idx]) || null,
      high: Number(q.high?.[idx]) || null,
      low: Number(q.low?.[idx]) || null,
      close: Number(q.close?.[idx]) || null,
      volume: Number(q.volume?.[idx]) || 0,
    })).filter((c) => c.open != null && c.close != null);
    const data = {
      symbol: sym,
      currency: res.meta?.currency || 'USD',
      exchangeName: res.meta?.fullExchangeName || res.meta?.exchangeName || '',
      interval,
      range,
      candles,
    };
    CHART_CACHE.set(key, { at: Date.now(), data });
    return data;
  } catch (_err) {
    if (cached) return cached.data;
    return null;
  }
}

// Yahoo options chain.  When `expiration` is omitted Yahoo returns the
// nearest expiration. The endpoint provides full call / put rows
// (strike, bid, ask, lastPrice, openInterest, impliedVolatility).
export async function optionsChain(underlier, expiration) {
  const sym = String(underlier || '').trim().toUpperCase();
  if (!sym) return null;
  try {
    const url = expiration
      ? `https://query1.finance.yahoo.com/v7/finance/options/${encodeURIComponent(sym)}?date=${encodeURIComponent(expiration)}`
      : `https://query1.finance.yahoo.com/v7/finance/options/${encodeURIComponent(sym)}`;
    const j = await yahooFetch(url);
    const res = j?.optionChain?.result?.[0];
    if (!res) return null;
    const o = res.options?.[0] || {};
    return {
      symbol: sym,
      underlyingPrice: Number(res.quote?.regularMarketPrice) || 0,
      expirations: res.expirationDates || [],
      strikes: res.strikes || [],
      expiration: o.expirationDate || null,
      calls: (o.calls || []).map((c) => ({
        contractSymbol: c.contractSymbol,
        strike: c.strike,
        lastPrice: c.lastPrice,
        bid: c.bid,
        ask: c.ask,
        change: c.change,
        percentChange: c.percentChange,
        volume: c.volume,
        openInterest: c.openInterest,
        impliedVolatility: c.impliedVolatility,
        inTheMoney: !!c.inTheMoney,
      })),
      puts: (o.puts || []).map((p) => ({
        contractSymbol: p.contractSymbol,
        strike: p.strike,
        lastPrice: p.lastPrice,
        bid: p.bid,
        ask: p.ask,
        change: p.change,
        percentChange: p.percentChange,
        volume: p.volume,
        openInterest: p.openInterest,
        impliedVolatility: p.impliedVolatility,
        inTheMoney: !!p.inTheMoney,
      })),
    };
  } catch (_err) {
    return null;
  }
}

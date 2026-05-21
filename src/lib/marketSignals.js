export function candleCloseSeries(candles = []) {
  return candles
    .map((c) => Number(c?.close ?? c?.c))
    .filter((v) => Number.isFinite(v));
}

export function rsi(closes, period = 14) {
  if (!closes || closes.length < period + 1) return null;
  let gains = 0;
  let losses = 0;
  for (let i = 1; i <= period; i++) {
    const d = closes[i] - closes[i - 1];
    if (d >= 0) gains += d;
    else losses -= d;
  }
  let avgG = gains / period;
  let avgL = losses / period;
  for (let i = period + 1; i < closes.length; i++) {
    const d = closes[i] - closes[i - 1];
    avgG = (avgG * (period - 1) + Math.max(d, 0)) / period;
    avgL = (avgL * (period - 1) + Math.max(-d, 0)) / period;
  }
  if (avgL === 0) return 100;
  const rs = avgG / avgL;
  return 100 - 100 / (1 + rs);
}

export function sma(closes, n) {
  if (!closes || closes.length < n) return null;
  let s = 0;
  for (let i = closes.length - n; i < closes.length; i++) s += closes[i];
  return s / n;
}

export function classifySignal({ rsiVal, fast, slow, pct24 = 0 }) {
  const trendUp = fast != null && slow != null && fast > slow;
  if (rsiVal == null) {
    if (pct24 >= 1) return { label: 'Accumulate', tone: 'buy', score: 1 };
    if (pct24 <= -1) return { label: 'Reduce', tone: 'sell', score: -1 };
    return { label: 'Hold / observe', tone: 'neutral', score: 0 };
  }
  if (rsiVal < 30 && trendUp) return { label: 'Strong buy', tone: 'buy', score: 4 };
  if (rsiVal < 40 || (trendUp && pct24 > 0)) return { label: 'Accumulate', tone: 'buy', score: 2 };
  if (rsiVal > 70 && !trendUp) return { label: 'Take profit', tone: 'sell', score: -3 };
  if (rsiVal > 65 || (!trendUp && pct24 < 0)) return { label: 'Reduce', tone: 'sell', score: -1 };
  return { label: 'Hold / observe', tone: 'neutral', score: 0 };
}

export function buildMarketSignal(candles = [], pct24 = 0) {
  const closes = candleCloseSeries(candles);
  const rsiVal = rsi(closes, 14);
  const fast = sma(closes, 12);
  const slow = sma(closes, 26);
  const last = closes[closes.length - 1];
  const open = closes[Math.max(0, closes.length - 96)];
  const computedPct = last && open ? ((last - open) / open) * 100 : pct24;
  const signal = classifySignal({ rsiVal, fast, slow, pct24: computedPct });
  return { ...signal, rsiVal, fast, slow, last, pct24: computedPct };
}

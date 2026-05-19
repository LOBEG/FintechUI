const DEFAULT_BINANCE_BASES = [
  'https://api.binance.com',
  'https://api-gcp.binance.com',
  'https://api1.binance.com',
  'https://api2.binance.com',
  'https://api3.binance.com',
  'https://api4.binance.com',
  'https://data-api.binance.vision',
];

export function binanceBases() {
  const configured = process.env.BINANCE_API_BASES || process.env.BINANCE_API_BASE || '';
  const bases = configured
    .split(',')
    .map((s) => s.trim().replace(/\/$/, ''))
    .filter(Boolean);
  return bases.length ? bases : DEFAULT_BINANCE_BASES;
}

export async function fetchBinanceJson(path) {
  let lastError = null;
  for (const base of binanceBases()) {
    try {
      const res = await fetch(`${base}${path}`, { cache: 'no-store' });
      if (!res.ok) throw new Error(`${base} ${res.status}`);
      return { data: await res.json(), upstream: base };
    } catch (err) {
      lastError = err;
    }
  }
  throw lastError || new Error('All Binance upstreams failed');
}

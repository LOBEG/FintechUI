import { NextResponse } from 'next/server';
import { brokerageQuotes, BROKERAGE_UNIVERSE, ASSET_CLASSES } from '@/lib/server/brokerage.js';
import { getBrokerageSettings } from '@/lib/server/store.js';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// GET /api/brokerage/quotes?symbols=AAPL,MSFT
// GET /api/brokerage/quotes?class=stocks  (returns the curated universe for
//                                          that asset class)
// GET /api/brokerage/quotes               (returns the full universe)
export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const settings = getBrokerageSettings();
  const enabledClasses = ASSET_CLASSES.filter((c) => settings.classes?.[c] !== false);
  const raw = searchParams.get('symbols');
  const cls = searchParams.get('class');
  let symbols;
  if (raw) {
    symbols = raw
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean)
      .slice(0, 60);
  } else if (cls && BROKERAGE_UNIVERSE[cls] && enabledClasses.includes(cls)) {
    symbols = BROKERAGE_UNIVERSE[cls].map((r) => r.symbol);
  } else {
    symbols = enabledClasses.flatMap((c) => BROKERAGE_UNIVERSE[c].map((r) => r.symbol));
  }
  const quotes = await brokerageQuotes(symbols);
  // Attach the curated display name + exchange when we have one so the UI
  // does not need to round-trip /universe to render rows.
  const meta = new Map();
  for (const c of ASSET_CLASSES) {
    for (const row of BROKERAGE_UNIVERSE[c]) {
      meta.set(row.symbol, { name: row.name, exchange: row.exchange, assetClass: c });
    }
  }
  const enriched = quotes.map((q) => {
    const signal = q.pct >= 1 ? 'Accumulate' : q.pct <= -1 ? 'Reduce' : 'Hold / observe';
    const signalTone = signal === 'Accumulate' ? 'buy' : signal === 'Reduce' ? 'sell' : 'neutral';
    return { ...q, ...(meta.get(q.symbol) || {}), signal, signalTone, live: true };
  });
  return NextResponse.json({ quotes: enriched, count: enriched.length });
}

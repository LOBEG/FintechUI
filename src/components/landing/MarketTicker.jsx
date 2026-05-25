'use client';
import { formatPct, formatUSD } from '@/lib/utils';
import { useLivePrices, SYMBOL_META, DEFAULT_TICKER_SYMBOLS } from '@/lib/useLiveData';
import { getCryptoLogo } from '@/lib/cryptoLogos';
export function MarketTicker() {
    const live = useLivePrices(DEFAULT_TICKER_SYMBOLS);
    const rows = DEFAULT_TICKER_SYMBOLS
      .map((s) => {
        const d = live[s];
        const m = SYMBOL_META[s];
        if (!d || !m) return null;
        return { ...m, key: s, price: d.price, change: d.pct };
      })
      .filter(Boolean);
    const items = [...rows, ...rows];
    return (<section id="markets" className="relative">
      <div className="border-y border-white/5 bg-ink-900/40 backdrop-blur">
        <div className="overflow-hidden">
          {!items.length && <div className="py-3 text-center text-sm text-white/50">Connecting to live market prices...</div>}
          <div className="marquee-track py-3">
            {items.map((a, i) => {
              const logo = getCryptoLogo(a.sym);
              return (<div key={`${a.key}-${i}`} className="flex items-center gap-3 px-6 whitespace-nowrap border-r border-white/5">
                {logo ? (
                  <img src={logo} alt={`${a.name || a.sym} logo`} width={24} height={24} loading="lazy" className="h-6 w-6 rounded-full bg-white/5"
                    onError={(e) => { e.currentTarget.style.display = 'none'; e.currentTarget.nextElementSibling?.classList.remove('hidden'); }} />
                ) : null}
                <span className={`h-7 w-7 rounded-full ${logo ? 'hidden' : 'inline-flex'} items-center justify-center text-[11px] font-bold text-ink-950`} style={{ background: a.color }} role="img" aria-label={`${a.name || a.sym} fallback mark`}>
                  {a.sym.slice(0, 1)}
                </span>
                <span className="text-sm font-semibold text-white">{a.sym}</span>
                <span className="text-sm text-white/80">{formatUSD(a.price, a.price < 1 ? 4 : 2)}</span>
                <span className={`text-xs ${a.change >= 0 ? 'text-accent-success' : 'text-accent-error'}`}>{formatPct(a.change)}</span>
              </div>);
            })}
          </div>
        </div>
      </div>
    </section>);
}

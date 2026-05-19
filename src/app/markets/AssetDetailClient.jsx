'use client';
// Asset detail page - /markets/[symbol]
//
// Lightweight TradingView-style page that finally gives every asset its
// own home rather than burying it in the watchlist row. Live price,
// 24-hour stats, candle chart, an "about this asset" panel, and the
// usual invest/sell CTAs.
import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowLeft, ArrowDownLeft, ArrowUpRight, TrendingUp, TrendingDown, Star } from 'lucide-react';
import { Sidebar } from '@/components/dashboard/Sidebar';
import { TopBar } from '@/components/dashboard/TopBar';
import { CandlestickChart } from '@/components/ui/Charts';
import { useLivePrices, useLiveKlines, SYMBOL_META } from '@/lib/useLiveData';
import { useSession, api } from '@/lib/useSession';
import { InvestModal, SellModal } from '@/components/dashboard/TradeModals';
import { cryptoLogoStyle } from '@/lib/cryptoLogos';

// A small, deliberately editorial "about" copy block. Real product
// would feed this from a CMS or fixture file; for now an inline map
// keeps the page truthful for the most-traded assets and falls back to
// a generic blurb for the rest.
const ABOUT = {
  BTC: 'Bitcoin is the first peer-to-peer digital currency, designed by Satoshi Nakamoto in 2008. Settled on a globally distributed proof-of-work ledger.',
  ETH: 'Ethereum is a programmable settlement layer for smart contracts, launched in 2015. The native ETH token is used to pay for computation and storage on the network.',
  SOL: 'Solana is a high-throughput, low-fee chain that pairs proof-of-stake with proof-of-history. Widely used for consumer apps and on-chain orderbooks.',
  XRP: 'XRP is the native asset of the XRP Ledger, an open-source payments network optimised for cross-border settlement.',
  BNB: 'BNB is the native asset of the BNB Chain ecosystem and pays for transaction fees on BNB Smart Chain.',
  ADA: 'Cardano (ADA) is a peer-reviewed, proof-of-stake chain emphasising formal verification and governance.',
  DOGE: 'Dogecoin was launched in 2013 as a community-driven payment currency. It has the longest continuously running PoW network outside of Bitcoin and Litecoin.',
  AVAX: 'Avalanche is a high-performance smart-contract platform with sub-second finality, organised around a primary chain and customisable subnets.',
  DOT: 'Polkadot is a multi-chain interoperability protocol; the DOT token is used for staking, governance and parachain auctions.',
  LINK: 'Chainlink is the dominant decentralised oracle network, supplying off-chain price and event data to smart contracts.',
  MATIC: 'Polygon (MATIC) is an Ethereum scaling solution combining a proof-of-stake sidechain with zk-rollup infrastructure.',
  TRX: 'TRON is a high-throughput chain widely used for stablecoin transfers, particularly USDT-TRC20.',
};

function aboutFor(sym) {
  return (
    ABOUT[sym] ||
    `${sym} is one of the assets supported on AurumX spot. Live mid-market quotes are streamed from Binance and rounded to the asset's tick size on every fill.`
  );
}

export default function AssetDetailClient({ symbol }) {
  const upper = String(symbol || '').toUpperCase();
  const pair = `${upper}USDT`;
  const meta = SYMBOL_META[pair] || { sym: upper, name: upper, color: '#b8862b' };
  const { user } = useSession();
  const [interval, setInterval] = useState('1h');
  const prices = useLivePrices([pair]);
  const candles = useLiveKlines(pair, interval, 100);
  const px = prices[pair] || {};
  const pct = isFinite(px.pct) ? px.pct : 0;
  const pctClass = pct >= 0 ? 'text-neon-green' : 'text-neon-red';
  const [investOpen, setInvestOpen] = useState(false);
  const [sellOpen, setSellOpen] = useState(false);
  const requireAuth = () => {
    if (user) return true;
    window.location.href = `/login?next=/markets/${upper}`;
    return false;
  };

  // Watchlist (favourites) - let the user star/unstar this asset.
  const [favourited, setFavourited] = useState(false);
  const [favBusy, setFavBusy] = useState(false);
  useEffect(() => {
    let cancelled = false;
    if (!user) { setFavourited(false); return; }
    (async () => {
      try {
        const r = await api.get('/api/watchlist');
        if (!cancelled) setFavourited(Array.isArray(r.symbols) && r.symbols.includes(meta.sym));
      } catch (_) { /* tolerate */ }
    })();
    return () => { cancelled = true; };
  }, [user, meta.sym]);
  const toggleFavourite = async () => {
    if (!user || favBusy) return;
    setFavBusy(true);
    const previous = favourited;
    setFavourited(!previous); // optimistic
    try {
      const r = await api.post('/api/watchlist', { symbol: meta.sym });
      if (Array.isArray(r?.symbols)) setFavourited(r.symbols.includes(meta.sym));
    } catch (_) {
      setFavourited(previous);
    } finally {
      setFavBusy(false);
    }
  };

  const stats = useMemo(
    () => [
      { k: '24h high', v: px.high ? `$${Number(px.high).toLocaleString()}` : 'Connecting' },
      { k: '24h low', v: px.low ? `$${Number(px.low).toLocaleString()}` : 'Connecting' },
      { k: '24h volume', v: px.vol ? `${Number(px.vol).toLocaleString(undefined, { maximumFractionDigits: 0 })} ${meta.sym}` : 'Connecting' },
      { k: '24h notional', v: px.quoteVol ? `$${(px.quoteVol / 1e6).toFixed(1)}M` : 'Connecting' },
    ],
    [px, meta.sym],
  );

  return (
    <div className="min-h-screen bg-ink-950 text-white">
      <TopBar />
      <div className="flex">
        <Sidebar />
        <main className="flex-1 px-4 md:px-8 py-6 max-w-7xl">
          <div className="flex items-center gap-3 mb-6">
            <Link href="/dashboard" className="h-9 w-9 rounded-lg bg-white/5 border border-white/10 inline-flex items-center justify-center hover:bg-white/10" aria-label="Back to dashboard">
              <ArrowLeft className="h-4 w-4" />
            </Link>
            <div className="flex items-center gap-3 flex-1">
              <div className="h-10 w-10 rounded-full inline-flex items-center justify-center font-semibold bg-white/5 border border-white/10" style={cryptoLogoStyle(meta.sym) || { background: `${meta.color}22`, color: meta.color }}>
                {!cryptoLogoStyle(meta.sym) && meta.sym.slice(0, 3)}
              </div>
              <div>
                <h1 className="font-display text-xl">{meta.name} <span className="text-white/55 font-normal">({meta.sym})</span></h1>
                <div className="text-xs text-white/55">{meta.sym}/USDT • spot</div>
              </div>
              {user && (
                <button
                  type="button"
                  onClick={toggleFavourite}
                  disabled={favBusy}
                  className={`ml-2 inline-flex items-center justify-center h-9 w-9 rounded-lg border ${favourited ? 'text-neon-gold border-neon-gold/40 bg-neon-gold/10' : 'text-white/60 hover:text-white border-white/10 bg-white/5 hover:bg-white/10'} disabled:opacity-50`}
                  aria-label={favourited ? `Remove ${meta.sym} from watchlist` : `Add ${meta.sym} to watchlist`}
                  aria-pressed={favourited}
                  title={favourited ? 'Remove from watchlist' : 'Add to watchlist'}
                >
                  <Star className={`h-4 w-4 ${favourited ? 'fill-current' : ''}`}/>
                </button>
              )}
            </div>
            <div className="text-right">
               <div className="text-2xl font-semibold tabular-nums">{px.price ? `$${Number(px.price).toLocaleString(undefined, { maximumFractionDigits: 4 })}` : 'Connecting'}</div>
              <div className={`text-xs ${pctClass} flex items-center justify-end gap-1`}>
                {pct >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                 {isFinite(pct) ? `${pct >= 0 ? '+' : ''}${pct.toFixed(2)}%` : 'Connecting'} (24h)
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            <motion.section
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass-strong p-4 xl:col-span-2"
            >
              <div className="flex items-center justify-between mb-3">
                <h2 className="font-display">Chart</h2>
                <div className="flex gap-1 text-xs">
                  {['5m', '15m', '1h', '4h', '1d', '1w'].map((iv) => (
                    <button
                      key={iv}
                      onClick={() => setInterval(iv)}
                      className={`px-2 py-1 rounded-md border ${
                        interval === iv
                          ? 'border-neon-gold/40 bg-neon-gold/10 text-neon-gold'
                          : 'border-white/10 bg-white/5 hover:bg-white/10'
                      }`}
                    >
                      {iv}
                    </button>
                  ))}
                </div>
              </div>
              <div className="h-72">
                <CandlestickChart data={candles} animate={false} />
              </div>
            </motion.section>

            <aside className="space-y-4">
              <div className="glass-strong p-4">
                <h3 className="font-display mb-3">24-hour stats</h3>
                <dl className="grid grid-cols-2 gap-y-2 text-sm">
                  {stats.map((s) => (
                    <div key={s.k} className="contents">
                      <dt className="text-white/55">{s.k}</dt>
                      <dd className="text-right tabular-nums">{s.v}</dd>
                    </div>
                  ))}
                </dl>
              </div>
              <div className="glass-strong p-4 space-y-2">
                <button
                  className="btn-primary w-full justify-center"
                  onClick={() => { if (requireAuth()) setInvestOpen(true); }}
                >
                  <ArrowDownLeft className="h-4 w-4" /> Buy {meta.sym}
                </button>
                <button
                  className="btn-secondary w-full justify-center"
                  onClick={() => { if (requireAuth()) setSellOpen(true); }}
                  disabled={!!user && !(user?.balances?.[meta.sym] > 0)}
                >
                  <ArrowUpRight className="h-4 w-4" /> Sell {meta.sym}
                </button>
                {!user && <p className="text-xs text-white/55">Sign in to trade {meta.sym}.</p>}
              </div>
              <div className="glass-strong p-4">
                <h3 className="font-display mb-2">About {meta.name}</h3>
                <p className="text-sm text-white/70 leading-relaxed">{aboutFor(meta.sym)}</p>
              </div>
            </aside>
          </div>
        </main>
      </div>
      <InvestModal
        open={investOpen}
        onClose={() => setInvestOpen(false)}
        defaultSymbol={meta.sym}
        usdtBalance={user?.balances?.USDT || 0}
      />
      <SellModal
        open={sellOpen}
        onClose={() => setSellOpen(false)}
        balances={user?.balances || {}}
        defaultSymbol={meta.sym}
      />
    </div>
  );
}

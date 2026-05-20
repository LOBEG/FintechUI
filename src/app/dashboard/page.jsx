'use client';
import { useEffect, useMemo, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { ArrowDownLeft, ArrowUpRight, TrendingUp, TrendingDown, Wallet, Plus, Bot, Eye, Star, Zap, } from 'lucide-react';
import { Sidebar } from '@/components/dashboard/Sidebar';
import { TopBar } from '@/components/dashboard/TopBar';
import { MobileBottomNav } from '@/components/layout/MobileBottomNav';
import { CandlestickChart, Sparkline, BarChart, DonutChart } from '@/components/ui/Charts';
import { formatUSD, formatPct } from '@/lib/utils';
import { useLivePrices, useLiveKlines, SYMBOL_META, DEFAULT_TICKER_SYMBOLS } from '@/lib/useLiveData';
import { cryptoLogoStyle } from '@/lib/cryptoLogos';
import { InvestModal, WithdrawModal, SellModal, BrokerageInvestModal } from '@/components/dashboard/TradeModals';
import BrokerageHubPanel from '@/components/dashboard/BrokerageHubPanel';
import BrokeragePositionsPanel from '@/components/dashboard/BrokeragePositionsPanel';
import { useSession, api } from '@/lib/useSession';
import { DepositAddressPanel, MarketsPanel, TestimonialComposer, SandboxOnRampPanel, EmailVerifyBanner, NotificationBell, OpenOrdersPanel, BeneficiariesPanel, KycPanel, PortfolioPanel, PriceAlertsPanel, ConvertPanel, EmptyStateCoach, DcaPanel, ReferralPanel, SupportPanel, SupportContactPanel } from '@/components/dashboard/UserPanels';
import { AvailableCashSelector } from '@/components/dashboard/AvailableCashSelector';
import { useI18n } from '@/components/I18nProvider';

// Default watchlist for anonymous visitors and users who haven't pinned
// anything yet. Logged-in users override this via /api/watchlist.
const DEFAULT_WATCHLIST_SYMBOLS = ['BTCUSDT', 'ETHUSDT', 'SOLUSDT', 'XRPUSDT', 'BNBUSDT', 'ADAUSDT', 'DOGEUSDT'];
// Demo data for anonymous visitors only — logged-in users get real data from /api/wallet
const DEMO_WALLET_HOLDINGS = [
    { key: 'BTCUSDT', sym: 'BTC', name: 'Bitcoin', bal: 1.245, color: '#f7931a' },
    { key: 'ETHUSDT', sym: 'ETH', name: 'Ethereum', bal: 12.41, color: '#627eea' },
    { key: 'SOLUSDT', sym: 'SOL', name: 'Solana',   bal: 84.5,  color: '#14f195' },
    { key: null,      sym: 'USDT', name: 'Tether',   bal: 24800, color: '#26a17b' },
];
const DEMO_POSITION_TEMPLATE = [
    { key: 'BTCUSDT', sym: 'BTC/USDT', side: 'LONG',  size: 0.4521, entry: 69284.12 },
    { key: 'ETHUSDT', sym: 'ETH/USDT', side: 'LONG',  size: 4.2,    entry: 3712.55 },
    { key: 'SOLUSDT', sym: 'SOL/USDT', side: 'SHORT', size: 28,     entry: 184.5 },
    { key: 'XRPUSDT', sym: 'XRP/USDT', side: 'LONG',  size: 4200,   entry: 0.6045 },
];
const DEMO_TRANSACTIONS = [
    { type: 'Buy', asset: 'BTC', amount: '0.0125', value: 891.1, time: '2m ago', status: 'Filled' },
    { type: 'Deposit', asset: 'USDT', amount: '5,000.00', value: 5000, time: '1h ago', status: 'Completed' },
    { type: 'Sell', asset: 'SOL', amount: '12.4', value: 2212.4, time: '3h ago', status: 'Filled' },
    { type: 'Withdraw', asset: 'ETH', amount: '0.45', value: 1715.42, time: '1d ago', status: 'Completed' },
    { type: 'Buy', asset: 'XRP', amount: '4,200', value: 2538.24, time: '2d ago', status: 'Filled' },
];
const INTERVALS = ['1m', '5m', '15m', '1h', '4h', '1d', '1w'];

export default function DashboardPage() {
    const { user } = useSession();
    const { t } = useI18n();
    const [side, setSide] = useState('buy');
    const [orderType, setOrderType] = useState('limit');
    const [amount, setAmount] = useState('0.05');
    const [interval, setInterval] = useState('5m');
    const [investOpen, setInvestOpen] = useState(false);
    const [investSymbol, setInvestSymbol] = useState('BTC');
    
    // Handle tab navigation from hash on client side
    useEffect(() => {
        if (typeof window === 'undefined') return;
        
        const handleHashChange = () => {
            const hash = window.location.hash.slice(1);
            if (hash) {
                setTimeout(() => {
                    const el = document.getElementById(hash);
                    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }, 100);
            }
        };
        
        // Handle initial hash
        handleHashChange();
        
        // Listen for hash changes
        window.addEventListener('hashchange', handleHashChange);
        return () => window.removeEventListener('hashchange', handleHashChange);
    }, []);
    const requireAuth = useCallback(() => {
        if (user) return true;
        window.location.href = '/login?next=/dashboard';
        return false;
    }, [user]);
    const openInvest = useCallback((sym) => {
        if (!requireAuth()) return;
        if (sym) setInvestSymbol(sym);
        setInvestOpen(true);
    }, [requireAuth]);
    const [withdrawOpen, setWithdrawOpen] = useState(false);
    const [sellOpen, setSellOpen] = useState(false);
    const [brokerageInvestOpen, setBrokerageInvestOpen] = useState(false);
    const [brokerageInvestSymbol, setBrokerageInvestSymbol] = useState('AAPL');
    const [brokerageInvestClass, setBrokerageInvestClass] = useState('stocks');
    const [liveWallet, setLiveWallet] = useState(null);
    const refreshWallet = useCallback(async () => {
        if (!user) { setLiveWallet(null); return; }
        try { const w = await api.get('/api/wallet'); setLiveWallet(w); } catch (_) {}
    }, [user]);
    useEffect(() => { refreshWallet(); }, [refreshWallet]);
    // Watchlist: load the user's saved favourites; fall back to the default
    // set for anonymous visitors or users who haven't pinned anything yet.
    const [watchlistBases, setWatchlistBases] = useState(null); // null = loading
    useEffect(() => {
        let cancelled = false;
        if (!user) { setWatchlistBases(null); return; }
        (async () => {
            try {
                const r = await api.get('/api/watchlist');
                if (!cancelled) setWatchlistBases(Array.isArray(r.symbols) ? r.symbols : []);
            } catch (_) { if (!cancelled) setWatchlistBases([]); }
        })();
        return () => { cancelled = true; };
    }, [user]);
    const watchlistSymbols = useMemo(() => {
        if (user && watchlistBases && watchlistBases.length) {
            return watchlistBases.map((b) => `${b}USDT`);
        }
        return DEFAULT_WATCHLIST_SYMBOLS;
    }, [user, watchlistBases]);
    const removeFromWatchlist = useCallback(async (pair) => {
        if (!user) return;
        const base = pair.endsWith('USDT') ? pair.slice(0, -4) : pair;
        // Optimistic update - keep the row responsive even if the network is slow.
        setWatchlistBases((prev) => (prev || []).filter((b) => b !== base));
        try {
            const r = await api.post('/api/watchlist', { symbol: base });
            if (Array.isArray(r?.symbols)) setWatchlistBases(r.symbols);
        } catch (_) {
            // Re-fetch on failure so the UI doesn't drift from the server.
            try { const r = await api.get('/api/watchlist'); setWatchlistBases(r.symbols || []); } catch (_) {}
        }
    }, [user]);
    const pairOptions = useMemo(() => Object.keys(SYMBOL_META), []);
    const tradePair = `${investSymbol}USDT`;
    const selectedMarketMeta = SYMBOL_META[tradePair] || { sym: investSymbol, name: investSymbol, color: '#999' };
    const quoteSymbol = 'USDT';
    const walletMarketSymbols = useMemo(() => {
        if (!liveWallet?.balances) return [];
        return Object.keys(liveWallet.balances)
            .filter((sym) => !['USDT', 'USDC'].includes(sym))
            .map((sym) => `${sym}USDT`);
    }, [liveWallet]);
    const livePrices = useLivePrices([...new Set([...watchlistSymbols, ...DEFAULT_TICKER_SYMBOLS, ...walletMarketSymbols, tradePair])]);
    const candles = useLiveKlines(tradePair, interval, 80);
    const lastCandle = candles[candles.length - 1];
    const chartLive = !!lastCandle?.live;
    const chartUpdatedLabel = lastCandle?.updatedAt ? new Date(lastCandle.updatedAt).toLocaleTimeString() : 'connecting';
    const [price, setPrice] = useState('');
    const tradeMarket = livePrices[tradePair] || { price: 0, pct: 0, high: 0, low: 0, vol: 0, quoteVol: 0, live: false };
    const tradePctClass = tradeMarket.pct >= 0 ? 'text-neon-green' : 'text-neon-red';
    const effectivePrice = price || (tradeMarket.price ? tradeMarket.price.toFixed(2) : '0');
    // Wallet: real balances when logged in, demo for anonymous visitors.
    const wallets = useMemo(() => {
        const meta = {
            BTC: { name: 'Bitcoin', color: '#f7931a', key: 'BTCUSDT' },
            ETH: { name: 'Ethereum', color: '#627eea', key: 'ETHUSDT' },
            SOL: { name: 'Solana', color: '#14f195', key: 'SOLUSDT' },
            XRP: { name: 'XRP', color: '#22c55e', key: 'XRPUSDT' },
            BNB: { name: 'BNB', color: '#f3ba2f', key: 'BNBUSDT' },
            USDT: { name: 'Tether', color: '#26a17b', key: null },
            USDC: { name: 'USD Coin', color: '#2775ca', key: null },
        };
        if (liveWallet) {
            const symbols = Object.entries(liveWallet.balances || {})
                .filter(([, bal]) => Number(bal) > 0)
                .map(([sym]) => sym);
            return symbols.map((sym) => {
                const m = meta[sym] || { name: sym, color: '#999', key: `${sym}USDT` };
                const bal = liveWallet.balances?.[sym] || 0;
                const market = m.key ? livePrices[m.key] : null;
                const px = sym === 'USDT' || sym === 'USDC' ? 1 : (market?.price ?? 0);
                const openPx = sym === 'USDT' || sym === 'USDC' ? 1 : (market?.open ?? px);
                return { sym, name: m.name, color: m.color, key: m.key, bal, price: px, openPrice: openPx, value: bal * px, openValue: bal * openPx };
            });
        }
        if (user) return [];
        // Anonymous visitors see demo data
        return DEMO_WALLET_HOLDINGS.map((w) => {
            const market = w.key ? livePrices[w.key] : null;
            const px = w.key ? (market?.price ?? 0) : 1;
            const openPx = w.key ? (market?.open ?? px) : 1;
            return { ...w, price: px, openPrice: openPx, value: w.bal * px, openValue: w.bal * openPx };
        });
    }, [liveWallet, livePrices, user]);
    const totalBalance = wallets.reduce((s, w) => s + w.value, 0);
    const portfolioOpenValue = wallets.reduce((s, w) => s + (w.openValue ?? w.value), 0);
    const portfolioMarketChange = totalBalance - portfolioOpenValue;
    const portfolioMarketPct = portfolioOpenValue > 0 ? (portfolioMarketChange / portfolioOpenValue) * 100 : 0;
    const portfolioAllocation = useMemo(
      () => wallets.map((w) => ({ label: w.sym, value: totalBalance ? Math.round((w.value / totalBalance) * 100) : 0, color: w.color })),
      [wallets, totalBalance],
    );

    // Live positions w/ mark + PnL (demo for anonymous, empty for logged-in without positions)
    const positions = useMemo(() => {
        if (!user) {
            // Anonymous visitors see demo positions
            return DEMO_POSITION_TEMPLATE.map((p) => {
                const mark = livePrices[p.key]?.price ?? p.entry;
                const direction = p.side === 'LONG' ? 1 : -1;
                const pnl = (mark - p.entry) * p.size * direction;
                const roe = p.entry ? ((mark - p.entry) / p.entry) * 100 * direction : 0;
                return { ...p, mark, pnl, roe };
            });
        }
        // Logged-in users: real positions would come from an API endpoint
        // For now, return empty array until /api/positions is implemented
        return [];
    }, [user, livePrices]);
    const openPnl = positions.reduce((s, p) => s + p.pnl, 0);
    const cashUSDT = liveWallet ? (liveWallet.balances?.USDT || 0) : (user ? 0 : DEMO_WALLET_HOLDINGS.find((w) => w.sym === 'USDT').bal);
    const userBalances = liveWallet?.balances || {};
    const orderValue = (parseFloat(amount || '0') || 0) * (parseFloat(effectivePrice || '0') || 0);
    const handleTradePairChange = useCallback((pair) => {
        const base = pair.endsWith('USDT') ? pair.slice(0, -4) : pair;
        setInvestSymbol(base);
        setPrice('');
    }, []);
    const setPercentAmount = useCallback((pct) => {
        if (!requireAuth()) return;
        const px = parseFloat(effectivePrice || '0');
        if (!px) return;
        const next = (cashUSDT * pct) / px;
        setAmount(next > 0 ? next.toFixed(6) : '0');
    }, [cashUSDT, effectivePrice, requireAuth]);

    return (<div className="flex">
      <Sidebar />
      <div className="flex-1 min-w-0 pb-24 lg:pb-0">
        <TopBar title={t('tradingDashboard')}/>
        <main className="p-4 sm:p-6 space-y-6">
          {user && <EmailVerifyBanner user={user} />}          {/* Portfolio overview */}
          {user ? <section className="grid lg:grid-cols-4 gap-4">
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass-strong p-5 lg:col-span-2">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <p className="text-sm text-white/60 flex items-center gap-2">
                    {t('totalPortfolioValue')}
                    <span className="inline-flex items-center gap-1 text-[10px] uppercase tracking-wider text-neon-green">
                      <span className="h-1.5 w-1.5 rounded-full bg-neon-green animate-pulse"/> live
                    </span>
                  </p>
                  <p className="text-3xl sm:text-4xl font-display mt-1">{formatUSD(totalBalance)}</p>
                  <p className={`text-sm mt-1 ${portfolioMarketChange >= 0 ? 'text-neon-green' : 'text-neon-red'}`}>
                    {portfolioMarketChange >= 0 ? '+' : ''}{formatUSD(portfolioMarketChange)} live 24h movement ({portfolioMarketPct >= 0 ? '+' : ''}{portfolioMarketPct.toFixed(2)}%)
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button onClick={() => openInvest(investSymbol)} className="btn-primary text-sm"><Plus className="h-4 w-4"/> {t('invest')}</button>
                  <button onClick={() => setSellOpen(true)} className="btn-ghost text-sm"><ArrowUpRight className="h-4 w-4"/> {t('sell')}</button>
                  <button onClick={() => setWithdrawOpen(true)} className="btn-ghost text-sm"><ArrowUpRight className="h-4 w-4"/> {t('withdraw')}</button>
                </div>
              </div>
              <div className="mt-3 h-24">
                <Sparkline width={640} height={90} data={[portfolioOpenValue, totalBalance]} positive={portfolioMarketChange >= 0}/>
              </div>
            </motion.div>

            <AvailableCashSelector wallets={wallets} livePrices={livePrices} />
            <div className="glass p-5">
              <p className="text-sm text-white/60">{t('openPnL')}</p>
              <p className={`text-2xl font-display mt-1 ${openPnl >= 0 ? 'text-gold-400' : 'text-neon-red'}`}>{openPnl >= 0 ? '+' : ''}{formatUSD(openPnl)}</p>
              <p className="text-xs text-white/50 mt-1">{positions.length} {t('openPositions')}</p>
            </div>
          </section> : <section className="glass-strong p-5">
            <p className="text-sm text-white/60">Public trading preview</p>
            <h2 className="mt-1 text-2xl font-display">Create an account to view cash, balances, positions, history, and execution controls.</h2>
            <p className="mt-2 text-sm text-white/60 max-w-2xl">The live chart and market table remain public for transparency. Funding, investing, selling, withdrawals, and portfolio records are available only after secure sign-in.</p>
            <div className="mt-4 flex flex-wrap gap-3">
              <a href="/signup" className="btn-primary text-sm">Create Account</a>
              <a href="/login?next=/dashboard" className="btn-ghost text-sm">Sign in</a>
            </div>
          </section>}

          {/* Chart + Buy/Sell */}
          <section id="trade-section" className="grid xl:grid-cols-3 gap-4">
            <div className="xl:col-span-2 glass-strong p-4">
              <div className="flex items-center justify-between flex-wrap gap-3 px-1">
                <div className="flex items-center gap-3">
                  <span className="h-9 w-9 rounded-full inline-flex items-center justify-center text-ink-950 text-sm font-bold bg-white/5 border border-white/10" style={cryptoLogoStyle(selectedMarketMeta.sym) || { background: selectedMarketMeta.color }}>
                    {!cryptoLogoStyle(selectedMarketMeta.sym) && selectedMarketMeta.sym.slice(0, 1)}
                    <span className="sr-only">{selectedMarketMeta.name}</span>
                  </span>
                  <div>
                    <p className="text-base font-semibold">{selectedMarketMeta.sym} / {quoteSymbol}</p>
                    <p className="text-xs text-white/50">{selectedMarketMeta.name} · Spot · Binance live feed</p>
                  </div>
                  <div className="hidden sm:block pl-4">
                    <p className={`text-lg font-semibold ${tradePctClass}`}>{formatUSD(tradeMarket.price)}</p>
                    <p className={`text-xs ${tradePctClass}`}>{formatPct(tradeMarket.pct)} (24h)</p>
                  </div>
                </div>
                <div className="flex items-center gap-1 text-xs">
                  {INTERVALS.map((t) => (<button key={t} onClick={() => setInterval(t)} className={`px-2.5 py-1 rounded ${interval === t ? 'bg-white/10 text-white' : 'text-white/60 hover:bg-white/5'}`}>
                      {t}
                    </button>))}
                </div>
              </div>
              <div className="mt-3 rounded-xl bg-ink-900/60 border border-cyan/10 p-2">
                <div className="mb-2 flex items-center justify-between px-1 text-[11px] text-white/45">
                  <span className={chartLive ? 'text-neon-green' : 'text-white/45'}>
                    {chartLive ? 'Live Binance candles' : 'Connecting to Binance candles'}
                  </span>
                  <span>Updated {chartUpdatedLabel}</span>
                </div>
                <div className="aspect-[16/9]">
                  <CandlestickChart data={candles} animate={false}/>
                </div>
              </div>
              <div className="grid grid-cols-4 gap-2 mt-3 text-xs">
                <div className="glass-light p-2 text-center"><p className="text-white/50">24h High</p><p className="font-semibold mt-0.5">{formatUSD(tradeMarket.high || 0)}</p></div>
                <div className="glass-light p-2 text-center"><p className="text-white/50">24h Low</p><p className="font-semibold mt-0.5">{formatUSD(tradeMarket.low || 0)}</p></div>
                <div className="glass-light p-2 text-center"><p className="text-white/50">24h Vol ({selectedMarketMeta.sym})</p><p className="font-semibold mt-0.5">{(tradeMarket.vol || 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}</p></div>
                <div className="glass-light p-2 text-center"><p className="text-white/50">24h Vol ({quoteSymbol})</p><p className="font-semibold mt-0.5">{formatUSD(tradeMarket.quoteVol || 0)}</p></div>
              </div>
            </div>

            {/* Buy/Sell panel */}
            <div className="glass-strong p-4">
              <div className="grid grid-cols-2 rounded-xl bg-white/5 p-1">
                <button onClick={() => (user ? setSide('buy') : requireAuth())} className={`py-2 rounded-lg text-sm font-medium ${side === 'buy' ? 'bg-neon-green text-ink-950' : 'text-white/70'}`}>
                  {t('buy')}
                </button>
                <button onClick={() => (user ? setSide('sell') : requireAuth())} className={`py-2 rounded-lg text-sm font-medium ${side === 'sell' ? 'bg-neon-red text-white' : 'text-white/70'}`}>
                  {t('sell')}
                </button>
              </div>
              <div className="mt-3 flex gap-1 text-xs">
                {['market', 'limit', 'stop'].map((t) => (<button key={t} onClick={() => (user ? setOrderType(t) : requireAuth())} className={`flex-1 py-1.5 rounded ${orderType === t ? 'bg-white/10 text-white' : 'text-white/55 hover:bg-white/5'}`}>
                    {t.charAt(0).toUpperCase() + t.slice(1)}
                  </button>))}
              </div>
              <div className="mt-4 space-y-3">
                <label className="block">
                  <span className="text-xs text-white/55">Trading pair</span>
                  <select value={tradePair} onChange={(e) => handleTradePairChange(e.target.value)} disabled={!user} className="mt-1 w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm outline-none focus:border-neon-green/50 disabled:opacity-50">
                    {pairOptions.map((pair) => {
                      const meta = SYMBOL_META[pair];
                      return <option key={pair} value={pair} className="bg-ink-900">{meta.sym} / {quoteSymbol} · {meta.name}</option>;
                    })}
                  </select>
                </label>
                <Field label={`Price (${quoteSymbol})`} value={effectivePrice} onChange={setPrice} disabled={!user || orderType === 'market'}/>
                <Field label={`Amount (${investSymbol})`} value={amount} onChange={setAmount} disabled={!user}/>
                <div className="grid grid-cols-4 gap-1 text-[11px]">
                  {[
                    ['25%', 0.25],
                    ['50%', 0.5],
                    ['75%', 0.75],
                    ['100%', 1],
                  ].map(([label, pct]) => (<button key={label} onClick={() => setPercentAmount(pct)} className="py-1.5 rounded bg-white/5 hover:bg-white/10 text-white/70">{label}</button>))}
                </div>
                <div className="glass-light p-3 text-xs space-y-1">
                  <Row k="Order value" v={`≈ ${formatUSD(orderValue)}`}/>
                  <Row k="Fee (0.10%)" v={`≈ ${formatUSD(orderValue * 0.001)}`}/>
                  {user ? <Row k="Available" v={`${cashUSDT.toLocaleString()} ${quoteSymbol}`}/> : <Row k="Access" v="Sign in required"/>}
                </div>
                <button onClick={() => {
                    if (!requireAuth()) return;
                    if (side === 'buy') openInvest(investSymbol);
                    else setSellOpen(true);
                }} className={`btn w-full justify-center text-sm font-semibold ${side === 'buy' ? 'bg-neon-green text-ink-950 hover:shadow-glow' : 'bg-neon-red text-white'}`}>
                  {user ? (side === 'buy' ? `${t('buy')} ${investSymbol}` : `${t('sell')} ${investSymbol}`) : t('trade')}
                </button>
              </div>
            </div>
          </section>


          {/* Asset cards */}
          {user && <section id="wallet" className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {wallets.slice(0, 4).map((w, i) => (<motion.div key={w.sym} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="glass p-4">
                <div className="flex items-center gap-2">
                  <span className="h-9 w-9 rounded-full inline-flex items-center justify-center text-xs font-bold text-ink-950 bg-white/5 border border-white/10" style={cryptoLogoStyle(w.sym) || { background: w.color }}>
                    {!cryptoLogoStyle(w.sym) && w.sym.slice(0, 1)}
                  </span>
                  <div>
                    <p className="text-sm font-semibold">{w.sym}</p>
                    <p className="text-[11px] text-white/50">{w.name}</p>
                  </div>
                  <Star className="h-4 w-4 ml-auto text-white/30"/>
                </div>
                <p className="text-lg font-semibold mt-3">{w.bal.toLocaleString()}</p>
                <p className="text-xs text-white/50">{formatUSD(w.value)}</p>
                <div className="mt-2"><Sparkline data={[w.openValue ?? w.value, w.value]} seed={i + 2} positive={(w.value - (w.openValue ?? w.value)) >= 0}/></div>
              </motion.div>))}
          </section>}

          {/* Deposit addresses + markets - only after sign-in for deposit, markets always */}
          {user && (
            <section className="grid xl:grid-cols-2 gap-4">
              <DepositAddressPanel />
              <MarketsPanel onInvest={openInvest} />
            </section>
          )}
          {user && <BrokerageHubPanel
            onInvest={(sym, cls) => { if (sym) setBrokerageInvestSymbol(sym); if (cls) setBrokerageInvestClass(cls); setBrokerageInvestOpen(true); }}
            onWithdraw={() => setWithdrawOpen(true)}
          />}
          {user && <BrokeragePositionsPanel />}
          {user && <EmptyStateCoach />}
          {user && <SandboxOnRampPanel />}
          {user && <OpenOrdersPanel />}
          {user && <section id="security-section"><KycPanel /></section>}
          {user && <PortfolioPanel />}
          {user && <ConvertPanel onConverted={refreshWallet} />}
          {user && <DcaPanel onChanged={refreshWallet} />}
          {user && <ReferralPanel />}
          {user && <section id="alerts-section"><PriceAlertsPanel /></section>}
          {user && <section id="settings-section"><BeneficiariesPanel /></section>}
          {user && <SupportPanel />}
          {user && <SupportContactPanel />}
          {!user && (
            <section>
              <MarketsPanel onInvest={openInvest} />
            </section>
          )}

          {/* Watchlist + Positions */}
          {user && <section id="positions-section" className="grid xl:grid-cols-3 gap-4">
            <div className="glass-strong p-4 xl:col-span-1">
              <div className="flex items-center justify-between">
                <p className="font-semibold">Watchlist</p>
                <button className="text-xs text-white/55 hover:text-white">View all</button>
              </div>
              <div className="mt-3 divide-y divide-white/5">
                {watchlistSymbols.map((s, i) => {
                  const meta = SYMBOL_META[s];
                  const d = livePrices[s];
                  if (!meta) return null;
                  const px = d?.price ?? 0;
                  const pct = d?.pct ?? 0;
                  const base = s.endsWith('USDT') ? s.slice(0, -4) : s;
                  const canRemove = !!user && Array.isArray(watchlistBases) && watchlistBases.includes(base);
                  return (<div key={s} className="flex items-center gap-3 py-2.5">
                      <a href={`/markets/${base}`} className="h-8 w-8 rounded-full inline-flex items-center justify-center text-[11px] font-bold text-ink-950 hover:opacity-90 bg-white/5 border border-white/10" style={cryptoLogoStyle(meta.sym) || { background: meta.color }} aria-label={`Open ${meta.sym} details`}>
                        {!cryptoLogoStyle(meta.sym) && meta.sym.slice(0, 1)}
                      </a>
                      <a href={`/markets/${base}`} className="flex-1 min-w-0 hover:text-neon-gold">
                        <p className="text-sm font-medium">{meta.sym}</p>
                        <p className="text-[11px] text-white/50 truncate">{meta.name}</p>
                      </a>
                      <Sparkline seed={i + 4} positive={pct >= 0} width={70} height={28}/>
                      <div className="text-right">
                        <p className="text-sm">{formatUSD(px, px < 1 ? 4 : 2)}</p>
                        <p className={`text-[11px] ${pct >= 0 ? 'text-neon-green' : 'text-neon-red'}`}>{formatPct(pct)}</p>
                      </div>
                      {canRemove && (
                        <button
                          onClick={() => removeFromWatchlist(s)}
                          className="ml-1 p-1 text-neon-gold/80 hover:text-neon-gold"
                          aria-label={`Remove ${meta.sym} from watchlist`}
                          title="Remove from watchlist"
                        >
                          <Star className="h-3.5 w-3.5 fill-current"/>
                        </button>
                      )}
                    </div>);
                })}
                {user && Array.isArray(watchlistBases) && watchlistBases.length === 0 && (
                  <p className="text-[11px] text-white/45 py-3">Tap the ★ on any asset to pin it here.</p>
                )}
              </div>
            </div>

            {/* Open positions */}
            <div className="glass-strong p-4 xl:col-span-2 overflow-hidden">
              <div className="flex items-center justify-between">
                <p className="font-semibold">Open Positions</p>
                <span className="chip bg-white/5 border border-white/10 text-white/70">{positions.length} active</span>
              </div>
              <div className="mt-3 overflow-x-auto -mx-4 px-4">
                {positions.length > 0 ? (
                  <table className="min-w-full text-sm">
                    <thead className="text-xs text-white/50">
                      <tr className="text-left">
                        <th className="py-2 font-medium">Market</th>
                        <th className="py-2 font-medium">Side</th>
                        <th className="py-2 font-medium">Size</th>
                        <th className="py-2 font-medium">Entry</th>
                        <th className="py-2 font-medium">Mark</th>
                        <th className="py-2 font-medium">PnL</th>
                        <th className="py-2 font-medium">ROE</th>
                        <th className="py-2"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {positions.map((p) => {
                        const pos = p.pnl >= 0;
                        return (<tr key={p.sym}>
                          <td className="py-2.5 font-medium">{p.sym}</td>
                          <td>
                            <span className={`chip ${p.side === 'LONG' ? 'bg-neon-green/15 text-neon-green' : 'bg-neon-red/15 text-neon-red'}`}>
                              {p.side === 'LONG' ? <TrendingUp className="h-3 w-3"/> : <TrendingDown className="h-3 w-3"/>}
                              {p.side}
                            </span>
                          </td>
                          <td>{p.size}</td>
                          <td>{formatUSD(p.entry, p.entry < 1 ? 4 : 2)}</td>
                          <td>{formatUSD(p.mark, p.mark < 1 ? 4 : 2)}</td>
                          <td className={pos ? 'text-neon-green' : 'text-neon-red'}>{pos ? '+' : ''}{formatUSD(p.pnl)}</td>
                          <td className={pos ? 'text-neon-green' : 'text-neon-red'}>{pos ? '+' : ''}{p.roe.toFixed(2)}%</td>
                          <td className="text-right">
                            <button className="text-xs px-2 py-1 rounded bg-white/5 border border-white/10 hover:bg-white/10">Close</button>
                          </td>
                        </tr>);
                      })}
                    </tbody>
                  </table>
                ) : (
                  <div className="py-8 text-center text-white/50">
                    No open positions yet. Start trading to see your positions here.
                  </div>
                )}
              </div>
            </div>
          </section>}

          {/* Analytics + AI bot + History */}
          <section id="analytics-section" className="grid xl:grid-cols-3 gap-4">
            <div className="glass-strong p-5">
              <p className="font-semibold">Portfolio allocation</p>
              <div className="flex flex-col items-center mt-3">
                <DonutChart data={portfolioAllocation} size={180}/>
                <div className="mt-4 grid grid-cols-2 gap-x-6 gap-y-1.5 w-full text-xs">
                  {portfolioAllocation.map((a) => (<div key={a.label} className="flex items-center gap-2">
                      <span className="h-2.5 w-2.5 rounded-full" style={{ background: a.color }}/>
                      {a.label}
                      <span className="ml-auto">{a.value}%</span>
                    </div>))}
                </div>
              </div>
            </div>

            <div className="glass-strong p-5">
              <div className="flex items-center justify-between">
                <p className="font-semibold">P&L · last 30 days</p>
                <span className={`text-xs ${openPnl >= 0 ? 'text-neon-green' : 'text-neon-red'}`}>{openPnl >= 0 ? '+' : ''}{formatUSD(openPnl + 6900)}</span>
              </div>
              <BarChart data={[12, 18, 9, 22, 14, 28, 19, 31, 24, 36, 28, 41, 33, 22, 38]} color="#00ffa3"/>
              <div className="grid grid-cols-3 gap-2 mt-2 text-xs">
                <div className="glass-light p-2 text-center"><p className="text-white/50">Win rate</p><p className="font-semibold mt-1">68%</p></div>
                <div className="glass-light p-2 text-center"><p className="text-white/50">Trades</p><p className="font-semibold mt-1">142</p></div>
                <div className="glass-light p-2 text-center"><p className="text-white/50">Avg ROE</p><p className="font-semibold mt-1 text-neon-green">+2.4%</p></div>
              </div>
            </div>

            <div id="bot-section" className="glass-strong p-5">
              <div className="flex items-center justify-between">
                <p className="font-semibold flex items-center gap-2"><Bot className="h-4 w-4 text-neon-green"/> Oakmont AI Bot</p>
                {user ? (
                  <span className="chip bg-white/5 text-white/60 border border-white/10">Configuring</span>
                ) : (
                  <span className="chip bg-neon-green/15 text-neon-green border border-neon-green/30">● Demo</span>
                )}
              </div>
              {user ? (
                <div className="mt-3 text-center py-6">
                  <p className="text-sm text-white/60">AI Bot is being configured for your portfolio.</p>
                  <p className="text-xs text-white/45 mt-2">Strategies will appear once your portfolio has assets.</p>
                </div>
              ) : (
                <>
                  <div className="mt-3 space-y-2">
                    {['Grid · SOL/USDT', 'DCA · BTC', 'Arbitrage · ETH'].map((s, i) => (<div key={s} className="glass-light p-3 flex items-center gap-3">
                        <Zap className="h-4 w-4 text-gold-400"/>
                        <p className="text-sm flex-1">{s}</p>
                        <span className="text-xs text-neon-green">+{(2.4 + i * 1.7).toFixed(1)}%</span>
                      </div>))}
                  </div>
                  <button className="btn-outline w-full mt-3 text-sm">Configure strategies</button>
                </>
              )}
            </div>
          </section>

          {/* Transaction history */}
          {user && <section id="history-section" className="glass-strong p-4">
            <div className="flex items-center justify-between">
              <p className="font-semibold">Transaction history</p>
              <button className="text-xs text-white/55 hover:text-white flex items-center gap-1"><Eye className="h-3.5 w-3.5"/> View all</button>
            </div>
            <div className="mt-3 overflow-x-auto -mx-4 px-4">
              <table className="min-w-full text-sm">
                <thead className="text-xs text-white/50 text-left">
                  <tr>
                    <th className="py-2 font-medium">Type</th>
                    <th className="py-2 font-medium">Asset</th>
                    <th className="py-2 font-medium">Amount</th>
                    <th className="py-2 font-medium">Value</th>
                    <th className="py-2 font-medium">Time</th>
                    <th className="py-2 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {liveWallet?.transactions?.length ? liveWallet.transactions.slice(0, 10).map((t, i) => {
                    const displayType = t.type === 'invest' ? 'Buy' : t.type === 'admin_credit' ? 'Deposit' : t.type === 'withdraw' ? 'Withdraw' : t.type;
                    const isIn = displayType === 'Buy' || displayType === 'Deposit';
                    return (<tr key={i}>
                        <td className="py-2.5">
                          <span className={`chip ${isIn ? 'bg-neon-green/15 text-neon-green' : 'bg-neon-orange/15 text-neon-orange'}`}>
                            {isIn ? <ArrowDownLeft className="h-3 w-3"/> : <ArrowUpRight className="h-3 w-3"/>}
                            {displayType}
                          </span>
                        </td>
                        <td>{t.symbol}</td>
                        <td>{Number(t.amount).toLocaleString(undefined, { maximumFractionDigits: 8 })}</td>
                        <td>{formatUSD(t.usdValue || 0)}</td>
                        <td className="text-white/60">{new Date(t.createdAt).toLocaleString()}</td>
                        <td><span className="chip bg-white/5 text-white/80 border border-white/10">{t.status === 'completed' ? 'Completed' : t.status}</span></td>
                      </tr>);
                  }) : (
                    <tr>
                      <td colSpan="6" className="py-8 text-center text-white/50">
                        No transactions yet. Deposit crypto to start trading.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>}

          {/* Testimonial composer - for invested users to share feedback */}
          {user && <TestimonialComposer />}

          {/* Mobile floating action button */}
          <button onClick={() => openInvest(investSymbol)} className="lg:hidden fixed bottom-24 right-5 z-30 h-14 w-14 rounded-full bg-neon-grad text-ink-950 shadow-glow inline-flex items-center justify-center" aria-label="Quick trade">
            <Wallet className="h-6 w-6"/>
          </button>
        </main>
      </div>
      <MobileBottomNav />
      <InvestModal open={investOpen} onClose={() => setInvestOpen(false)} onSuccess={refreshWallet} walletBalances={userBalances} defaultSymbol={investSymbol}/>
      <WithdrawModal open={withdrawOpen} onClose={() => setWithdrawOpen(false)} onSuccess={refreshWallet} balances={userBalances}/>
      <SellModal open={sellOpen} onClose={() => setSellOpen(false)} onSuccess={refreshWallet} balances={userBalances} defaultSymbol={investSymbol}/>
      <BrokerageInvestModal open={brokerageInvestOpen} onClose={() => setBrokerageInvestOpen(false)} onSuccess={refreshWallet} defaultSymbol={brokerageInvestSymbol} defaultClass={brokerageInvestClass} walletBalances={userBalances}/>
    </div>);
}
function Field({ label, value, onChange, disabled, }) {
    return (<label className="block">
      <span className="text-xs text-white/55">{label}</span>
      <input value={value} onChange={(e) => onChange(e.target.value)} disabled={disabled} className="mt-1 w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm outline-none focus:border-neon-green/50 disabled:opacity-50"/>
    </label>);
}
function Row({ k, v }) {
    return (<div className="flex justify-between text-white/65">
      <span>{k}</span>
      <span className="text-white">{v}</span>
    </div>);
}

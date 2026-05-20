'use client';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowRight, ShieldCheck, Sparkles, TrendingUp } from 'lucide-react';
import { CandlestickChart } from '@/components/ui/Charts';
import { useLiveKlines, useLivePrices } from '@/lib/useLiveData';
import { formatUSD, formatPct } from '@/lib/utils';
import { cryptoLogoStyle } from '@/lib/cryptoLogos';
export function Hero() {
    const candles = useLiveKlines('BTCUSDT', '5m', 56);
    const prices = useLivePrices(['BTCUSDT']);
    const btc = prices.BTCUSDT || { price: 0, pct: 0, high: 0, low: 0, live: false };
    const live = !!btc.live;
    const pctClass = btc.pct >= 0 ? 'text-neon-green' : 'text-neon-red';
    const lastCandle = candles[candles.length - 1];
    const chartLive = !!lastCandle?.live;
    const chartUpdatedLabel = lastCandle?.updatedAt ? new Date(lastCandle.updatedAt).toLocaleTimeString() : 'connecting';
    return (<section className="relative overflow-hidden">
      <div className="absolute inset-0 bg-grid opacity-30 pointer-events-none"/>
      <div className="absolute -top-40 right-0 h-[480px] w-[480px] rounded-full bg-neon-green/10 blur-3xl pointer-events-none"/>
      <div className="absolute -bottom-40 left-0 h-[420px] w-[420px] rounded-full bg-gold-500/10 blur-3xl pointer-events-none"/>
      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-14 pb-16 lg:pt-24 lg:pb-24 grid lg:grid-cols-2 gap-10 items-center">
        <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }}>
          <span className="chip bg-white/5 border border-white/10 text-white/80">
            <Sparkles className="h-3.5 w-3.5 text-gold-400"/>
             Live multi-asset brokerage · stocks · crypto · forex · commodities · futures · options
          </span>
          <h1 className="mt-5 text-4xl sm:text-5xl lg:text-6xl font-display leading-[1.05] tracking-tight">
            One brokerage account for{' '}
            <span className="text-gradient-gold">every market</span>.
            <br />
            Engineered for{' '}
            <span className="text-gradient-neon">professional alpha</span>.
          </h1>
          <p className="mt-5 text-lg text-white/70 max-w-xl">
            Oakmont Digital Capital Group is a regulated multi-asset brokerage. Trade stocks, ETFs, indices, cryptocurrencies, forex, commodities, futures and options from a single live account, with institutional-grade custody, compliant onboarding, and admin-controlled investment servicing.
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <Link href="/brokerage" className="btn-primary">
              Explore Brokerage <ArrowRight className="h-4 w-4"/>
            </Link>
            <Link href="/signup" className="btn-gold">
              Open Account
            </Link>
            <Link href="/login?next=/investor" className="btn-ghost">
              Investor Portal
            </Link>
          </div>
          <div className="mt-8 flex flex-wrap gap-6 text-sm text-white/60">
            <span className="flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-neon-green"/> SOC 2 · ISO 27001</span>
            <span className="flex items-center gap-2"><TrendingUp className="h-4 w-4 text-gold-400"/> Live equities, FX, crypto &amp; futures</span>
            <span className="flex items-center gap-2"><Sparkles className="h-4 w-4 text-neon-orange"/> Smart order routing &amp; risk controls</span>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.15 }} className="relative">
          <div className="glass-strong p-4 shadow-soft">
            <div className="flex items-center justify-between px-1 pb-3">
              <div className="flex items-center gap-2">
                <span className="h-7 w-7 rounded-full bg-white/5 border border-white/10 inline-flex items-center justify-center text-ink-950 text-xs font-bold" style={cryptoLogoStyle('BTC')}>
                  <span className="sr-only">Bitcoin</span>
                </span>
                <div>
                  <p className="text-sm font-semibold flex items-center gap-2">
                    BTC / USDT
                    <span className={`inline-flex items-center gap-1 text-[10px] uppercase tracking-wider ${live ? 'text-neon-green' : 'text-white/40'}`}>
                      <span className={`h-1.5 w-1.5 rounded-full ${live ? 'bg-neon-green animate-pulse' : 'bg-white/30'}`}/>
                      {live ? 'live' : 'connecting'}
                    </span>
                  </p>
                  <p className="text-[11px] text-white/50">Bitcoin · Spot · Binance</p>
                </div>
              </div>
              <div className="text-right">
                <p className={`text-lg font-semibold ${pctClass}`}>{formatUSD(btc.price)}</p>
                <p className={`text-xs ${pctClass}`}>{formatPct(btc.pct)} (24h)</p>
              </div>
            </div>
            <div className="rounded-xl bg-ink-900/60 border border-cyan/10 p-2">
              <div className="mb-2 flex items-center justify-between px-1 text-[11px] text-white/45">
                <span className={chartLive ? 'text-neon-green' : 'text-white/45'}>{chartLive ? 'Binance live candles' : 'Connecting to Binance candles'}</span>
                <span>Updated {chartUpdatedLabel}</span>
              </div>
              <div className="aspect-[16/9]">
                <CandlestickChart data={candles} animate={false}/>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-2 pt-3">
              <div className="glass-light px-3 py-2 text-center">
                <p className="text-[10px] text-white/50">24h high</p>
                <p className="text-sm font-semibold text-neon-green">{formatUSD(btc.high || 0)}</p>
              </div>
              <div className="glass-light px-3 py-2 text-center">
                <p className="text-[10px] text-white/50">24h low</p>
                <p className="text-sm font-semibold text-neon-red">{formatUSD(btc.low || 0)}</p>
              </div>
              <div className="glass-light px-3 py-2 text-center">
                <p className="text-[10px] text-white/50">24h change</p>
                <p className={`text-sm font-semibold ${pctClass}`}>{formatPct(btc.pct)}</p>
              </div>
            </div>
          </div>
          <motion.div animate={{ y: [0, -8, 0] }} transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }} className="hidden md:flex absolute -bottom-6 -left-6 glass p-3 items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-neon-grad inline-flex items-center justify-center text-ink-950">
              <Sparkles className="h-4 w-4"/>
            </div>
            <div>
              <p className="text-xs text-white/60">Live BTC trend</p>
              <p className={`text-sm font-semibold ${btc.pct >= 0 ? 'text-neon-green' : 'text-neon-red'}`}>
                {live ? `${btc.pct >= 0 ? 'Up' : 'Down'} ${formatPct(btc.pct)} today` : 'Connecting to market feed'}
              </p>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </section>);
}

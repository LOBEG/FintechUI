'use client';
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Users, BarChart3, Coins, Globe2 } from 'lucide-react';
import { useLivePrices, DEFAULT_TICKER_SYMBOLS } from '@/lib/useLiveData';

function formatBigUSD(n) {
    if (!n || !isFinite(n)) return '-';
    if (n >= 1e12) return `$${(n / 1e12).toFixed(2)}T`;
    if (n >= 1e9) return `$${(n / 1e9).toFixed(2)}B`;
    if (n >= 1e6) return `$${(n / 1e6).toFixed(2)}M`;
    return `$${Math.round(n).toLocaleString()}`;
}

export function Stats() {
    const live = useLivePrices(DEFAULT_TICKER_SYMBOLS);
    // Compute aggregate values from live tickers so the section updates daily/continuously.
    const aggregate = Object.values(live).reduce(
        (a, v) => ({
            vol: a.vol + (v && v.quoteVol ? Number(v.quoteVol) : 0),
            count: a.count + (v ? 1 : 0),
        }),
        { vol: 0, count: 0 }
    );
    const liveReady = aggregate.count > 0;
    const stats = [
        {
            label: '24h Trading Volume',
            value: aggregate.vol > 0 ? formatBigUSD(aggregate.vol) : 'Connecting',
            icon: BarChart3,
            accent: 'text-accent-success',
        },
        {
            label: 'Live Price Feed',
            value: liveReady ? 'Binance' : 'Connecting',
            icon: Users,
            accent: 'text-blue-400',
        },
        {
            label: 'Tracked Public Assets',
            value: liveReady ? `${aggregate.count}` : 'Connecting',
            icon: Coins,
            accent: 'text-blue-400',
        },
        {
            label: 'Account Controls',
            value: 'KYC + Admin',
            icon: Globe2,
            accent: 'text-white',
        },
    ];
    const [updated, setUpdated] = useState('');
    useEffect(() => {
        const fmt = () => new Date().toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
        setUpdated(fmt());
        const id = setInterval(() => setUpdated(fmt()), 60_000);
        return () => clearInterval(id);
    }, []);
    return (<section className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s, i) => {
            const Icon = s.icon;
            return (<motion.div key={s.label} initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: '-80px' }} transition={{ duration: 0.5, delay: i * 0.05 }} className="glass p-6">
              <div className="flex items-center justify-between">
                <Icon className={`h-5 w-5 ${s.accent}`}/>
                <span className="text-xs text-white/40">Live</span>
              </div>
              <p className="mt-6 text-3xl font-display tracking-tight">{s.value}</p>
              <p className="text-sm text-white/55 mt-1">{s.label}</p>
            </motion.div>);
        })}
      </div>
      {updated && (
        <p className="mt-3 text-[11px] text-white/40 text-right">Updated {updated}</p>
      )}
    </section>);
}

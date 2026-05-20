'use client';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { DonutChart } from '@/components/ui/Charts';
import { ArrowUpRight, TrendingUp } from 'lucide-react';
const allocation = [
    { label: 'Stocks', value: 28, color: '#22d3ee' },
    { label: 'ETFs', value: 22, color: '#c9a24a' },
    { label: 'Crypto', value: 20, color: '#f7931a' },
    { label: 'FX', value: 14, color: '#10b981' },
    { label: 'Futures', value: 10, color: '#8b5cf6' },
    { label: 'Options', value: 6, color: '#ff8a00' },
];
export function PortfolioGrowth() {
    return (<section className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-20">
      <div className="grid lg:grid-cols-5 gap-8 items-center">
        <div className="lg:col-span-3">
          <motion.h2 initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-3xl sm:text-4xl font-display">
            Compound your <span className="text-gradient-gold">portfolio</span> with
            disciplined strategy.
          </motion.h2>
          <p className="mt-3 text-white/65 max-w-xl">
            Oakmont Digital Capital Group separates public multi-asset market visibility from private account servicing. Visitors see live brokerage coverage across stocks, ETFs, crypto, FX, commodities, futures and options; verified users manage balances and orders; funded clients receive administrator-supervised portfolio updates and reporting.
          </p>
          <div className="mt-8 grid sm:grid-cols-3 gap-4">
            {[
            { k: 'Live markets', v: '24/7', s: 'Crypto plus exchange-hour equities, ETFs, FX and futures' },
            { k: 'Account control', v: 'KYC', s: 'Verified access to trading workflows' },
            { k: 'Reporting', v: 'Live', s: 'Portfolio records update from real activity' },
        ].map((m) => (<div key={m.k} className="glass p-4">
                <p className="text-xs text-white/50">{m.k}</p>
                <p className="text-2xl font-display mt-1">{m.v}</p>
                <p className="text-xs text-white/50 mt-1">{m.s}</p>
              </div>))}
          </div>
        </div>
        <motion.div initial={{ opacity: 0, scale: 0.95 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} className="lg:col-span-2 glass-strong p-6 flex flex-col items-center">
          <div className="w-full flex items-center justify-between">
            <p className="text-sm text-white/60">Brokerage asset-class coverage</p>
            <span className="chip bg-gold-500/15 text-gold-400 border border-gold-500/30">
              <TrendingUp className="h-3 w-3"/> Live coverage
            </span>
          </div>
          <DonutChart data={allocation} size={220}/>
          <div className="mt-4 grid grid-cols-2 gap-x-6 gap-y-2 w-full">
            {allocation.map((a) => (<div key={a.label} className="flex items-center gap-2 text-xs text-white/70">
                <span className="h-2.5 w-2.5 rounded-full" style={{ background: a.color }}/>
                <span>{a.label}</span>
                <span className="ml-auto text-white/90 font-medium">{a.value}%</span>
              </div>))}
          </div>
          <Link href="/login?next=/investor" className="btn-outline mt-5 w-full justify-center text-sm">
            Open portfolio dashboard <ArrowUpRight className="h-4 w-4"/>
          </Link>
        </motion.div>
      </div>
    </section>);
}

'use client';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Bot, Zap, Brain, LineChart, Cpu, ShieldCheck } from 'lucide-react';
import { Sparkline } from '@/components/ui/Charts';
import { cryptoLogoStyle } from '@/lib/cryptoLogos';
import { useSession } from '@/lib/useSession';
const strategies = [
    { name: 'Crypto DCA planner · BTC/USDT', ret: 'Live', win: 'Risk rules active', seed: 3, symbol: 'BTC' },
    { name: 'Equity momentum watch · AAPL', ret: 'Live', win: 'Brokerage feed active', seed: 7, icon: LineChart },
    { name: 'Cross-asset portfolio guardrails', ret: 'Live', win: 'Controls enabled', seed: 4, icon: ShieldCheck },
];
export function AIBot() {
    const { user, loading } = useSession();
    return (<section className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16 sm:py-20">
      <div className="grid lg:grid-cols-2 gap-8 sm:gap-10 items-center">
        <motion.div initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}>
          <span className="chip bg-accent-success/10 text-accent-success border border-accent-success/30">
            <Bot className="h-3.5 w-3.5"/> Oakmont Intelligence
          </span>
          <h2 className="mt-4 text-3xl sm:text-4xl font-display leading-tight">
            Live <span className="text-gradient-primary">market intelligence</span>.
          </h2>
          <p className="mt-3 text-white/65 max-w-lg leading-relaxed">
            Oakmont Intelligence helps clients monitor live crypto, equities, ETFs, forex, commodities, futures and options market data, order-book conditions, and portfolio risk so every strategy remains visible, auditable, and aligned with account controls.
          </p>
          <ul className="mt-6 space-y-3 text-sm leading-relaxed">
            <li className="flex gap-3"><Zap className="h-5 w-5 text-accent-success flex-shrink-0"/> Live multi-asset pricing, order routing, and transaction records in one account view</li>
            <li className="flex gap-3"><Brain className="h-5 w-5 text-accent-success flex-shrink-0"/> Data-driven monitoring for DCA, momentum, and risk-based allocation decisions</li>
            <li className="flex gap-3"><LineChart className="h-5 w-5 text-accent-success flex-shrink-0"/> Portfolio reporting built from deposits, withdrawals, investments, and admin-approved adjustments</li>
            <li className="flex gap-3"><Cpu className="h-5 w-5 text-white flex-shrink-0"/> Secure workflows for verified users across desktop and mobile</li>
          </ul>
          <div className="mt-6 flex flex-col sm:flex-row flex-wrap gap-3">
            <Link href={!loading && user ? '/dashboard/analytics#live-signals' : '/ai-trading-bot'} className="btn-primary w-full sm:w-auto">
              View all live signals
            </Link>
            <Link href={!loading && user ? '/dashboard/analytics#live-signals' : '/signup'} className="btn-ghost w-full sm:w-auto">
              {!loading && user ? 'Open bot in dashboard' : 'Create account'}
            </Link>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, x: 20, scale: 0.98 }} whileInView={{ opacity: 1, x: 0, scale: 1 }} viewport={{ once: true }} transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }} className="glass-strong p-4 sm:p-5">
          <div className="flex items-center justify-between">
            <p className="text-sm text-white/60">Active strategies</p>
            <span className="chip bg-accent-success/15 text-accent-success border border-accent-success/30">● Running</span>
          </div>
          <div className="mt-4 space-y-3">
            {strategies.map((s) => {
                const Icon = s.icon;
                return (<div key={s.name} className="glass-light p-4 flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-gradient-primary inline-flex items-center justify-center text-ink-950">
                  {s.symbol ? <span className="h-7 w-7 rounded-full bg-white/5" style={cryptoLogoStyle(s.symbol)} aria-hidden/> : <Icon className="h-5 w-5"/>}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold">{s.name}</p>
                   <p className="text-xs text-white/50">{s.win}</p>
                </div>
                <Sparkline seed={s.seed} positive/>
                <span className="text-sm font-semibold text-accent-success">{s.ret}</span>
              </div>);
            })}
          </div>
        </motion.div>
      </div>
    </section>);
}

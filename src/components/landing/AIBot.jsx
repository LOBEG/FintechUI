'use client';
import { motion } from 'framer-motion';
import { Bot, Zap, Brain, LineChart, Cpu, ShieldCheck } from 'lucide-react';
import { Sparkline } from '@/components/ui/Charts';
import { cryptoLogoStyle } from '@/lib/cryptoLogos';
const strategies = [
    { name: 'Crypto DCA planner · BTC/USDT', ret: 'Live', win: 'Risk rules active', seed: 3, symbol: 'BTC' },
    { name: 'Equity momentum watch · AAPL', ret: 'Live', win: 'Brokerage feed active', seed: 7, icon: LineChart },
    { name: 'Cross-asset portfolio guardrails', ret: 'Live', win: 'Controls enabled', seed: 4, icon: ShieldCheck },
];
export function AIBot() {
    return (<section className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-20">
      <div className="grid lg:grid-cols-2 gap-10 items-center">
        <motion.div initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }}>
          <span className="chip bg-neon-green/10 text-neon-green border border-neon-green/30">
            <Bot className="h-3.5 w-3.5"/> Aurelia AI
          </span>
          <h2 className="mt-4 text-3xl sm:text-4xl font-display">
            AI-powered <span className="text-gradient-neon">trading intelligence</span>.
          </h2>
          <p className="mt-3 text-white/65 max-w-lg">
            Aurelia helps clients monitor live crypto, equities, ETFs, forex, commodities, futures and options market data, order-book conditions, and portfolio risk so every strategy remains visible, auditable, and aligned with account controls.
          </p>
          <ul className="mt-6 space-y-3 text-sm">
            <li className="flex gap-3"><Zap className="h-5 w-5 text-neon-green flex-shrink-0"/> Live multi-asset pricing, order routing, and transaction records in one account view</li>
            <li className="flex gap-3"><Brain className="h-5 w-5 text-gold-400 flex-shrink-0"/> AI-assisted monitoring for DCA, momentum, and risk-based allocation decisions</li>
            <li className="flex gap-3"><LineChart className="h-5 w-5 text-neon-orange flex-shrink-0"/> Portfolio reporting built from deposits, withdrawals, investments, and admin-approved adjustments</li>
            <li className="flex gap-3"><Cpu className="h-5 w-5 text-white flex-shrink-0"/> Secure workflows for verified users across desktop and mobile</li>
          </ul>
        </motion.div>

        <motion.div initial={{ opacity: 0, x: 20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }} className="glass-strong p-5">
          <div className="flex items-center justify-between">
            <p className="text-sm text-white/60">Active strategies</p>
            <span className="chip bg-neon-green/15 text-neon-green border border-neon-green/30">● Running</span>
          </div>
          <div className="mt-4 space-y-3">
            {strategies.map((s) => {
                const Icon = s.icon;
                return (<div key={s.name} className="glass-light p-4 flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-neon-grad inline-flex items-center justify-center text-ink-950">
                  {s.symbol ? <span className="h-7 w-7 rounded-full bg-white/5" style={cryptoLogoStyle(s.symbol)} aria-hidden/> : <Icon className="h-5 w-5"/>}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold">{s.name}</p>
                   <p className="text-xs text-white/50">{s.win}</p>
                </div>
                <Sparkline seed={s.seed} positive/>
                <span className="text-sm font-semibold text-neon-green">{s.ret}</span>
              </div>);
            })}
          </div>
        </motion.div>
      </div>
    </section>);
}

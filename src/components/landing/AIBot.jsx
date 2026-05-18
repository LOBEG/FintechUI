'use client';
import { motion } from 'framer-motion';
import { Bot, Zap, Brain, LineChart, Cpu } from 'lucide-react';
import { Sparkline } from '@/components/ui/Charts';
const strategies = [
    { name: 'Grid Bot · SOL/USDT', ret: '+6.4%', win: '78%', seed: 3 },
    { name: 'DCA · BTC', ret: '+12.1%', win: '92%', seed: 7 },
    { name: 'Arbitrage · ETH', ret: '+3.8%', win: '88%', seed: 4 },
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
            Aurelia analyzes 12,000+ signals per second across order books, on-chain flows, sentiment, and macro
            data — executing precision strategies with sub-millisecond latency.
          </p>
          <ul className="mt-6 space-y-3 text-sm">
            <li className="flex gap-3"><Zap className="h-5 w-5 text-neon-green flex-shrink-0"/> Sub-ms execution across 80+ liquidity venues</li>
            <li className="flex gap-3"><Brain className="h-5 w-5 text-gold-400 flex-shrink-0"/> Multi-model AI: LSTM, transformer, reinforcement learning</li>
            <li className="flex gap-3"><LineChart className="h-5 w-5 text-neon-orange flex-shrink-0"/> Risk-managed grid, DCA, arbitrage & market-making</li>
            <li className="flex gap-3"><Cpu className="h-5 w-5 text-white flex-shrink-0"/> Backtest, paper-trade, then deploy with one click</li>
          </ul>
        </motion.div>

        <motion.div initial={{ opacity: 0, x: 20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }} className="glass-strong p-5">
          <div className="flex items-center justify-between">
            <p className="text-sm text-white/60">Active strategies</p>
            <span className="chip bg-neon-green/15 text-neon-green border border-neon-green/30">● Running</span>
          </div>
          <div className="mt-4 space-y-3">
            {strategies.map((s) => (<div key={s.name} className="glass-light p-4 flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-neon-grad inline-flex items-center justify-center text-ink-950">
                  <Bot className="h-5 w-5"/>
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold">{s.name}</p>
                  <p className="text-xs text-white/50">Win rate {s.win}</p>
                </div>
                <Sparkline seed={s.seed} positive/>
                <span className="text-sm font-semibold text-neon-green">{s.ret}</span>
              </div>))}
          </div>
        </motion.div>
      </div>
    </section>);
}

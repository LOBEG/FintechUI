'use client';
import { motion } from 'framer-motion';
import { TrendingUp, BookOpen, Brain, Globe2 } from 'lucide-react';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { MobileBottomNav } from '@/components/layout/MobileBottomNav';
import { Sparkline } from '@/components/ui/Charts';
const insights = [
    { tag: 'Macro', title: 'Rate cuts ahead: re-rating risk assets', author: 'AurumX Research', time: '2h ago', desc: 'Dovish FOMC commentary suggests a constructive setup for BTC and tech-heavy crypto majors into Q4.', color: 'text-neon-green' },
    { tag: 'On-chain', title: 'Bitcoin: dormant supply hits 14-yr high', author: 'Aurelia AI', time: '5h ago', desc: 'Long-term holder cohort behavior signals accumulation; exchange balances at multi-year lows.', color: 'text-gold-400' },
    { tag: 'Equities', title: 'AI capex cycle vs. crypto correlation', author: 'AurumX Research', time: '1d ago', desc: 'We dissect the rolling 30-day correlation between NDX and BTC, and what it implies for portfolio construction.', color: 'text-neon-orange' },
    { tag: 'DeFi', title: 'RWA tokenization: a $30T opportunity', author: 'AurumX Research', time: '2d ago', desc: 'Tokenized treasuries, private credit, and real estate are catalyzing institutional flows into on-chain markets.', color: 'text-white' },
];
export default function InsightsPage() {
    return (<main className="pb-20 lg:pb-0">
      <Navbar />
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-12 pb-6">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
          <span className="chip bg-neon-green/15 text-neon-green border border-neon-green/30">
            <Brain className="h-3.5 w-3.5"/> Market Insights
          </span>
          <h1 className="mt-4 text-3xl sm:text-4xl font-display">
            Institutional <span className="text-gradient-neon">research & intelligence</span>.
          </h1>
          <p className="mt-2 text-white/65 max-w-2xl">
            Daily macro briefings, on-chain analytics, and AI-curated market intelligence from the AurumX research desk and Aurelia AI.
          </p>
        </motion.div>
      </section>

      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 grid lg:grid-cols-2 gap-4">
        {insights.map((i, idx) => (<motion.article key={i.title} initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: idx * 0.05 }} className="glass-strong p-6">
            <div className="flex items-center gap-2 text-xs">
              <span className={`chip bg-white/5 border border-white/10 ${i.color}`}>{i.tag}</span>
              <span className="text-white/45">{i.time} · {i.author}</span>
            </div>
            <h2 className="mt-3 text-xl font-display">{i.title}</h2>
            <p className="mt-2 text-sm text-white/65">{i.desc}</p>
            <div className="mt-4 flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs text-white/60">
                <TrendingUp className="h-4 w-4 text-neon-green"/> 1,284 reads
              </div>
              <Sparkline seed={idx + 11} positive width={120} height={32}/>
            </div>
          </motion.article>))}
      </section>

      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 mt-10 mb-12 grid md:grid-cols-3 gap-4">
        {[
            { icon: BookOpen, t: 'Daily Briefings', d: 'Pre-market and Asia-open commentary delivered by 6 AM local.' },
            { icon: Brain, t: 'AI Signals', d: 'Curated Aurelia AI trade ideas with confidence intervals.' },
            { icon: Globe2, t: 'Macro Calendar', d: 'CPI, FOMC, NFP and crypto-native catalysts in one place.' },
        ].map((c) => {
            const Icon = c.icon;
            return (<div key={c.t} className="glass p-5">
              <Icon className="h-5 w-5 text-gold-400"/>
              <p className="mt-3 font-semibold">{c.t}</p>
              <p className="text-sm text-white/65 mt-1">{c.d}</p>
            </div>);
        })}
      </section>

      <Footer />
      <MobileBottomNav />
    </main>);
}

import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { MobileBottomNav } from '@/components/layout/MobileBottomNav';
import { Bot, Zap, Target, TrendingUp } from 'lucide-react';

export const metadata = {
    title: 'AI Trading Bot - AurumX',
    description: 'Automated crypto trading powered by machine learning and quantitative strategies.',
};

export default function AITradingBotPage() {
    return (<>
      <Navbar />
      <main className="pt-24 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl sm:text-5xl font-display">
            <span className="text-gradient-neon">AI Trading Bot</span> by AurumX
          </h1>
          <p className="mt-4 text-lg text-white/70">
            AI-assisted trading tools for monitoring live crypto markets, building disciplined DCA plans, and reviewing risk signals before action. AurumX keeps automation inside account controls, transparent records, and client-approved execution workflows.
          </p>
          <div className="mt-10 grid gap-6 sm:grid-cols-2">
            <div className="glass p-6 rounded-xl">
              <Bot className="h-8 w-8 text-neon-green mb-3"/>
              <h3 className="text-lg font-semibold">Smart Grid Bot</h3>
              <p className="mt-2 text-sm text-white/60">
                Place buy and sell orders at preset intervals. Profits from range-bound markets. Backtested on 3 years of data with 12% average annualised return.
              </p>
            </div>
            <div className="glass p-6 rounded-xl">
              <Zap className="h-8 w-8 text-gold-400 mb-3"/>
              <h3 className="text-lg font-semibold">Momentum Algorithm</h3>
              <p className="mt-2 text-sm text-white/60">
                Detects breakout patterns using volume and price action signals. Allocates capital dynamically based on risk-adjusted returns.
              </p>
            </div>
            <div className="glass p-6 rounded-xl">
              <Target className="h-8 w-8 text-cyan mb-3"/>
              <h3 className="text-lg font-semibold">DCA Strategy</h3>
              <p className="mt-2 text-sm text-white/60">
                Dollar-cost averaging with intelligent timing. Scale in during dips, scale out near resistance. Adjust frequency and allocation on the fly.
              </p>
            </div>
            <div className="glass p-6 rounded-xl">
              <TrendingUp className="h-8 w-8 text-neon-orange mb-3"/>
              <h3 className="text-lg font-semibold">Performance Analytics</h3>
              <p className="mt-2 text-sm text-white/60">
                Real-time Sharpe ratio, max drawdown, and win rate tracking. Compare against buy-and-hold benchmarks. Export reports for tax filing.
              </p>
            </div>
          </div>
          <div className="mt-10 flex gap-4">
            <a href="/signup" className="btn-primary">Activate AI Bot</a>
                 <a href="/login?next=/dashboard" className="btn-ghost">View Strategies</a>
          </div>
        </div>
      </main>
      <Footer />
      <MobileBottomNav />
    </>);
}

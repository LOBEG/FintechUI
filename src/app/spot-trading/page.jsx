import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { MobileBottomNav } from '@/components/layout/MobileBottomNav';
import { TrendingUp, Zap, Shield, Clock } from 'lucide-react';

export const metadata = {
    title: 'Crypto Brokerage - Oakmont Digital Markets Group',
    description: 'Trade BTC, ETH, USDT and major digital assets from the live Oakmont Digital Markets Group brokerage hub.',
};

export default function SpotTradingPage() {
    return (<>
      <Navbar />
      <main className="pt-24 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl sm:text-5xl font-display">
            <span className="text-gradient-gold">Spot Trading</span> on Oakmont Digital Markets Group
          </h1>
          <p className="mt-4 text-lg text-white/70">
            Trade Bitcoin, Ethereum, and supported digital assets through a live market interface built for transparent pricing, user-level account controls, portfolio records, and secure settlement workflows.
          </p>
          <div className="mt-10 grid gap-6 sm:grid-cols-2">
            <div className="glass p-6 rounded-xl">
              <TrendingUp className="h-8 w-8 text-neon-green mb-3"/>
              <h3 className="text-lg font-semibold">Deep Liquidity</h3>
              <p className="mt-2 text-sm text-white/60">
                Access live market pricing through Binance-backed feeds and supported liquidity routes, with clear execution records for every completed investment or sell order.
              </p>
            </div>
            <div className="glass p-6 rounded-xl">
              <Zap className="h-8 w-8 text-gold-400 mb-3"/>
              <h3 className="text-lg font-semibold">Low Latency Execution</h3>
              <p className="mt-2 text-sm text-white/60">
                Sub-10ms order placement. Collocated infrastructure ensures your trades execute at the best available price.
              </p>
            </div>
            <div className="glass p-6 rounded-xl">
              <Shield className="h-8 w-8 text-cyan mb-3"/>
              <h3 className="text-lg font-semibold">Transparent Fees</h3>
              <p className="mt-2 text-sm text-white/60">
                Zero maker fees, 0.08% taker fees. Volume-based rebates for accounts over £100k. No hidden charges.
              </p>
            </div>
            <div className="glass p-6 rounded-xl">
              <Clock className="h-8 w-8 text-neon-orange mb-3"/>
              <h3 className="text-lg font-semibold">24/7 Markets</h3>
              <p className="mt-2 text-sm text-white/60">
                Round-the-clock trading with continuous settlement. Instant GBP, EUR, and USD deposits via bank transfer or card.
              </p>
            </div>
          </div>
          <div className="mt-10 flex gap-4">
             <a href="/brokerage?tab=crypto" className="btn-primary">Open Live Crypto Brokerage</a>
                  <a href="/login?next=/dashboard" className="btn-ghost">View Account Dashboard</a>
          </div>
        </div>
      </main>
      <Footer />
      <MobileBottomNav />
    </>);
}

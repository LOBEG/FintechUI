import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { MobileBottomNav } from '@/components/layout/MobileBottomNav';
import { LineChart, Percent, Gauge, Lock } from 'lucide-react';

export const metadata = {
    title: 'Futures Trading - Oakmont Digital Capital Group',
    description: 'Trade crypto futures with up to 100x leverage on BTC, ETH, and altcoins.',
};

export default function FuturesPage() {
    return (<>
      <Navbar />
      <main className="pt-24 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl sm:text-5xl font-display">
            <span className="text-gradient-gold">Futures Trading</span> on Oakmont Digital Capital Group
          </h1>
          <p className="mt-4 text-lg text-white/70">
            Professional derivatives access for clients who understand risk, margin, and liquidation mechanics. Oakmont Digital Capital Group presents futures as a controlled fintech workflow with clear margin visibility, risk alerts, and account-level governance.
          </p>
          <div className="mt-10 grid gap-6 sm:grid-cols-2">
            <div className="glass p-6 rounded-xl">
              <LineChart className="h-8 w-8 text-neon-green mb-3"/>
              <h3 className="text-lg font-semibold">Perpetual Contracts</h3>
              <p className="mt-2 text-sm text-white/60">
                No expiry dates. Hold positions indefinitely with 8-hour funding intervals. Auto-deleveraging protections and insurance fund backstop.
              </p>
            </div>
            <div className="glass p-6 rounded-xl">
              <Percent className="h-8 w-8 text-gold-400 mb-3"/>
              <h3 className="text-lg font-semibold">Flexible Leverage</h3>
              <p className="mt-2 text-sm text-white/60">
                Adjustable leverage from 1x to 100x. Cross-margin and isolated margin modes. Real-time PnL tracking and liquidation alerts.
              </p>
            </div>
            <div className="glass p-6 rounded-xl">
              <Gauge className="h-8 w-8 text-cyan mb-3"/>
              <h3 className="text-lg font-semibold">Advanced Risk Tools</h3>
              <p className="mt-2 text-sm text-white/60">
                Trailing stops, take-profit orders, bracket orders. Margin ratio monitoring with SMS and email alerts before liquidation.
              </p>
            </div>
            <div className="glass p-6 rounded-xl">
              <Lock className="h-8 w-8 text-neon-orange mb-3"/>
              <h3 className="text-lg font-semibold">Institutional Safeguards</h3>
              <p className="mt-2 text-sm text-white/60">
                Real-time mark price index from 6 exchanges. Transparent funding rates. Circuit breakers during extreme volatility.
              </p>
            </div>
          </div>
          <div className="mt-10 flex gap-4">
            <a href="/signup" className="btn-primary">Open Futures Account</a>
                 <a href="/login?next=/dashboard" className="btn-ghost">View Contracts</a>
          </div>
        </div>
      </main>
      <Footer />
      <MobileBottomNav />
    </>);
}

import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { MobileBottomNav } from '@/components/layout/MobileBottomNav';

export const metadata = {
    title: 'Risk Disclosure - Oakmont Digital Markets Groups',
    description: 'Important risk disclosure for digital asset trading on Oakmont Digital Markets Groups.',
};

export default function RiskDisclosurePage() {
    const currentDate = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    return (<>
      <Navbar />
      <main className="pt-24 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-display text-white">Risk Disclosure</h1>
          <p className="mt-2 text-sm text-white/60">Last updated: {currentDate}</p>
          
          <div className="mt-8 space-y-6 text-white/70">
            <section>
              <h2 className="text-2xl font-display text-white">1. High Volatility</h2>
              <p className="mt-2">
                Digital assets are highly volatile. Prices can fluctuate dramatically within minutes. Historical performance is not indicative of future results. You could lose your entire investment.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-display text-white">2. Leverage Risk</h2>
              <p className="mt-2">
                Trading with leverage amplifies both gains and losses. A small adverse price movement can result in liquidation of your position and loss of your entire margin deposit. Leverage is not suitable for inexperienced traders.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-display text-white">3. Market Risk</h2>
              <p className="mt-2">
                Crypto markets operate 24/7 with no circuit breakers. Flash crashes, exchange outages, and liquidity gaps can prevent you from closing positions at desired prices.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-display text-white">4. Regulatory Risk</h2>
              <p className="mt-2">
                Digital asset regulations are evolving. Regulatory changes could impact the legality, tax treatment, or value of your holdings. Some jurisdictions have banned crypto trading entirely.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-display text-white">5. Technology Risk</h2>
              <p className="mt-2">
                Blockchain networks can experience congestion, forks, or security vulnerabilities. Smart contract bugs, exchange hacks, and wallet exploits have resulted in permanent loss of funds.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-display text-white">6. Liquidity Risk</h2>
              <p className="mt-2">
                Low-cap altcoins may lack sufficient liquidity. Large orders can move the market significantly. During extreme volatility, spreads widen and orders may not execute at expected prices.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-display text-white">7. No Investment Advice</h2>
              <p className="mt-2">
                Oakmont Digital Markets Groups does not provide investment advice. All information on the platform is for informational purposes only. Consult a qualified financial adviser before making investment decisions.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-display text-white">8. Suitability</h2>
              <p className="mt-2">
                Digital asset trading is not suitable for everyone. You should only invest capital you can afford to lose. Consider your investment objectives, risk tolerance, and experience level.
              </p>
            </section>

            <section>
              <p className="mt-4 text-sm text-white/50 italic">
                By using Oakmont Digital Markets Groups, you acknowledge that you have read and understood these risks. You accept full responsibility for your trading decisions and any resulting losses.
              </p>
            </section>
          </div>
        </div>
      </main>
      <Footer />
      <MobileBottomNav />
    </>);
}

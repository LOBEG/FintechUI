import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { MobileBottomNav } from '@/components/layout/MobileBottomNav';
import { Building, Globe, Award, Users } from 'lucide-react';

export const metadata = {
    title: 'About Oakmont Digital Capital Group',
    description: 'Learn about Oakmont Digital Capital Group - institutional-grade multi-asset brokerage and investment platform.',
};

export default function AboutPage() {
    return (<>
      <div className="relative min-h-screen bg-gradient-to-br from-zinc-950/60 via-stone-900/40 to-slate-900/60">
      <Navbar />
      <main className="pt-24 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl sm:text-5xl font-display">
            About <span className="text-gradient-primary">Oakmont Digital Capital Group</span>
          </h1>
          <p className="mt-4 text-lg text-white/70">
             Oakmont Digital Capital Group is an institutional-grade multi-asset brokerage and investment platform built around live market data, secure wallet operations, audited transaction records, and administrator-controlled investment servicing. We serve high-net-worth individuals, family offices, and corporate treasury teams that need transparent access to stocks, ETFs, crypto, forex, commodities, futures and options.
          </p>
          <div className="mt-10 grid gap-6 sm:grid-cols-2">
            <div className="glass p-6 rounded-xl">
              <Building className="h-8 w-8 text-accent-success mb-3"/>
              <h3 className="text-lg font-semibold">Regulated Entity</h3>
              <p className="mt-2 text-sm text-white/60">
                 Authorised financial-services workflows with KYC, AML, sanctions screening, client-asset controls, and disclosures aligned to each supported brokerage asset class.
              </p>
            </div>
            <div className="glass p-6 rounded-xl">
              <Globe className="h-8 w-8 text-slate-400 mb-3"/>
              <h3 className="text-lg font-semibold">Global Presence</h3>
              <p className="mt-2 text-sm text-white/60">
                Headquartered in London with offices in Singapore and Dubai. Serving clients in 45 countries across Europe, Asia, and the Middle East.
              </p>
            </div>
            <div className="glass p-6 rounded-xl">
              <Award className="h-8 w-8 text-slate-400 mb-3"/>
              <h3 className="text-lg font-semibold">Industry Recognition</h3>
              <p className="mt-2 text-sm text-white/60">
                 Recognised for institutional brokerage operations, ISO 27001-aligned controls, and SOC 2 Type II-style operational governance.
              </p>
            </div>
            <div className="glass p-6 rounded-xl">
              <Users className="h-8 w-8 text-slate-400 mb-3"/>
              <h3 className="text-lg font-semibold">Experienced Team</h3>
              <p className="mt-2 text-sm text-white/60">
                 Leadership team from capital markets, brokerage, exchange, custody, and fintech operations.
              </p>
            </div>
          </div>
          <div className="mt-10">
            <h2 className="text-2xl font-display">Our Mission</h2>
            <p className="mt-3 text-white/70">
              We believe every asset class requires institutional operating discipline. Our mission is to make professional-grade brokerage access available through live pricing, compliant onboarding, clear deposit and withdrawal workflows, risk-aware portfolio tools, and transparent reporting that clients can trust.
            </p>
          </div>
        </div>
      </main>
      <Footer />
      <MobileBottomNav />
      </div>
    </>);
}

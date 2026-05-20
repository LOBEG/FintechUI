import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { MobileBottomNav } from '@/components/layout/MobileBottomNav';
import { Building2, Shield, Network, Headphones } from 'lucide-react';

export const metadata = {
    title: 'Institutional Services - Oakmont Digital Capital Group',
    description: 'Enterprise crypto solutions for institutions, family offices, and corporate treasury.',
};

export default function InstitutionalPage() {
    return (<>
      <Navbar />
      <main className="pt-24 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl sm:text-5xl font-display">
            <span className="text-gradient-gold">Institutional Services</span>
          </h1>
          <p className="mt-4 text-lg text-white/70">
            Enterprise-grade digital asset infrastructure for institutions, family offices, hedge funds, and corporate treasury teams that need live market access, custody coordination, audit-ready records, and controlled operational workflows.
          </p>
          <div className="mt-10 grid gap-6 sm:grid-cols-2">
            <div className="glass p-6 rounded-xl">
              <Building2 className="h-8 w-8 text-neon-green mb-3"/>
              <h3 className="text-lg font-semibold">Prime Brokerage</h3>
              <p className="mt-2 text-sm text-white/60">
                Unified access to spot, futures, OTC workflows, and portfolio records with consolidated reporting across client accounts and administrator-approved servicing actions.
              </p>
            </div>
            <div className="glass p-6 rounded-xl">
              <Shield className="h-8 w-8 text-gold-400 mb-3"/>
              <h3 className="text-lg font-semibold">Qualified Custody</h3>
              <p className="mt-2 text-sm text-white/60">
                Multi-signature cold storage with geographically distributed keys. Lloyds of London insurance up to £100M. SOC 2 Type II audited.
              </p>
            </div>
            <div className="glass p-6 rounded-xl">
              <Network className="h-8 w-8 text-cyan mb-3"/>
              <h3 className="text-lg font-semibold">OTC Trading Desk</h3>
              <p className="mt-2 text-sm text-white/60">
                Block trades with minimal slippage. Settlement via DVP or escrow. Access to institutional counterparty network for large tickets.
              </p>
            </div>
            <div className="glass p-6 rounded-xl">
              <Headphones className="h-8 w-8 text-neon-orange mb-3"/>
              <h3 className="text-lg font-semibold">Dedicated Support</h3>
              <p className="mt-2 text-sm text-white/60">
                24/7 institutional support desk. Assigned account manager. Direct API integration assistance and co-location options.
              </p>
            </div>
          </div>
          <div className="mt-10">
            <h2 className="text-2xl font-display">Who We Serve</h2>
            <ul className="mt-4 space-y-2 text-white/70">
              <li>• Hedge funds and asset managers</li>
              <li>• Family offices and HNW individuals</li>
              <li>• Corporate treasuries managing digital asset reserves</li>
              <li>• Exchanges and market makers requiring prime services</li>
            </ul>
          </div>
          <div className="mt-10">
            <a href="mailto:institutional@oakmontdigitalcapital.com" className="btn-primary">Contact Institutional Team</a>
          </div>
        </div>
      </main>
      <Footer />
      <MobileBottomNav />
    </>);
}

import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { MobileBottomNav } from '@/components/layout/MobileBottomNav';
import Link from 'next/link';
import { Users, Shield, Briefcase, Award } from 'lucide-react';

export const metadata = {
    title: 'Managed Accounts - Oakmont Digital Markets Group',
    description: 'Discretionary multi-asset portfolio management for qualified investors using live brokerage reporting.',
};

export default function ManagedAccountsPage() {
    return (<>
      <div className="relative min-h-screen bg-gradient-to-br from-accent-success950/30 via-slate-950/60 to-slate-900/60">
      <Navbar />
      <main className="pt-24 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl sm:text-5xl font-display">
            <span className="text-gradient-primary">Managed Accounts</span> by Oakmont Digital Markets Group
          </h1>
          <p className="mt-4 text-lg text-white/70">
            Discretionary multi-asset portfolio management for qualified investors and institutions that need professional allocation, admin-supervised balance changes, risk controls, and live reporting instead of self-directed speculation.
          </p>
          <div className="mt-10 grid gap-6 sm:grid-cols-2">
            <div className="glass p-6 rounded-xl">
              <Users className="h-8 w-8 text-accent-success mb-3"/>
              <h3 className="text-lg font-semibold">Dedicated Portfolio Manager</h3>
              <p className="mt-2 text-sm text-white/60">
                A dedicated desk reviews allocations, live market exposure, deposits, withdrawals, and administrator-approved adjustments with clear client communication.
              </p>
            </div>
            <div className="glass p-6 rounded-xl">
              <Shield className="h-8 w-8 text-blue-400 mb-3"/>
              <h3 className="text-lg font-semibold">Segregated Custody</h3>
              <p className="mt-2 text-sm text-white/60">
                Your assets held in isolated wallets. Qualified custodian with insurance cover up to £10M. Full transparency via real-time dashboard.
              </p>
            </div>
            <div className="glass p-6 rounded-xl">
              <Briefcase className="h-8 w-8 text-blue-400 mb-3"/>
              <h3 className="text-lg font-semibold">Bespoke Strategies</h3>
              <p className="mt-2 text-sm text-white/60">
                Conservative (BTC/ETH focus), balanced (top 20 cap-weighted), or aggressive (altcoin rotations). Defined risk limits and stop-loss protocols.
              </p>
            </div>
            <div className="glass p-6 rounded-xl">
              <Award className="h-8 w-8 text-blue-400 mb-3"/>
              <h3 className="text-lg font-semibold">Performance-Based Fees</h3>
              <p className="mt-2 text-sm text-white/60">
                1.5% management fee + 20% performance fee on gains above 8% hurdle. No lock-up. Withdraw quarterly with 30 days notice.
              </p>
            </div>
          </div>
          <div className="mt-10 flex gap-4">
            <Link href="/brokerage" className="btn-primary">Review Brokerage Coverage</Link>
            <Link href="/institutional" className="btn-ghost">Institutional Services</Link>
          </div>
        </div>
      </main>
      <Footer />
      <MobileBottomNav />
      </div>
    </>);
}

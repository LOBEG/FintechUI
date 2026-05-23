import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { MobileBottomNav } from '@/components/layout/MobileBottomNav';
import BrokerageClient from './BrokerageClient';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Brokerage - Stocks, ETFs, Crypto, Forex, Commodities, Futures & Options | Oakmont Digital Markets Groups',
  description: 'Multi-asset brokerage from Oakmont Digital Markets Groups. Live market data for stocks, ETFs, indices, crypto, forex, commodities, futures and options.',
};

export default function BrokeragePage() {
  return (
    <main className="pb-24 lg:pb-0 relative min-h-screen bg-gradient-to-br from-graphite-950/70 via-charcoal-900/50 to-slate-900/60">
      <Navbar/>
      <BrokerageClient/>
      <Footer/>
      <MobileBottomNav/>
    </main>
  );
}

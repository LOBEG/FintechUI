import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { MobileBottomNav } from '@/components/layout/MobileBottomNav';
import BrokerageClient from './BrokerageClient';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Brokerage - Stocks, ETFs, Crypto, Forex, Commodities, Futures & Options | Oakmont Digital Markets Group',
  description: 'Multi-asset brokerage from Oakmont Digital Markets Group. Live market data for stocks, ETFs, indices, crypto, forex, commodities, futures and options.',
};

export default function BrokeragePage() {
  return (
    <main className="pb-24 lg:pb-0 relative min-h-screen bg-gradient-to-br from-indigo-950/40 via-slate-950/60 to-blue-950/40">
      <Navbar/>
      <BrokerageClient/>
      <Footer/>
      <MobileBottomNav/>
    </main>
  );
}

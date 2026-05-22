import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { MobileBottomNav } from '@/components/layout/MobileBottomNav';
import MarketSignalsClient from './MarketSignalsClient';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Visible live market signals | Oakmont Digital Markets Group',
  description:
    'Visible live market signals from Oakmont Digital Markets Group, computed in real time from streaming candles across crypto, equities, ETFs, indices, forex, commodities and futures.',
};

export default function MarketSignalsPage() {
  return (
    <main className="pb-24 lg:pb-0 relative min-h-screen bg-gradient-to-br from-indigo-950/40 via-slate-950/60 to-emerald-950/30">
      <Navbar />
      <MarketSignalsClient />
      <Footer />
      <MobileBottomNav />
    </main>
  );
}

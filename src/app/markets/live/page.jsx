import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { MobileBottomNav } from '@/components/layout/MobileBottomNav';
import LiveCoverageClient from './LiveCoverageClient';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Live asset-class coverage | Oakmont Digital Markets Group',
  description:
    'Live multi-asset coverage from Oakmont Digital Markets Group: stocks, ETFs, indices, forex, commodities, futures and crypto. Real-time quotes, sparklines and live candle charts.',
};

export default function LiveCoveragePage() {
  return (
    <main className="pb-24 lg:pb-0 relative min-h-screen bg-gradient-to-br from-slate-950/70 via-slate-900/40 to-blue-950/40">
      <Navbar />
      <LiveCoverageClient />
      <Footer />
      <MobileBottomNav />
    </main>
  );
}

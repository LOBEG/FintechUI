import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { MobileBottomNav } from '@/components/layout/MobileBottomNav';
import LiveCoverageClient from './LiveCoverageClient';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Live asset-class coverage | Oakmont Digital Markets Groups',
  description:
    'Live multi-asset coverage from Oakmont Digital Markets Groups: stocks, ETFs, indices, forex, commodities, futures and crypto. Real-time quotes, sparklines and live candle charts.',
};

export default function LiveCoveragePage() {
  return (
    <main className="pb-24 lg:pb-0 relative min-h-screen bg-gradient-to-br from-charcoal-950/70 via-graphite-900/50 to-slate-900/50">
      <Navbar />
      <LiveCoverageClient />
      <Footer />
      <MobileBottomNav />
    </main>
  );
}

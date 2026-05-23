import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { MobileBottomNav } from '@/components/layout/MobileBottomNav';
import CandleVisualizationClient from './CandleVisualizationClient';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Live Candle Visualisation | Oakmont Digital Markets Groups',
  description:
    'Dedicated live candle chart visualisation page for crypto and multi-asset instruments. Stream real-time OHLCV candles from Binance and primary exchange feeds.',
};

export default function CandleVisualizationPage() {
  return (
    <main className="pb-24 lg:pb-0 relative min-h-screen bg-gradient-to-br from-slate-950/60 via-graphite-900/40 to-charcoal-950/50">
      <Navbar />
      <CandleVisualizationClient />
      <Footer />
      <MobileBottomNav />
    </main>
  );
}

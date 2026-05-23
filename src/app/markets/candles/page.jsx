import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { MobileBottomNav } from '@/components/layout/MobileBottomNav';
import CandleVisualizationClient from './CandleVisualizationClient';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Live Candle Visualisation | Oakmont Digital Capital Group',
  description:
    'Dedicated live candle chart visualisation page for crypto and multi-asset instruments. Stream real-time OHLCV candles from Binance and primary exchange feeds.',
};

export default function CandleVisualizationPage() {
  return (
    <main className="pb-24 lg:pb-0 relative min-h-screen bg-gradient-to-br from-slate-950/70 via-indigo-950/30 to-slate-900/40">
      <Navbar />
      <CandleVisualizationClient />
      <Footer />
      <MobileBottomNav />
    </main>
  );
}

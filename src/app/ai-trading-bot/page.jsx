import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { MobileBottomNav } from '@/components/layout/MobileBottomNav';
import AITradingBotClient from './AITradingBotClient';

export const dynamic = 'force-dynamic';

export const metadata = {
    title: 'AI Trading Bot - Real-Time Signals | Oakmont Digital Markets Group',
    description: 'Live AI-driven trading signals across major crypto markets - RSI, momentum, trend bias and volatility refreshed every 15 seconds.',
};

export default function AITradingBotPage() {
    return (
      <>
        <Navbar />
        <main className="pt-10 pb-20 px-4 sm:px-6 lg:px-8">
          <div className="max-w-6xl mx-auto">
            <AITradingBotClient />
          </div>
        </main>
        <Footer />
        <MobileBottomNav />
      </>
    );
}

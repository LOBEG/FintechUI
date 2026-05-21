import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { Hero } from '@/components/landing/Hero';
import { MarketTicker } from '@/components/landing/MarketTicker';
import { Stats } from '@/components/landing/Stats';
import { AIBot } from '@/components/landing/AIBot';
import { PortfolioGrowth } from '@/components/landing/PortfolioGrowth';
import { Security } from '@/components/landing/Security';
import { Testimonials } from '@/components/landing/Testimonials';
import { FAQ } from '@/components/landing/FAQ';
import { MobileBottomNav } from '@/components/layout/MobileBottomNav';
export default function HomePage() {
    return (<main className="pb-20 lg:pb-0 relative min-h-screen bg-gradient-to-br from-slate-950/60 via-slate-900/40 to-zinc-900/60">
      <Navbar />
      <Hero />
      <MarketTicker />
      <Stats />
      <AIBot />
      <PortfolioGrowth />
      <Security />
      <Testimonials />
      <FAQ />
      <Footer />
      <MobileBottomNav />
    </main>);
}

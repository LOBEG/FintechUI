import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { MobileBottomNav } from '@/components/layout/MobileBottomNav';
import { Building, Globe, Award, Users } from 'lucide-react';

export const metadata = {
    title: 'About AurumX',
    description: 'Learn about AurumX — institutional-grade digital asset platform.',
};

export default function AboutPage() {
    return (<>
      <Navbar />
      <main className="pt-24 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl sm:text-5xl font-display">
            About <span className="text-gradient-gold">AurumX</span>
          </h1>
          <p className="mt-4 text-lg text-white/70">
            AurumX is an institutional-grade cryptocurrency trading and digital asset management platform. Founded in 2021, we serve high-net-worth individuals, family offices, and corporate treasury teams.
          </p>
          <div className="mt-10 grid gap-6 sm:grid-cols-2">
            <div className="glass p-6 rounded-xl">
              <Building className="h-8 w-8 text-neon-green mb-3"/>
              <h3 className="text-lg font-semibold">Regulated Entity</h3>
              <p className="mt-2 text-sm text-white/60">
                Authorised by the FCA and registered with HMRC as a crypto asset business. Compliant with MiCA, 5AMLD, and UK financial promotions regime.
              </p>
            </div>
            <div className="glass p-6 rounded-xl">
              <Globe className="h-8 w-8 text-gold-400 mb-3"/>
              <h3 className="text-lg font-semibold">Global Presence</h3>
              <p className="mt-2 text-sm text-white/60">
                Headquartered in London with offices in Singapore and Dubai. Serving clients in 45 countries across Europe, Asia, and the Middle East.
              </p>
            </div>
            <div className="glass p-6 rounded-xl">
              <Award className="h-8 w-8 text-cyan mb-3"/>
              <h3 className="text-lg font-semibold">Industry Recognition</h3>
              <p className="mt-2 text-sm text-white/60">
                Winner of Best Institutional Crypto Platform 2023. ISO 27001 certified. SOC 2 Type II audit completed annually.
              </p>
            </div>
            <div className="glass p-6 rounded-xl">
              <Users className="h-8 w-8 text-neon-orange mb-3"/>
              <h3 className="text-lg font-semibold">Experienced Team</h3>
              <p className="mt-2 text-sm text-white/60">
                Leadership team from Goldman Sachs, Coinbase, and Binance. Combined 80+ years in capital markets and fintech.
              </p>
            </div>
          </div>
          <div className="mt-10">
            <h2 className="text-2xl font-display">Our Mission</h2>
            <p className="mt-3 text-white/70">
              We believe digital assets are the future of finance. Our mission is to make professional-grade crypto trading accessible to sophisticated investors through institutional infrastructure, transparent pricing, and best-in-class custody.
            </p>
          </div>
        </div>
      </main>
      <Footer />
      <MobileBottomNav />
    </>);
}

import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { MobileBottomNav } from '@/components/layout/MobileBottomNav';
import { Newspaper, Download, Mail } from 'lucide-react';

export const metadata = {
    title: 'Press — AurumX',
    description: 'AurumX press releases, media kit, and contact information.',
};

export default function PressPage() {
    return (<>
      <Navbar />
      <main className="pt-24 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl sm:text-5xl font-display">
            <span className="text-gradient-gold">Press</span> & Media
          </h1>
          <p className="mt-4 text-lg text-white/70">
            Latest news, press releases, and media resources from AurumX.
          </p>
          <div className="mt-10 space-y-6">
            <div className="glass p-6 rounded-xl">
              <div className="flex items-start gap-4">
                <Newspaper className="h-8 w-8 text-neon-green shrink-0"/>
                <div>
                  <h3 className="text-lg font-semibold">AurumX Launches AI-Powered Trading Bot</h3>
                  <p className="mt-1 text-sm text-white/50">15 March 2024</p>
                  <p className="mt-3 text-sm text-white/60">
                    AurumX today announced the launch of its AI-powered trading bot, offering clients automated strategies with backtested performance over 12% annualised.
                  </p>
                </div>
              </div>
            </div>
            <div className="glass p-6 rounded-xl">
              <div className="flex items-start gap-4">
                <Newspaper className="h-8 w-8 text-gold-400 shrink-0"/>
                <div>
                  <h3 className="text-lg font-semibold">AurumX Secures FCA Authorisation</h3>
                  <p className="mt-1 text-sm text-white/50">22 January 2024</p>
                  <p className="mt-3 text-sm text-white/60">
                    AurumX received full authorisation from the Financial Conduct Authority to operate as a registered crypto asset business in the United Kingdom.
                  </p>
                </div>
              </div>
            </div>
            <div className="glass p-6 rounded-xl">
              <div className="flex items-start gap-4">
                <Newspaper className="h-8 w-8 text-cyan shrink-0"/>
                <div>
                  <h3 className="text-lg font-semibold">AurumX Expands to Singapore</h3>
                  <p className="mt-1 text-sm text-white/50">10 November 2023</p>
                  <p className="mt-3 text-sm text-white/60">
                    Opening a regional headquarters in Singapore to serve institutional clients across Asia-Pacific markets.
                  </p>
                </div>
              </div>
            </div>
          </div>
          <div className="mt-10 grid sm:grid-cols-2 gap-6">
            <div className="glass p-6 rounded-xl">
              <Download className="h-8 w-8 text-neon-green mb-3"/>
              <h3 className="text-lg font-semibold">Media Kit</h3>
              <p className="mt-2 text-sm text-white/60">
                Logos, brand guidelines, and company fact sheet.
              </p>
              <a href="#" className="mt-4 inline-flex items-center text-sm text-neon-green hover:underline">
                Download Kit →
              </a>
            </div>
            <div className="glass p-6 rounded-xl">
              <Mail className="h-8 w-8 text-gold-400 mb-3"/>
              <h3 className="text-lg font-semibold">Media Enquiries</h3>
              <p className="mt-2 text-sm text-white/60">
                For press enquiries, contact our communications team.
              </p>
              <a href="mailto:press@aurumx.com" className="mt-4 inline-flex items-center text-sm text-neon-green hover:underline">
                press@aurumx.com →
              </a>
            </div>
          </div>
        </div>
      </main>
      <Footer />
      <MobileBottomNav />
    </>);
}

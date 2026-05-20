import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { MobileBottomNav } from '@/components/layout/MobileBottomNav';
import { Newspaper, Download, Mail } from 'lucide-react';

export const metadata = {
    title: 'Press - Oakmont Digital Capital Group',
    description: 'Oakmont Digital Capital Group press releases, media kit, and contact information.',
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
            Media resources for Oakmont Digital Capital Group, a fintech-grade multi-asset brokerage focused on live market data, secure trading workflows, managed account servicing, and transparent reporting.
          </p>
          <div className="mt-10 space-y-6">
            <div className="glass p-6 rounded-xl">
              <div className="flex items-start gap-4">
                <Newspaper className="h-8 w-8 text-neon-green shrink-0"/>
                <div>
                  <h3 className="text-lg font-semibold">Platform overview</h3>
                  <p className="mt-1 text-sm text-white/50">Company profile</p>
                  <p className="mt-3 text-sm text-white/60">
                    Oakmont Digital Capital Group provides public multi-asset market visibility, verified-user account access, live portfolio records, and admin-controlled investment servicing for brokerage clients.
                  </p>
                </div>
              </div>
            </div>
            <div className="glass p-6 rounded-xl">
              <div className="flex items-start gap-4">
                <Newspaper className="h-8 w-8 text-gold-400 shrink-0"/>
                <div>
                  <h3 className="text-lg font-semibold">Security and compliance posture</h3>
                  <p className="mt-1 text-sm text-white/50">Operational controls</p>
                  <p className="mt-3 text-sm text-white/60">
                    The platform is designed around KYC, AML review, administrator approval paths, transaction auditability, and user email notifications for critical wallet activity.
                  </p>
                </div>
              </div>
            </div>
            <div className="glass p-6 rounded-xl">
              <div className="flex items-start gap-4">
                <Newspaper className="h-8 w-8 text-cyan shrink-0"/>
                <div>
                  <h3 className="text-lg font-semibold">Market data and reporting</h3>
                  <p className="mt-1 text-sm text-white/50">Live data infrastructure</p>
                  <p className="mt-3 text-sm text-white/60">
                    Oakmont Digital Capital Group displays Binance-backed pricing and candle data across public and signed-in experiences, with investor reports derived from live market feeds.
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
              <a href="mailto:press@oakmontdigitalcapital.com" className="mt-4 inline-flex items-center text-sm text-neon-green hover:underline">
                press@oakmontdigitalcapital.com →
              </a>
            </div>
          </div>
        </div>
      </main>
      <Footer />
      <MobileBottomNav />
    </>);
}

import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { MobileBottomNav } from '@/components/layout/MobileBottomNav';

export const metadata = {
    title: 'Terms of Service - AurumX',
    description: 'AurumX Terms of Service and platform user agreement.',
};

export default function TermsPage() {
    const currentDate = new Date().toLocaleDateString('en-GB', { year: 'numeric', month: 'long', day: 'numeric' });
    return (<>
      <Navbar />
      <main className="pt-24 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-display text-white">Terms of Service</h1>
          <p className="mt-2 text-sm text-white/60">Last updated: {currentDate}</p>
          
          <div className="mt-8 space-y-6 text-white/70">
            <section>
              <h2 className="text-2xl font-display text-white">1. Acceptance of Terms</h2>
              <p className="mt-2">
                By accessing or using the AurumX platform, you agree to be bound by these Terms of Service and all applicable laws and regulations. If you do not agree, you may not use the platform.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-display text-white">2. Eligibility</h2>
              <p className="mt-2">
                You must be at least 18 years old and legally capable of entering into binding contracts. Services are not available in jurisdictions where digital asset trading is prohibited.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-display text-white">3. Account Registration</h2>
              <p className="mt-2">
                You must provide accurate, current, and complete information during registration. You are responsible for maintaining the confidentiality of your account credentials and for all activities under your account.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-display text-white">4. Trading Risks</h2>
              <p className="mt-2">
                Digital assets are highly volatile. You acknowledge the risk of total loss and that AurumX does not provide investment advice. All trading decisions are your sole responsibility.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-display text-white">5. Fees and Charges</h2>
              <p className="mt-2">
                Trading, withdrawal, and other fees are published on the platform. Fees may change with 14 days notice. You are responsible for all taxes related to your trading activity.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-display text-white">6. Prohibited Activities</h2>
              <p className="mt-2">
                You may not use the platform for money laundering, fraud, market manipulation, or any unlawful activity. AurumX reserves the right to suspend accounts and report suspicious activity to authorities.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-display text-white">7. Limitation of Liability</h2>
              <p className="mt-2">
                AurumX is not liable for losses resulting from market volatility, third-party service failures, or force majeure events. Maximum liability is limited to fees paid in the 12 months prior to the claim.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-display text-white">8. Governing Law</h2>
              <p className="mt-2">
                These Terms are governed by the laws of England and Wales. Disputes shall be resolved through arbitration in London under LCIA rules.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-display text-white">9. Contact</h2>
              <p className="mt-2">
                For questions regarding these Terms, contact <a href="mailto:legal@aurumx.com" className="text-neon-green hover:underline">legal@aurumx.com</a>.
              </p>
            </section>
          </div>
        </div>
      </main>
      <Footer />
      <MobileBottomNav />
    </>);
}

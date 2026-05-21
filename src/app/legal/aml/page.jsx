import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { MobileBottomNav } from '@/components/layout/MobileBottomNav';

export const metadata = {
    title: 'AML Policy - Oakmont Digital Markets Group',
    description: 'Oakmont Digital Markets Group Anti-Money Laundering policy and compliance procedures.',
};

export default function AMLPage() {
    const currentDate = new Date().toLocaleDateString('en-GB', { year: 'numeric', month: 'long', day: 'numeric' });
    return (<>
      <Navbar />
      <main className="pt-24 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-display text-white">AML Policy</h1>
          <p className="mt-2 text-sm text-white/60">Last updated: {currentDate}</p>
          
          <div className="mt-8 space-y-6 text-white/70">
            <section>
              <h2 className="text-2xl font-display text-white">1. Commitment to AML Compliance</h2>
              <p className="mt-2">
                Oakmont Digital Markets Group is committed to preventing money laundering and terrorist financing. We comply with the UK Money Laundering Regulations 2017, 5th Anti-Money Laundering Directive, and FCA guidance.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-display text-white">2. Know Your Customer (KYC)</h2>
              <p className="mt-2">
                All users must complete identity verification before trading. We require: government-issued ID, proof of address (utility bill or bank statement dated within 3 months), and source of funds declaration for deposits over £10,000.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-display text-white">3. Transaction Monitoring</h2>
              <p className="mt-2">
                We monitor all transactions for suspicious activity using automated systems and manual reviews. Red flags include: structuring deposits to avoid reporting thresholds, rapid movement of funds, transactions inconsistent with customer profile.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-display text-white">4. Enhanced Due Diligence</h2>
              <p className="mt-2">
                Politically Exposed Persons (PEPs) and high-risk jurisdictions are subject to enhanced due diligence. Additional documentation and source of wealth verification may be required.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-display text-white">5. Reporting</h2>
              <p className="mt-2">
                Suspicious Activity Reports (SARs) are filed with the National Crime Agency as required. We cooperate fully with law enforcement and regulatory investigations.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-display text-white">6. Staff Training</h2>
              <p className="mt-2">
                All staff receive annual AML training. Our Money Laundering Reporting Officer (MLRO) oversees compliance and reports directly to the board.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-display text-white">7. Contact</h2>
              <p className="mt-2">
                For AML enquiries, contact our MLRO at <a href="mailto:compliance@oakmontdigitalmarkets.com" className="text-accent-success hover:underline">compliance@oakmontdigitalmarkets.com</a>.
              </p>
            </section>
          </div>
        </div>
      </main>
      <Footer />
      <MobileBottomNav />
    </>);
}

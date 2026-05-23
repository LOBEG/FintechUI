import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { MobileBottomNav } from '@/components/layout/MobileBottomNav';

export const metadata = {
    title: 'Privacy Policy - Oakmont Digital Capital Group',
    description: 'Oakmont Digital Capital Group Privacy Policy and data protection practices.',
};

export default function PrivacyPage() {
    const currentDate = new Date().toLocaleDateString('en-GB', { year: 'numeric', month: 'long', day: 'numeric' });
    return (<>
      <Navbar />
      <main className="pt-24 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-display text-white">Privacy Policy</h1>
          <p className="mt-2 text-sm text-white/60">Last updated: {currentDate}</p>
          
          <div className="mt-8 space-y-6 text-white/70">
            <section>
              <h2 className="text-2xl font-display text-white">1. Information We Collect</h2>
              <p className="mt-2">
                We collect personal information you provide during registration (name, email, address), identity verification documents (passport, driving licence), and transaction data. We also collect device information, IP addresses, and usage analytics.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-display text-white">2. How We Use Your Information</h2>
              <p className="mt-2">
                Your information is used to: verify identity, process transactions, detect fraud, comply with AML and KYC regulations, improve our services, and communicate account updates.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-display text-white">3. Data Sharing</h2>
              <p className="mt-2">
                We do not sell your data. We share information with: identity verification providers, payment processors, regulatory authorities when required by law, and service providers under strict confidentiality agreements.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-display text-white">4. Data Retention</h2>
              <p className="mt-2">
                We retain your data for 7 years after account closure as required by financial regulations. Active account data is retained indefinitely. You may request deletion subject to legal obligations.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-display text-white">5. Your Rights</h2>
              <p className="mt-2">
                Under GDPR, you have the right to access, correct, delete, or port your data. You may object to processing or withdraw consent. Contact <a href="mailto:privacy@oakmontdigitalmarkets.com" className="text-accent-success hover:underline">privacy@oakmontdigitalmarkets.com</a> to exercise your rights.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-display text-white">6. Security</h2>
              <p className="mt-2">
                We employ AES-256 encryption, multi-factor authentication, and regular security audits. No system is 100% secure. You are responsible for protecting your account credentials.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-display text-white">7. Cookies</h2>
              <p className="mt-2">
                We use essential cookies for authentication and functional cookies for analytics. You can manage cookie preferences in your browser settings.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-display text-white">8. Contact</h2>
              <p className="mt-2">
                For privacy enquiries, contact our Data Protection Officer at <a href="mailto:privacy@oakmontdigitalmarkets.com" className="text-accent-success hover:underline">privacy@oakmontdigitalmarkets.com</a>.
              </p>
            </section>
          </div>
        </div>
      </main>
      <Footer />
      <MobileBottomNav />
    </>);
}

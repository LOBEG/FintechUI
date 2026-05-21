import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { MobileBottomNav } from '@/components/layout/MobileBottomNav';
import { Briefcase, MapPin, Clock, TrendingUp } from 'lucide-react';

export const metadata = {
    title: 'Careers - Oakmont Digital Markets Group',
    description: 'Join the Oakmont Digital Markets Group team and shape the future of digital finance.',
};

export default function CareersPage() {
    return (<>
      <Navbar />
      <main className="pt-24 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl sm:text-5xl font-display">
            Careers at <span className="text-gradient-gold">Oakmont Digital Markets Group</span>
          </h1>
          <p className="mt-4 text-lg text-white/70">
            We are building secure digital asset infrastructure for live markets, account operations, compliance workflows, and client reporting. Oakmont Digital Markets Group teams work across engineering, risk, support, and fintech operations.
          </p>
          <div className="mt-10 space-y-4">
            <div className="glass p-6 rounded-xl">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-lg font-semibold">Senior Backend Engineer</h3>
                  <div className="mt-2 flex flex-wrap gap-3 text-sm text-white/60">
                    <span className="flex items-center gap-1"><MapPin className="h-4 w-4"/> London</span>
                    <span className="flex items-center gap-1"><Clock className="h-4 w-4"/> Full-time</span>
                    <span className="flex items-center gap-1"><Briefcase className="h-4 w-4"/> Engineering</span>
                  </div>
                  <p className="mt-3 text-sm text-white/60">
                    Build resilient market-data, wallet, notification, and account-servicing systems that support real users across desktop and mobile.
                  </p>
                </div>
              </div>
            </div>
            <div className="glass p-6 rounded-xl">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-lg font-semibold">Compliance Manager</h3>
                  <div className="mt-2 flex flex-wrap gap-3 text-sm text-white/60">
                    <span className="flex items-center gap-1"><MapPin className="h-4 w-4"/> London / Remote</span>
                    <span className="flex items-center gap-1"><Clock className="h-4 w-4"/> Full-time</span>
                    <span className="flex items-center gap-1"><Briefcase className="h-4 w-4"/> Legal & Compliance</span>
                  </div>
                  <p className="mt-3 text-sm text-white/60">
                    Lead AML, KYC, and regulatory reporting. FCA/MiCA experience preferred. CAMS or equivalent certification desired.
                  </p>
                </div>
              </div>
            </div>
            <div className="glass p-6 rounded-xl">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-lg font-semibold">Quantitative Trader</h3>
                  <div className="mt-2 flex flex-wrap gap-3 text-sm text-white/60">
                    <span className="flex items-center gap-1"><MapPin className="h-4 w-4"/> Singapore</span>
                    <span className="flex items-center gap-1"><Clock className="h-4 w-4"/> Full-time</span>
                    <span className="flex items-center gap-1"><Briefcase className="h-4 w-4"/> Trading</span>
                  </div>
                  <p className="mt-3 text-sm text-white/60">
                    Develop data-led market monitoring, execution analytics, and portfolio risk tooling that can be reviewed and governed by clients and administrators.
                  </p>
                </div>
              </div>
            </div>
          </div>
          <div className="mt-10">
            <h2 className="text-2xl font-display">Why Oakmont Digital Markets Group?</h2>
            <ul className="mt-4 space-y-2 text-white/70">
              <li className="flex gap-2"><TrendingUp className="h-5 w-5 text-neon-green shrink-0 mt-0.5"/> Competitive salary + equity package</li>
              <li className="flex gap-2"><TrendingUp className="h-5 w-5 text-neon-green shrink-0 mt-0.5"/> Flexible remote/hybrid work</li>
              <li className="flex gap-2"><TrendingUp className="h-5 w-5 text-neon-green shrink-0 mt-0.5"/> Health insurance, pension, learning budget</li>
              <li className="flex gap-2"><TrendingUp className="h-5 w-5 text-neon-green shrink-0 mt-0.5"/> Work with cutting-edge crypto and fintech</li>
            </ul>
          </div>
          <div className="mt-10">
            <a href="mailto:careers@oakmontdigitalmarkets.com" className="btn-primary">Apply Now</a>
          </div>
        </div>
      </main>
      <Footer />
      <MobileBottomNav />
    </>);
}

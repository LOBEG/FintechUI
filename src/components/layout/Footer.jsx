import Link from 'next/link';
import { Send, MessageCircle } from 'lucide-react';
import { BrandLogo } from '@/components/layout/BrandLogo';
const groups = [
    {
        title: 'Platform',
        links: [
            { href: '/markets/live', label: 'Live Markets' },
            { href: '/markets/signals', label: 'Live Signals' },
            { href: '/brokerage', label: 'Brokerage' },
            { href: '/dashboard', label: 'Trading Dashboard' },
            { href: '/investor', label: 'Investor Portal' },
            { href: '/admin', label: 'Admin Console' },
            { href: '/insights', label: 'Market Insights' },
        ],
    },
    {
        title: 'Products',
        links: [
            { href: '/brokerage?tab=crypto', label: 'Crypto Trading' },
            { href: '/brokerage?tab=stocks', label: 'Stocks & ETFs' },
            { href: '/brokerage?tab=futures', label: 'Futures' },
            { href: '/brokerage?tab=options', label: 'Options' },
            { href: '/ai-trading-bot', label: 'Markets Intelligence' },
        ],
    },
    {
        title: 'Company',
        links: [
            { href: '/about', label: 'About' },
            { href: '/careers', label: 'Careers' },
            { href: '/press', label: 'Press' },
            { href: '/institutional', label: 'Institutional' },
        ],
    },
    {
        title: 'Legal',
        links: [
            { href: '/legal/terms', label: 'Terms of Service' },
            { href: '/legal/privacy', label: 'Privacy Policy' },
            { href: '/legal/aml', label: 'AML Policy' },
            { href: '/legal/risk-disclosure', label: 'Risk Disclosure' },
        ],
    },
];
export function Footer() {
    return (<footer className="relative mt-20 sm:mt-24 border-t border-white/5 bg-ink-950/80">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12 sm:py-14">
        <div className="grid grid-cols-2 md:grid-cols-6 gap-8 sm:gap-10">
          <div className="col-span-2">
            <BrandLogo compact textClassName="text-xl" />
            <p className="mt-4 text-sm text-white/60 max-w-xs leading-relaxed">
              Institutional-grade multi-asset brokerage for stocks, ETFs, crypto, forex, commodities, futures and options - secure, regulated, and engineered for performance.
            </p>
            <div className="mt-5 flex items-center gap-3">
              <a href="https://t.me/" aria-label="Telegram" className="p-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10"><Send className="h-4 w-4"/></a>
              <a href="https://wa.me/" aria-label="WhatsApp" className="p-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10"><MessageCircle className="h-4 w-4"/></a>
            </div>
          </div>
          {groups.map((g) => (<div key={g.title}>
              <h4 className="text-sm font-semibold text-white">{g.title}</h4>
              <ul className="mt-3 space-y-2">
                {g.links.map((l) => (<li key={l.label}>
                    <Link href={l.href} className="text-sm text-white/60 hover:text-white transition">{l.label}</Link>
                  </li>))}
              </ul>
            </div>))}
        </div>
        <div className="mt-10 pt-6 border-t border-white/5 flex flex-col md:flex-row gap-3 items-center justify-between">
          <p className="text-xs text-white/50">© {new Date().getFullYear()} Oakmont Digital Markets Group Ltd. All rights reserved. Registered with applicable regulatory bodies.</p>
          <p className="text-xs text-white/40">Markets are volatile. Trade and invest responsibly.</p>
        </div>
      </div>
    </footer>);
}

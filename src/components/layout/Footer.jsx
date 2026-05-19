import Link from 'next/link';
import { Send, MessageCircle, Sparkles } from 'lucide-react';
const groups = [
    {
        title: 'Platform',
        links: [
            { href: '/dashboard', label: 'Trading Dashboard' },
            { href: '/investor', label: 'Investor Portal' },
            { href: '/admin', label: 'Admin Console' },
            { href: '/insights', label: 'Market Insights' },
        ],
    },
    {
        title: 'Products',
        links: [
            { href: '/spot-trading', label: 'Spot Trading' },
            { href: '/futures', label: 'Futures' },
            { href: '/ai-trading-bot', label: 'AI Trading Bot' },
            { href: '/managed-accounts', label: 'Managed Accounts' },
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
    return (<footer className="relative mt-24 border-t border-white/5 bg-ink-950/80">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-14">
        <div className="grid grid-cols-2 md:grid-cols-6 gap-10">
          <div className="col-span-2">
            <Link href="/" className="flex items-center gap-2">
              <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-gold-grad shadow-gold">
                <Sparkles className="h-5 w-5 text-ink-950"/>
              </span>
              <span className="text-xl font-display">
                <span className="text-gradient-gold">Aurum</span>
                <span className="text-white">X</span>
              </span>
            </Link>
            <p className="mt-4 text-sm text-white/60 max-w-xs">
              Institutional-grade digital asset platform - secure, regulated, and engineered for performance.
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
        <div className="mt-12 pt-6 border-t border-white/5 flex flex-col md:flex-row gap-3 items-center justify-between">
          <p className="text-xs text-white/50">© {new Date().getFullYear()} AurumX Capital Ltd. All rights reserved. Registered with applicable regulatory bodies.</p>
          <p className="text-xs text-white/40">Digital assets are volatile. Trade and invest responsibly.</p>
        </div>
      </div>
    </footer>);
}

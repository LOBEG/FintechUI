'use client';
import Link from 'next/link';
import { useState } from 'react';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X } from 'lucide-react';
import { ThemeToggle } from '@/components/widgets/ThemeToggle';
import { LanguageSelector } from '@/components/widgets/LanguageSelector';
import { BrandLogo } from '@/components/layout/BrandLogo';
import { useSession } from '@/lib/useSession';
export function Navbar() {
    const [open, setOpen] = useState(false);
    const pathname = usePathname();
    const { user, loading } = useSession();
    const authed = !!user && !loading;
    const showAccountNav = authed && pathname !== '/';
    const publicNav = [
        { href: '/#markets', label: 'Markets' },
        { href: '/markets/live', label: 'Live Markets' },
        { href: '/markets/signals', label: 'Signals' },
        { href: '/insights', label: 'Insights' },
        { href: '/about', label: 'About' },
    ];
    const authedNav = showAccountNav
        ? [
            { href: '/brokerage', label: 'Brokerage' },
            { href: '/dashboard/trade', label: 'Trade' },
            { href: '/dashboard/wallet', label: 'Wallet' },
            { href: '/dashboard/positions', label: 'Positions' },
            { href: '/dashboard/history', label: 'History' },
            { href: '/dashboard/analytics', label: 'Analytics' },
            { href: '/dashboard/security', label: 'Security' },
            { href: '/investor', label: 'Investor Portal' },
            ...(user?.isAdmin ? [{ href: '/admin', label: 'Admin' }] : []),
        ]
        : [];
    const nav = pathname === '/' ? publicNav : [...publicNav, ...authedNav];
    return (<header className="sticky top-0 z-40 backdrop-blur-xl bg-ink-950/60 border-b border-white/5">
      <div className="mx-auto max-w-7xl px-3 sm:px-6 lg:px-8 min-h-16 py-2 flex items-center justify-between gap-2 sm:gap-3">
        <BrandLogo compact textClassName="text-[clamp(0.68rem,3.1vw,1.2rem)] sm:text-[clamp(0.9rem,2.2vw,1.35rem)] max-w-[11.5rem] min-[380px]:max-w-[14rem] sm:max-w-none" markClassName="h-9 w-9 sm:h-11 sm:w-11 shrink-0" className="shrink min-w-0" />
        <nav className="hidden lg:flex items-center gap-1 flex-1 justify-center min-w-0">
          {nav.map((n) => (<Link key={n.href} href={n.href} className="px-3 py-2 text-sm text-white/70 hover:text-white rounded-lg hover:bg-white/5 transition-all duration-300 ease-out hover:-translate-y-0.5">
              {n.label}
            </Link>))}
        </nav>
        <div className="hidden lg:flex items-center gap-2 shrink-0">
          <LanguageSelector />
          <ThemeToggle />
          {loading ? (
            <span className="btn-ghost text-sm opacity-70">Checking session</span>
          ) : user ? (
            <Link href="/dashboard" className="btn-primary text-sm">Dashboard</Link>
          ) : (
            <>
              <Link href="/login" className="btn-ghost text-sm">Sign in</Link>
              <Link href="/signup" className="btn-primary text-sm">Create Account</Link>
            </>
          )}
        </div>
        <button onClick={() => setOpen(!open)} className="lg:hidden p-2 rounded-lg bg-white/5 border border-white/10 transition-all duration-300 ease-out active:scale-95 shrink-0" aria-label="Toggle menu">
          {open ? <X className="h-5 w-5"/> : <Menu className="h-5 w-5"/>}
        </button>
      </div>
      <AnimatePresence>
        {open && (<motion.div initial={{ height: 0, opacity: 0, y: -8 }} animate={{ height: 'auto', opacity: 1, y: 0 }} exit={{ height: 0, opacity: 0, y: -8 }} transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }} className="lg:hidden overflow-hidden border-t border-white/5">
            <div className="px-4 py-4 space-y-4 bg-ink-950/90 backdrop-blur-xl">
              <div className="space-y-2">
                {publicNav.map((n) => (<Link key={n.href} href={n.href} onClick={() => setOpen(false)} className="block px-3 py-2 rounded-lg text-white/80 hover:bg-white/5 transition-all duration-300 ease-out hover:translate-x-1">
                    {n.label}
                  </Link>))}
              </div>
              {authedNav.length > 0 && (
                <div className="border-t border-white/5 pt-3">
                  <p className="px-3 pb-2 text-[11px] uppercase tracking-[0.2em] text-white/35">Account</p>
                  <div className="space-y-1">
                    {authedNav.map((n) => (<Link key={n.href} href={n.href} onClick={() => setOpen(false)} className="block px-3 py-2 rounded-lg text-sm text-white/80 hover:bg-white/5 transition-all duration-300 ease-out hover:-translate-y-0.5">
                        {n.label}
                      </Link>))}
                  </div>
                </div>
              )}
              <div className="flex items-center gap-2 pt-2">
                <LanguageSelector />
                <ThemeToggle />
              </div>
              <div className="flex gap-2 pt-2">
                {loading ? (
                  <span className="btn-ghost flex-1 text-sm opacity-70">Checking session</span>
                ) : user ? (
                  <Link href="/dashboard" onClick={() => setOpen(false)} className="btn-primary flex-1 text-sm">Dashboard</Link>
                ) : (
                  <>
                    <Link href="/login" onClick={() => setOpen(false)} className="btn-ghost flex-1 text-sm">Sign in</Link>
                    <Link href="/signup" onClick={() => setOpen(false)} className="btn-primary flex-1 text-sm">Create Account</Link>
                  </>
                )}
              </div>
            </div>
          </motion.div>)}
      </AnimatePresence>
    </header>);
}

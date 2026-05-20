'use client';
import Link from 'next/link';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X } from 'lucide-react';
import { ThemeToggle } from '@/components/widgets/ThemeToggle';
import { LanguageSelector } from '@/components/widgets/LanguageSelector';
import { Web3ConnectButton } from '@/components/widgets/Web3ConnectButton';
import { BrandLogo } from '@/components/layout/BrandLogo';
const nav = [
    { href: '/brokerage', label: 'Brokerage' },
    { href: '/#markets', label: 'Markets' },
    { href: '/login?next=/dashboard', label: 'Trade' },
    { href: '/login?next=/investor', label: 'Investor Portal' },
    { href: '/insights', label: 'Insights' },
    { href: '/login?next=/admin', label: 'Admin' },
];
export function Navbar() {
    const [open, setOpen] = useState(false);
    return (<header className="sticky top-0 z-40 backdrop-blur-xl bg-ink-950/60 border-b border-white/5">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <BrandLogo compact textClassName="text-xl" />
        <nav className="hidden lg:flex items-center gap-1">
          {nav.map((n) => (<Link key={n.href} href={n.href} className="px-3 py-2 text-sm text-white/70 hover:text-white rounded-lg hover:bg-white/5 transition">
              {n.label}
            </Link>))}
        </nav>
        <div className="hidden lg:flex items-center gap-2">
          <LanguageSelector />
          <ThemeToggle />
          <Web3ConnectButton />
          <Link href="/login" className="btn-ghost text-sm">Sign in</Link>
          <Link href="/signup" className="btn-gold text-sm">Create Account</Link>
        </div>
        <button onClick={() => setOpen(!open)} className="lg:hidden p-2 rounded-lg bg-white/5 border border-white/10" aria-label="Toggle menu">
          {open ? <X className="h-5 w-5"/> : <Menu className="h-5 w-5"/>}
        </button>
      </div>
      <AnimatePresence>
        {open && (<motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="lg:hidden overflow-hidden border-t border-white/5">
            <div className="px-4 py-4 space-y-2 bg-ink-950/90 backdrop-blur-xl">
              {nav.map((n) => (<Link key={n.href} href={n.href} onClick={() => setOpen(false)} className="block px-3 py-2 rounded-lg text-white/80 hover:bg-white/5">
                  {n.label}
                </Link>))}
              <div className="flex items-center gap-2 pt-2">
                <LanguageSelector />
                <ThemeToggle />
              </div>
              <div className="flex gap-2 pt-2">
                <Link href="/login" className="btn-ghost flex-1 text-sm">Sign in</Link>
                <Link href="/signup" className="btn-gold flex-1 text-sm">Create Account</Link>
              </div>
            </div>
          </motion.div>)}
      </AnimatePresence>
    </header>);
}

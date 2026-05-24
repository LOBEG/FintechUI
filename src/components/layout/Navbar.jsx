'use client';
import Link from 'next/link';
import { useState } from 'react';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X, ChevronRight } from 'lucide-react';
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
        { href: '/markets/signals', label: 'Markets Intelligence' },
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
            { href: '/dashboard/security#alerts-section', label: 'Alerts' },
            { href: '/dashboard/security', label: 'Security' },
            { href: '/dashboard/security#settings-section', label: 'Settings' },
            { href: '/investor', label: 'Investor Portal' },
            ...(user?.isAdmin ? [{ href: '/admin', label: 'Admin' }] : []),
        ]
        : [];

    const close = () => setOpen(false);

    return (
        <>
            <header className="sticky top-0 z-40 backdrop-blur-xl bg-ink-950/60 border-b border-white/5">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 min-h-16 py-2 flex items-center gap-4">
                    {/* Brand — always full-width priority, never compressed */}
                    <BrandLogo
                        showMark={false}
                        className="flex-1 min-w-0"
                        textClassName="text-base sm:text-lg lg:text-xl font-semibold whitespace-nowrap"
                    />

                    {/* Right side: auth shortcuts + nav trigger */}
                    <div className="flex items-center gap-2 shrink-0">
                        <div className="hidden md:flex items-center gap-2">
                            <LanguageSelector />
                            <ThemeToggle />
                        </div>
                        {!loading && (
                            user ? (
                                <Link href="/dashboard" className="btn-primary text-sm hidden sm:inline-flex">
                                    Dashboard
                                </Link>
                            ) : (
                                <div className="hidden sm:flex gap-2">
                                    <Link href="/login" className="btn-ghost text-sm">Sign in</Link>
                                    <Link href="/signup" className="btn-primary text-sm">Get Started</Link>
                                </div>
                            )
                        )}
                        <button
                            onClick={() => setOpen(true)}
                            aria-label="Open navigation menu"
                            aria-expanded={open}
                            aria-controls="nav-drawer"
                            className="p-2 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 transition-all duration-200 active:scale-95"
                        >
                            <Menu className="h-5 w-5 text-white/80" />
                        </button>
                    </div>
                </div>
            </header>

            {/* Navigation Drawer */}
            <AnimatePresence>
                {open && (
                    <>
                        {/* Backdrop */}
                        <motion.div
                            key="nav-backdrop"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
                            onClick={close}
                            aria-hidden="true"
                        />

                        {/* Slide-in drawer */}
                        <motion.nav
                            id="nav-drawer"
                            key="nav-drawer"
                            role="dialog"
                            aria-label="Navigation menu"
                            initial={{ x: '100%' }}
                            animate={{ x: 0 }}
                            exit={{ x: '100%' }}
                            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                            className="fixed top-0 right-0 z-50 h-full w-80 max-w-[88vw] bg-ink-950 border-l border-white/10 flex flex-col shadow-2xl"
                        >
                            {/* Drawer header */}
                            <div className="flex items-center justify-between px-5 h-16 border-b border-white/5 shrink-0">
                                <div onClick={close} className="flex-1 min-w-0 cursor-pointer">
                                    <BrandLogo
                                        href="/"
                                        showMark={false}
                                        textClassName="text-sm font-semibold"
                                    />
                                </div>
                                <button
                                    onClick={close}
                                    aria-label="Close navigation menu"
                                    className="p-2 rounded-lg hover:bg-white/10 transition-colors active:scale-95"
                                >
                                    <X className="h-5 w-5 text-white/70" />
                                </button>
                            </div>

                            {/* Drawer nav items */}
                            <div className="flex-1 overflow-y-auto py-4 px-3 space-y-5">
                                {/* Public nav */}
                                <div>
                                    <p className="px-3 pb-2 text-[10px] uppercase tracking-[0.22em] text-white/35 font-semibold select-none">
                                        Explore
                                    </p>
                                    <div className="space-y-0.5">
                                        {publicNav.map((n) => (
                                            <Link
                                                key={n.href}
                                                href={n.href}
                                                onClick={close}
                                                className="flex items-center justify-between px-3 py-2.5 rounded-lg text-sm text-white/75 hover:text-white hover:bg-white/8 transition-all duration-200"
                                            >
                                                {n.label}
                                                <ChevronRight className="h-3.5 w-3.5 text-white/30 shrink-0" />
                                            </Link>
                                        ))}
                                    </div>
                                </div>

                                {/* Authenticated account nav */}
                                {authedNav.length > 0 && (
                                    <div>
                                        <p className="px-3 pb-2 text-[10px] uppercase tracking-[0.22em] text-white/35 font-semibold select-none">
                                            Account
                                        </p>
                                        <div className="space-y-0.5">
                                            {authedNav.map((n) => (
                                                <Link
                                                    key={n.href}
                                                    href={n.href}
                                                    onClick={close}
                                                    className="flex items-center justify-between px-3 py-2.5 rounded-lg text-sm text-white/75 hover:text-white hover:bg-white/8 transition-all duration-200"
                                                >
                                                    {n.label}
                                                    <ChevronRight className="h-3.5 w-3.5 text-white/30 shrink-0" />
                                                </Link>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Drawer footer */}
                            <div className="shrink-0 border-t border-white/5 px-5 py-4 space-y-3">
                                <div className="flex items-center gap-2">
                                    <LanguageSelector />
                                    <ThemeToggle />
                                </div>
                                <div className="flex gap-2">
                                    {loading ? (
                                        <span className="btn-ghost flex-1 text-sm opacity-70 text-center">
                                            Checking session…
                                        </span>
                                    ) : user ? (
                                        <Link href="/dashboard" onClick={close} className="btn-primary flex-1 text-sm text-center">
                                            Dashboard
                                        </Link>
                                    ) : (
                                        <>
                                            <Link href="/login" onClick={close} className="btn-ghost flex-1 text-sm text-center">
                                                Sign in
                                            </Link>
                                            <Link href="/signup" onClick={close} className="btn-primary flex-1 text-sm text-center">
                                                Get Started
                                            </Link>
                                        </>
                                    )}
                                </div>
                            </div>
                        </motion.nav>
                    </>
                )}
            </AnimatePresence>
        </>
    );
}

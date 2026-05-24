'use client';
import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Search, LogOut, LogIn, UserCircle, X } from 'lucide-react';
import { LanguageSelector } from '@/components/widgets/LanguageSelector';
import { ThemeToggle } from '@/components/widgets/ThemeToggle';
import { useSession } from '@/lib/useSession';
import { NotificationBell } from '@/components/dashboard/UserPanels';
import { useNotifications } from '@/components/Notifications';
import { useI18n } from '@/components/I18nProvider';
import { BrandLogo } from '@/components/layout/BrandLogo';

export function TopBar({ title }) {
    const { user, logout } = useSession();
    const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
    const router = useRouter();
    const { t } = useI18n();
    const { notify } = useNotifications();
    const memberLabel = user?.isAdmin ? 'Admin' : 'Member';
    
    return (<header className="border-b border-white/5 bg-ink-950/75 backdrop-blur-xl sticky top-0 z-30">
      <div className="min-h-16 px-3 sm:px-6 py-2 flex items-center gap-2 sm:gap-3">
        <BrandLogo compact className="lg:hidden flex-1 shrink min-w-0 max-w-[7.25rem] min-[380px]:max-w-[9.5rem] sm:max-w-[16rem]" markClassName="h-8 w-8 min-[380px]:h-9 min-[380px]:w-9 shrink-0" textClassName="text-[0.58rem] min-[380px]:text-[0.68rem] sm:text-sm leading-[0.95]" />
        <h1 className="text-lg font-display hidden sm:block text-white/90">{title}</h1>
        <div className="ml-auto flex-1 max-w-md hidden md:flex items-center gap-2 bg-white/5 border border-white/10 rounded-xl px-3 py-2 focus-within:border-slate-400/40 focus-within:ring-2 focus-within:ring-slate-400/10">
          <Search className="h-4 w-4 text-white/40" aria-hidden="true"/>
          <label htmlFor="dashboard-search" className="sr-only">Search markets, assets, and orders</label>
          <input id="dashboard-search" placeholder="Search markets, assets, orders…" className="bg-transparent outline-none text-sm flex-1 placeholder:text-white/35"/>
          <kbd className="text-[10px] text-white/35 border border-white/10 rounded px-1.5 py-0.5">⌘K</kbd>
        </div>
        <div className="ml-auto flex items-center gap-1.5 sm:gap-2 shrink-0">
          <button
            type="button"
            onClick={() => setMobileSearchOpen((open) => !open)}
            aria-label={mobileSearchOpen ? 'Close mobile search' : 'Open mobile search'}
            aria-expanded={mobileSearchOpen}
            className="btn-ghost btn-icon md:hidden"
          >
            {mobileSearchOpen ? <X className="h-4 w-4"/> : <Search className="h-4 w-4"/>}
          </button>
          <LanguageSelector />
          <ThemeToggle />
          {user && <NotificationBell />}
          {user ? (
            <div className="flex items-center gap-2 pl-2 border-l border-white/10">
              <div title={user.email} className="h-9 w-9 rounded-full bg-slate-700/60 border border-slate-500/50 text-slate-100 font-semibold text-xs inline-flex items-center justify-center shrink-0 select-none uppercase tracking-wide">
                {(() => {
                  const src = (user.name || user.email || '').trim();
                  const parts = src.split(/\s+/).filter(Boolean);
                  if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`;
                  if (parts.length === 1) return parts[0].slice(0, 2);
                  return <UserCircle className="h-5 w-5"/>;
                })()}
              </div>
              <div className="text-xs leading-tight hidden md:block min-w-0">
                <div className="font-medium text-white/90 truncate max-w-[120px]">{user.name || user.email.split('@')[0]}</div>
                <div className="text-white/45">{memberLabel}</div>
              </div>
              <button
                onClick={async () => { await logout(); notify({ level: 'info', title: 'Signed out', message: 'You have been securely signed out.' }); router.push('/'); }}
                aria-label={t('logout')}
                title={t('logout')}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-white/70 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 transition-all duration-200"
              >
                <LogOut className="h-3.5 w-3.5 shrink-0"/>
                <span className="hidden sm:inline">Sign out</span>
              </button>
            </div>
          ) : (
            <Link href="/login" className="btn-ghost text-sm"><LogIn className="h-4 w-4"/> Sign in</Link>
          )}
        </div>
      </div>
      {mobileSearchOpen && (
        <div className="md:hidden px-4 sm:px-6 pb-3">
          <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-xl px-3 py-2 focus-within:border-slate-400/40 focus-within:ring-2 focus-within:ring-slate-400/10">
            <Search className="h-4 w-4 text-white/40" aria-hidden="true"/>
            <label htmlFor="dashboard-mobile-search" className="sr-only">Search markets, assets, and orders</label>
            <input id="dashboard-mobile-search" autoFocus placeholder="Search markets, assets, orders…" className="bg-transparent outline-none text-sm flex-1 placeholder:text-white/35"/>
          </div>
        </div>
      )}
    </header>);
}

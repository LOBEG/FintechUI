'use client';
import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Search, LogOut, LogIn, X, MoreVertical } from 'lucide-react';
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
    const [actionsOpen, setActionsOpen] = useState(false);
    const router = useRouter();
    const { t } = useI18n();
    const { notify } = useNotifications();
    const memberLabel = user?.isAdmin ? 'Admin' : 'Member';
    
    const signOut = async () => {
        await logout();
        setActionsOpen(false);
        notify({ level: 'info', title: 'Signed out', message: 'You have been securely signed out.' });
        router.push('/');
    };
    
    return (<header className="border-b border-white/5 bg-ink-950/75 backdrop-blur-xl sticky top-0 z-30">
      <div className="min-h-16 px-3 sm:px-6 py-2 flex items-center gap-2 sm:gap-3">
        <BrandLogo
          className="flex-1 min-w-0 sm:flex-none"
          markClassName="h-8 w-8 min-[380px]:h-9 min-[380px]:w-9 sm:h-10 sm:w-10 shrink-0"
          textClassName="text-[0.68rem] min-[380px]:text-xs sm:text-sm xl:text-base leading-tight"
        />
        <h1 className="text-lg font-display hidden xl:block text-white/90">{title}</h1>
        <div className="ml-auto flex-1 max-w-md hidden lg:flex items-center gap-2 bg-white/5 border border-white/10 rounded-xl px-3 py-2 focus-within:border-slate-400/40 focus-within:ring-2 focus-within:ring-slate-400/10">
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
          <div className="relative">
            <button
              type="button"
              onClick={() => setActionsOpen((open) => !open)}
              aria-label="Open header actions"
              aria-expanded={actionsOpen}
              aria-controls="header-actions-menu"
              className="btn-ghost btn-icon"
            >
              <MoreVertical className="h-4 w-4"/>
            </button>
            {actionsOpen && (
              <div id="header-actions-menu" className="absolute right-0 mt-2 w-72 rounded-2xl border border-white/10 bg-ink-950/95 p-3 shadow-2xl shadow-black/40 backdrop-blur-xl z-[80]">
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-3 rounded-xl bg-white/5 px-3 py-2">
                    <span className="text-xs font-medium text-white/65">Language</span>
                    <LanguageSelector />
                  </div>
                  <div className="flex items-center justify-between gap-3 rounded-xl bg-white/5 px-3 py-2">
                    <span className="text-xs font-medium text-white/65">Theme</span>
                    <ThemeToggle />
                  </div>
                  {user && (
                    <div className="flex items-center justify-between gap-3 rounded-xl bg-white/5 px-3 py-2">
                      <span className="text-xs font-medium text-white/65">Alerts</span>
                      <NotificationBell />
                    </div>
                  )}
                </div>
                <div className="mt-3 border-t border-white/10 pt-3">
                  {user ? (
                    <button
                      onClick={signOut}
                      aria-label={t('logout')}
                      title={t('logout')}
                      className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-sm font-medium text-white/75 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 transition-all duration-200"
                    >
                      <LogOut className="h-4 w-4 shrink-0"/>
                      Sign out
                    </button>
                  ) : (
                    <Link href="/login" onClick={() => setActionsOpen(false)} className="btn-ghost w-full justify-center text-sm"><LogIn className="h-4 w-4"/> Sign in</Link>
                  )}
                </div>
              </div>
            )}
          </div>
          {user ? (
            <div className="hidden md:flex items-center gap-2 pl-2 border-l border-white/10">
              <div className="text-xs leading-tight hidden md:block min-w-0">
                <div className="font-medium text-white/90 truncate max-w-[120px]">{user.name || user.email.split('@')[0]}</div>
                <div className="text-white/45">{memberLabel}</div>
              </div>
            </div>
          ) : (
            <Link href="/login" className="btn-ghost text-sm hidden sm:inline-flex"><LogIn className="h-4 w-4"/> Sign in</Link>
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

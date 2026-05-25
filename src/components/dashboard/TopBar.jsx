'use client';
import Link from 'next/link';
import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Search, LogOut, LogIn, Menu } from 'lucide-react';
import { LanguageSelector } from '@/components/widgets/LanguageSelector';
import { ThemeToggle } from '@/components/widgets/ThemeToggle';
import { useSession } from '@/lib/useSession';
import { NotificationBell } from '@/components/dashboard/UserPanels';
import { useNotifications } from '@/components/Notifications';
import { useI18n } from '@/components/I18nProvider';
import { BrandLogo } from '@/components/layout/BrandLogo';
import { DASHBOARD_FEATURES } from '@/app/dashboard/dashboardFeatures';

const HEADER_SEARCH_LINKS = [
    ...DASHBOARD_FEATURES.map((feature) => ({
        href: feature.path,
        label: feature.label,
        description: feature.blurb,
    })),
    { href: '/brokerage', label: 'Brokerage markets', description: 'Stocks, ETFs, indices, forex, futures, commodities, and crypto.' },
    { href: '/markets/live', label: 'Live markets', description: 'Real-time multi-asset market coverage.' },
    { href: '/markets/signals', label: 'Markets Intelligence', description: 'Signals, alerts, and institutional market intelligence.' },
    { href: '/admin', label: 'Admin console', description: 'Users, KYC, transactions, tickets, wallets, and settings.' },
];

function HeaderSearch({ id, value, onChange, onSelect, compact = false }) {
    const query = value.trim().toLowerCase();
    const results = useMemo(() => {
        if (!query) return [];
        return HEADER_SEARCH_LINKS.filter((item) => `${item.label} ${item.description}`.toLowerCase().includes(query)).slice(0, 5);
    }, [query]);

    const submitFirst = (event) => {
        if (event.key === 'Enter' && results[0]) {
            event.preventDefault();
            onSelect(results[0].href);
        }
    };

    return (
        <div className="relative w-full">
            <div className="flex min-h-10 items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-white shadow-inner shadow-black/10 transition focus-within:border-slate-400/40 focus-within:ring-2 focus-within:ring-slate-400/10">
                <Search className="h-4 w-4 shrink-0 text-white/55" aria-hidden="true"/>
                <label htmlFor={id} className="sr-only">Search markets, assets, and dashboard sections</label>
                <input
                    id={id}
                    type="search"
                    value={value}
                    onChange={(event) => onChange(event.target.value)}
                    onKeyDown={submitFirst}
                    placeholder={compact ? 'Search dashboard…' : 'Search markets, assets, orders…'}
                    className="min-w-0 flex-1 bg-transparent text-sm text-white outline-none placeholder:text-white/45"
                />
                {!compact && <kbd className="hidden sm:inline-flex rounded border border-white/10 px-1.5 py-0.5 text-[10px] text-white/35">Enter</kbd>}
            </div>
            {query && (
                <div className="absolute left-0 right-0 top-full z-[90] mt-2 overflow-hidden rounded-2xl border border-white/10 bg-ink-950/95 shadow-2xl shadow-black/40 backdrop-blur-xl">
                    {results.length > 0 ? (
                        results.map((item) => (
                            <button
                                key={`${id}-${item.href}`}
                                type="button"
                                onMouseDown={(event) => event.preventDefault()}
                                onClick={() => onSelect(item.href)}
                                className="flex w-full flex-col items-start gap-0.5 px-3 py-2.5 text-left transition hover:bg-white/10 focus-visible:bg-white/10 focus-visible:outline-none active:bg-white/15"
                            >
                                <span className="text-sm font-semibold text-white">{item.label}</span>
                                <span className="text-xs leading-snug text-white/55">{item.description}</span>
                            </button>
                        ))
                    ) : (
                        <div className="px-3 py-2.5 text-sm text-white/55">No matching sections found.</div>
                    )}
                </div>
            )}
        </div>
    );
}

export function TopBar({ title }) {
    const { user, logout } = useSession();
    const [actionsOpen, setActionsOpen] = useState(false);
    const [search, setSearch] = useState('');
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

    const selectSearchResult = (href) => {
        setSearch('');
        setActionsOpen(false);
        router.push(href);
    };
    
    return (<header className="border-b border-white/5 bg-ink-950/75 backdrop-blur-xl sticky top-0 z-40 overflow-visible">
      <div className="min-h-16 px-3 sm:px-6 py-2 flex items-center gap-2 sm:gap-3">
        <BrandLogo
          className="shrink-0 min-w-0"
          markClassName="h-8 w-8 min-[380px]:h-9 min-[380px]:w-9 sm:h-10 sm:w-10 shrink-0"
          textClassName="text-[0.68rem] min-[380px]:text-xs sm:text-sm xl:text-base leading-tight"
        />
        <h1 className="text-lg font-display hidden xl:block text-white/90 shrink-0">{title}</h1>
        <div className="ml-auto hidden w-full max-w-md flex-1 lg:block">
          <HeaderSearch id="dashboard-search" value={search} onChange={setSearch} onSelect={selectSearchResult} />
        </div>
        <div className="ml-auto flex items-center gap-1.5 sm:gap-2 shrink-0">
          <div className="relative">
            <button
              type="button"
              onClick={() => setActionsOpen((open) => !open)}
              aria-label="Open header menu"
              aria-expanded={actionsOpen}
              aria-controls="header-actions-menu"
              className="relative z-10 inline-flex h-10 w-10 items-center justify-center rounded-xl border border-white/20 bg-white/10 text-white shadow-lg shadow-black/20 transition-all duration-200 hover:bg-white/20 hover:text-white hover:border-white/30 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-300 active:scale-95"
            >
              <Menu className="h-5 w-5"/>
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
      <div className="relative px-3 sm:px-6 pb-3 lg:hidden">
        <HeaderSearch id="dashboard-mobile-search" value={search} onChange={setSearch} onSelect={selectSearchResult} compact />
      </div>
    </header>);
}

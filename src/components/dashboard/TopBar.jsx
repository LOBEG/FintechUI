'use client';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Search, LogOut, LogIn, UserCircle } from 'lucide-react';
import { Web3ConnectButton } from '@/components/widgets/Web3ConnectButton';
import { LanguageSelector } from '@/components/widgets/LanguageSelector';
import { ThemeToggle } from '@/components/widgets/ThemeToggle';
import { useSession } from '@/lib/useSession';
import { NotificationBell } from '@/components/dashboard/UserPanels';
import { useNotifications } from '@/components/Notifications';
import { useI18n } from '@/components/I18nProvider';

export function TopBar({ title }) {
    const { user, logout } = useSession();
    const router = useRouter();
    const { t } = useI18n();
    const { notify } = useNotifications();
    const memberLabel = user?.isAdmin ? 'Admin' : 'Member';
    
    return (<header className="h-16 border-b border-white/5 bg-ink-950/60 backdrop-blur-xl sticky top-0 z-30">
      <div className="h-full px-4 sm:px-6 flex items-center gap-3">
        <h1 className="text-lg font-display hidden sm:block">{title}</h1>
        <div className="ml-auto flex-1 max-w-md hidden md:flex items-center gap-2 bg-white/5 border border-white/10 rounded-xl px-3 py-2">
          <Search className="h-4 w-4 text-white/40"/>
          <input placeholder="Search markets, assets, orders…" className="bg-transparent outline-none text-sm flex-1 placeholder:text-white/40"/>
          <kbd className="text-[10px] text-white/40 border border-white/10 rounded px-1.5 py-0.5">⌘K</kbd>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <LanguageSelector />
          <ThemeToggle />
          {user && <NotificationBell />}
          <Web3ConnectButton />
          {user ? (
            <div className="flex items-center gap-2 pl-2">
              <div title={user.email} className="h-9 w-9 rounded-full bg-white/5 border border-neon-green/30 text-cyan inline-flex items-center justify-center">
                <UserCircle className="h-5 w-5"/>
              </div>
              <div className="text-xs leading-tight hidden md:block">
                <div className="font-medium">{user.name || user.email.split('@')[0]}</div>
                <div className="text-white/45">{memberLabel}</div>
              </div>
              <button onClick={async () => { await logout(); notify({ level: 'info', title: 'Signed out', message: 'You have been securely signed out.' }); router.push('/'); }} aria-label={t('logout')} title={t('logout')} className="h-9 w-9 rounded-lg bg-white/5 border border-white/10 inline-flex items-center justify-center hover:bg-white/10">
                <LogOut className="h-4 w-4"/>
              </button>
            </div>
          ) : (
            <Link href="/login" className="btn-ghost text-sm"><LogIn className="h-4 w-4"/> Sign in</Link>
          )}
        </div>
      </div>
    </header>);
}

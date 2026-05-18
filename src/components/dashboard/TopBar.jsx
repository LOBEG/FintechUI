'use client';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Search, ChevronDown, LogOut, LogIn } from 'lucide-react';
import { Web3ConnectButton } from '@/components/widgets/Web3ConnectButton';
import { LanguageSelector } from '@/components/widgets/LanguageSelector';
import { ThemeToggle } from '@/components/widgets/ThemeToggle';
import { useSession } from '@/lib/useSession';
import { NotificationBell } from '@/components/dashboard/UserPanels';
export function TopBar({ title }) {
    const { user, logout } = useSession();
    const router = useRouter();
    const initials = user ? (user.name || user.email).split(/\s+/).map((s) => s[0]).join('').slice(0, 2).toUpperCase() : 'AV';
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
            <div className="hidden sm:flex items-center gap-2 pl-2">
              <div title={user.email} className="h-9 w-9 rounded-full bg-gold-grad text-ink-950 inline-flex items-center justify-center font-semibold text-sm">{initials}</div>
              <div className="text-xs leading-tight hidden md:block">
                <div className="font-medium">{user.name || user.email.split('@')[0]}</div>
                <div className="text-white/45">{user.isAdmin ? 'Admin' : 'Member'}</div>
              </div>
              <button onClick={async () => { await logout(); router.push('/'); }} aria-label="Sign out" className="h-9 w-9 rounded-lg bg-white/5 border border-white/10 inline-flex items-center justify-center hover:bg-white/10">
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


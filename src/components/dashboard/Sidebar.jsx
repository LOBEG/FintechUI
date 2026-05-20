'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, CandlestickChart, Wallet, History, PieChart, Bot, Settings, ShieldCheck, Briefcase, Bell, Sparkles, LogOut, } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useSession } from '@/lib/useSession';
import { useI18n } from '@/components/I18nProvider';

const items = [
    { href: '/dashboard', label: 'overview', icon: LayoutDashboard },
    { href: '/dashboard#trade-section', label: 'trade', icon: CandlestickChart },
    { href: '/dashboard#wallet', label: 'wallet', icon: Wallet },
    { href: '/dashboard#positions-section', label: 'positions', icon: Briefcase },
    { href: '/dashboard#history-section', label: 'history', icon: History },
    { href: '/dashboard#analytics-section', label: 'analytics', icon: PieChart },
    { href: '/dashboard#bot-section', label: 'aiBot', icon: Bot },
    { href: '/dashboard#alerts-section', label: 'alerts', icon: Bell },
    { href: '/dashboard#security-section', label: 'security', icon: ShieldCheck },
    { href: '/dashboard#settings-section', label: 'settings', icon: Settings },
];

export function Sidebar() {
    const pathname = usePathname();
    const { user, logout } = useSession();
    const { t } = useI18n();
    const initials = user ? (user.name || user.email).split(/\s+/).map((s) => s[0]).join('').slice(0, 2).toUpperCase() : '';
    const shortId = user?.id ? `#${user.id.slice(0, 6).toUpperCase()}` : '';
    
    return (<aside className="hidden lg:flex w-60 shrink-0 flex-col border-r border-white/5 bg-ink-950/60 backdrop-blur-xl sticky top-0 h-screen">
      <Link href="/" className="flex items-center gap-2 px-5 h-16 border-b border-white/5">
        <span className="h-8 w-8 rounded-lg bg-gold-grad inline-flex items-center justify-center text-ink-950">
          <Sparkles className="h-4 w-4"/>
        </span>
        <span className="text-lg font-display">
          <span className="text-gradient-gold">Aurum</span>X
        </span>
      </Link>
      <nav className="flex-1 overflow-y-auto p-3 space-y-1">
        {items.map((it) => {
            const active = it.href === '/dashboard' && pathname === '/dashboard';
            const Icon = it.icon;
            const href = user || it.href === '/dashboard' ? it.href : `/login?next=${encodeURIComponent(it.href)}`;
            return (<Link key={it.label} href={href} className={cn('flex items-center gap-3 px-3 py-2 rounded-lg text-sm', active ? 'bg-white/10 text-white' : 'text-white/65 hover:bg-white/5 hover:text-white')}>
              <Icon className="h-4 w-4"/>
              {t(it.label)}
            </Link>);
        })}
      </nav>
      {user && <div className="p-3 border-t border-white/5">
        <div className="glass-light p-3">
          <div className="flex items-center gap-2">
            <div title={user.email} className="h-9 w-9 rounded-full bg-gold-grad text-ink-950 inline-flex items-center justify-center font-semibold">{initials}</div>
            <div className="text-xs">
              <p className="font-semibold truncate max-w-[105px]">{user.name || user.email.split('@')[0]}</p>
              <p className="text-white/50">{shortId || (user.isAdmin ? 'Admin' : 'Member')}</p>
            </div>
            <button onClick={logout} className="ml-auto p-1.5 rounded hover:bg-white/10" aria-label={t('logout')}>
              <LogOut className="h-4 w-4"/>
            </button>
          </div>
        </div>
      </div>}
    </aside>);
}

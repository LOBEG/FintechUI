'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { TrendingUp, Wallet, ListOrdered, History, BarChart3, Bot, Bell, ShieldCheck, Settings, Briefcase } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useI18n } from '@/components/I18nProvider';
import { useSession } from '@/lib/useSession';

const items = [
    { href: '/brokerage', label: 'brokerage', icon: Briefcase, fallback: 'Brokerage' },
    { href: '/dashboard/trade', label: 'trade', icon: TrendingUp },
    { href: '/dashboard/wallet', label: 'wallet', icon: Wallet },
    { href: '/dashboard/positions', label: 'positions', icon: ListOrdered },
    { href: '/dashboard/history', label: 'history', icon: History },
    { href: '/dashboard/analytics', label: 'analytics', icon: BarChart3 },
    { href: '/dashboard/analytics#bot-section', label: 'aiBot', icon: Bot },
    { href: '/dashboard/security#alerts-section', label: 'alerts', icon: Bell },
    { href: '/dashboard/security', label: 'security', icon: ShieldCheck },
    { href: '/dashboard/security#settings-section', label: 'settings', icon: Settings },
    { href: '/admin', label: 'admin', icon: Settings, fallback: 'Admin', adminOnly: true },
];

export function MobileBottomNav() {
    const pathname = usePathname();
    const { t } = useI18n();
    const { user, loading } = useSession();
    
    if (loading || !user) return null;
    
    return (<nav aria-label="Authenticated mobile navigation" className="lg:hidden fixed bottom-0 inset-x-0 z-30 border-t border-white/10 bg-ink-950/90 backdrop-blur-xl pb-[env(safe-area-inset-bottom)]">
      <ul className="flex overflow-x-auto no-scrollbar snap-x snap-mandatory px-1">
        {items.filter((it) => !it.adminOnly || user?.isAdmin).map((it) => {
            const Icon = it.icon;
            const route = it.href.split('#')[0];
            const active = pathname === route || (route !== '/brokerage' && pathname?.startsWith(`${route}/`));
            const label = it.fallback ? (t(it.label) === it.label ? it.fallback : t(it.label)) : t(it.label);
            return (<li key={`${it.label}-${it.href}`} className="snap-start">
              <Link href={it.href} className={cn('flex flex-col items-center justify-center gap-1 py-2 px-3 text-[10px] sm:text-[11px] min-w-[68px] rounded-xl transition-all duration-300 ease-out', active ? 'text-accent-success bg-accent-success/10' : 'text-white/60 hover:text-white hover:bg-white/5')}>
                <Icon className="h-5 w-5"/>
                <span>{label}</span>
              </Link>
            </li>);
        })}
      </ul>
    </nav>);
}

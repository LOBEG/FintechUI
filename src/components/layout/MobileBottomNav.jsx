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
    { href: '/markets/signals', label: 'marketsIntelligence', icon: BarChart3, fallback: 'Markets Intelligence' },
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
    
    return (<nav aria-label="Authenticated mobile navigation" className="lg:hidden fixed bottom-0 inset-x-0 z-30 border-t border-white/10 bg-ink-950/95 backdrop-blur-xl pb-[env(safe-area-inset-bottom)]">
      <ul className="flex overflow-x-auto no-scrollbar snap-x snap-mandatory px-2 gap-1 py-1">
        {items.filter((it) => !it.adminOnly || user?.isAdmin).map((it) => {
            const Icon = it.icon;
            const route = it.href.split('#')[0];
            const active = pathname === route || (route !== '/brokerage' && pathname?.startsWith(`${route}/`));
            const label = it.fallback ? (t(it.label) === it.label ? it.fallback : t(it.label)) : t(it.label);
            return (<li key={`${it.label}-${it.href}`} className="snap-start shrink-0">
              <Link href={it.href} className={cn('flex flex-col items-center justify-center gap-1.5 py-2.5 px-3 text-[10px] sm:text-[11px] min-w-[92px] rounded-xl transition-all duration-200 ease-out active:scale-95', active ? 'text-accent-success bg-accent-success/10 border border-accent-success/25' : 'text-white/55 hover:text-white/90 hover:bg-white/5 border border-transparent')}>
                <Icon className="h-[18px] w-[18px] shrink-0"/>
                <span className="font-medium leading-tight text-center whitespace-normal">{label}</span>
              </Link>
            </li>);
        })}
      </ul>
    </nav>);
}

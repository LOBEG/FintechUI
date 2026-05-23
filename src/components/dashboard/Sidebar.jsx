'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, CandlestickChart, Wallet, History, PieChart, Bot, Settings, ShieldCheck, Briefcase, Bell, } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useSession } from '@/lib/useSession';
import { useI18n } from '@/components/I18nProvider';
import { BrandLogo } from '@/components/layout/BrandLogo';

const items = [
    { href: '/dashboard', label: 'overview', icon: LayoutDashboard },
    { href: '/brokerage', label: 'brokerage', icon: Briefcase },
    { href: '/dashboard/trade', label: 'trade', icon: CandlestickChart },
    { href: '/dashboard/wallet', label: 'wallet', icon: Wallet },
    { href: '/dashboard/positions', label: 'positions', icon: Briefcase },
    { href: '/dashboard/history', label: 'history', icon: History },
    { href: '/dashboard/analytics', label: 'analytics', icon: PieChart },
    { href: '/dashboard/analytics#bot-section', label: 'aiBot', icon: Bot },
    { href: '/dashboard/security#alerts-section', label: 'alerts', icon: Bell },
    { href: '/dashboard/security', label: 'security', icon: ShieldCheck },
    { href: '/dashboard/security#settings-section', label: 'settings', icon: Settings },
    { href: '/admin', label: 'admin', icon: Settings, adminOnly: true },
];

export function Sidebar() {
    const pathname = usePathname();
    const { user } = useSession();
    const { t } = useI18n();
    const visibleItems = items.filter((it) => !it.adminOnly || user?.isAdmin);
    
    return (<aside className="hidden lg:flex w-60 shrink-0 flex-col border-r border-white/5 bg-ink-950/60 backdrop-blur-xl sticky top-0 h-screen">
      <BrandLogo compact className="px-4 h-16 border-b border-white/5" markClassName="h-10 w-10" textClassName="text-lg" />
      <nav className="flex-1 overflow-y-auto p-3 space-y-1">
        {visibleItems.map((it) => {
            const route = it.href.split('#')[0];
            const active = route === pathname || (route === '/dashboard' && pathname === '/dashboard');
            const Icon = it.icon;
            const publicRoute = route === '/dashboard' || route === '/brokerage';
            const href = user || publicRoute ? it.href : `/login?next=${encodeURIComponent(it.href)}`;
            return (<Link key={`${it.label}-${it.href}`} href={href} className={cn('flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-400', active ? 'bg-white/10 text-white' : 'text-white/65 hover:bg-white/5 hover:text-white')}>
              <Icon className="h-4 w-4"/>
              {t(it.label)}
            </Link>);
        })}
      </nav>
    </aside>);
}
